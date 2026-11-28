///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	A 2D texture: an image, and how to sample it.
//
//	The image is a decoded browser image (an ImageBitmap or a canvas), or raw
//	pixels: red, green, blue, and alpha, 8 bits each, the top row first.
//	Nothing is flipped, because the origin of WebGPU's and glTF's textures is
//	the top left. The alpha is kept as it is, not pre-multiplied, because the
//	shaders pre-multiply at the end.
//
//	A color texture is sRGB, like images are, so the GPU turns its pixels into
//	linear values when the shaders sample them. Set srgb to false for data,
//	like normal maps.
//
//	By default a texture has mipmaps: smaller copies of the image, each half
//	the size of the one before, down to one pixel. They're made on the GPU
//	(see Mipmaps.ts), and the sampler blends between them (trilinear
//	filtering), so a texture seen small or far away is smooth instead of
//	sparkling.
//
//	The GPU texture is made when it's first needed, and again after the
//	device is lost or the image changes. When nothing uses the texture any
//	more (see Base.ref() and unref()), the GPU texture is destroyed, but the
//	image is kept, so it can be used again.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base/Base";
import { Device } from "../Tools/Device";
import { generateMipmaps } from "./Mipmaps";
import { getSampler } from "./Samplers";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

// Raw pixels: red, green, blue, and alpha, 8 bits each, the top row first.
export interface IRawImage
{
	width: number;
	height: number;
	data: Uint8Array;
}

// What a texture's image can be.
export type ITextureImage = ( ImageBitmap | HTMLCanvasElement | OffscreenCanvas | IRawImage );

// How the texture is sampled. The mipmap filter is only used when the
// texture has mipmaps.
export interface ISamplerSettings
{
	wrapU: GPUAddressMode;
	wrapV: GPUAddressMode;
	magFilter: GPUFilterMode;
	minFilter: GPUFilterMode;
	mipmapFilter: GPUMipmapFilterMode;
}

export interface ITextureInput extends Partial < ISamplerSettings >
{
	image: ITextureImage;
	srgb?: boolean;
	mipmaps?: boolean;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the image is raw pixels.
 * @param {ITextureImage} image - The image.
 * @returns {boolean} True if it's raw pixels.
 */
///////////////////////////////////////////////////////////////////////////////

const isRawImage = ( image: ITextureImage ) : image is IRawImage =>
{
	return ( "data" in image );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * A 2D texture.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Texture extends BaseClass
{
	// The total size of all the GPU textures that exist, in bytes.
	static #totalBytes = 0;

	#image: ITextureImage;
	#srgb = true;
	#mipmaps = true;
	#sampler: ISamplerSettings = { wrapU: "repeat", wrapV: "repeat", magFilter: "linear", minFilter: "linear", mipmapFilter: "linear" };
	#texture: ( GPUTexture | null ) = null;
	#view: ( GPUTextureView | null ) = null;
	#device = 0; // The id of the device the texture was made with.

	/**
	 * Construct the class.
	 * @class
	 * @param {ITextureInput} input - The image, and how to sample it. The
	 * defaults are sRGB, mipmaps, repeat, and linear filtering, including
	 * between the mipmaps.
	 */
	constructor ( input: Readonly<ITextureInput> )
	{
		super();
		Texture.checkImage ( input.image );
		this.#image = input.image;
		this.#srgb = ( input.srgb ?? true );
		this.#mipmaps = ( input.mipmaps ?? true );
		const { wrapU, wrapV, magFilter, minFilter, mipmapFilter } = input;
		this.#sampler = {
			wrapU: ( wrapU ?? "repeat" ),
			wrapV: ( wrapV ?? "repeat" ),
			magFilter: ( magFilter ?? "linear" ),
			minFilter: ( minFilter ?? "linear" ),
			mipmapFilter: ( mipmapFilter ?? "linear" ),
		};
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Textures.Texture";
	}

	/**
	 * Get the total size of all the GPU textures that exist, in bytes.
	 * @returns {number} The size in bytes.
	 */
	public static get totalBytes() : number
	{
		return Texture.#totalBytes;
	}

	/**
	 * Throw if the image can't be used.
	 * @param {ITextureImage} image - The image.
	 */
	protected static checkImage ( image: ITextureImage ) : void
	{
		const { width, height } = image;
		if ( !( ( width > 0 ) && ( height > 0 ) && Number.isInteger ( width ) && Number.isInteger ( height ) ) )
		{
			throw new Error ( `Texture image is ${width} by ${height} pixels` );
		}
		if ( isRawImage ( image ) && ( image.data.length !== ( width * height * 4 ) ) )
		{
			throw new Error ( `Texture image of ${width} by ${height} pixels has ${image.data.length} bytes instead of ${width * height * 4}` );
		}
	}

	/**
	 * Get the image.
	 * @returns {ITextureImage} The image.
	 */
	public get image() : ITextureImage
	{
		return this.#image;
	}

	/**
	 * Set the image. The GPU texture is made again when it's next needed.
	 * Set it between frames, not during the draw stage.
	 * @param {ITextureImage} image - The image.
	 */
	public set image ( image: ITextureImage )
	{
		Texture.checkImage ( image );
		this.#image = image;
		this.releaseGpuObjects();
	}

	/**
	 * Get the width of the image, in pixels.
	 * @returns {number} The width.
	 */
	public get width() : number
	{
		return this.#image.width;
	}

	/**
	 * Get the height of the image, in pixels.
	 * @returns {number} The height.
	 */
	public get height() : number
	{
		return this.#image.height;
	}

	/**
	 * See if this is a color texture, whose pixels are sRGB.
	 * @returns {boolean} True if the pixels are sRGB.
	 */
	public get srgb() : boolean
	{
		return this.#srgb;
	}

	/**
	 * Set whether this is a color texture, whose pixels are sRGB, or data.
	 * @param {boolean} srgb - True if the pixels are sRGB.
	 */
	public set srgb ( srgb: boolean )
	{
		if ( srgb !== this.#srgb )
		{
			this.#srgb = srgb;
			this.releaseGpuObjects();
		}
	}

	/**
	 * See if this texture has mipmaps.
	 * @returns {boolean} True if it has mipmaps.
	 */
	public get mipmaps() : boolean
	{
		return this.#mipmaps;
	}

	/**
	 * Set whether this texture has mipmaps.
	 * @param {boolean} mipmaps - True if it has mipmaps.
	 */
	public set mipmaps ( mipmaps: boolean )
	{
		if ( mipmaps !== this.#mipmaps )
		{
			this.#mipmaps = mipmaps;
			this.releaseGpuObjects();
		}
	}

	/**
	 * Get the number of levels of the GPU texture: one for the image, and
	 * with mipmaps, one more for each halving of its larger side down to one
	 * pixel.
	 * @returns {number} The number of levels.
	 */
	public get numLevels() : number
	{
		const largest = Math.max ( this.width, this.height );
		return ( this.#mipmaps ? ( Math.floor ( Math.log2 ( largest ) ) + 1 ) : 1 );
	}

	/**
	 * Get the format of the GPU texture.
	 * @returns {GPUTextureFormat} The format.
	 */
	public get format() : GPUTextureFormat
	{
		return ( this.#srgb ? "rgba8unorm-srgb" : "rgba8unorm" );
	}

	/**
	 * Get how the texture is sampled.
	 * @returns {ISamplerSettings} The settings.
	 */
	public get samplerSettings() : Readonly<ISamplerSettings>
	{
		return this.#sampler;
	}

	/**
	 * Set how the texture is sampled. What's left out stays the same.
	 * @param {ISamplerSettings} settings - The settings to change.
	 */
	public set samplerSettings ( settings: Readonly<Partial<ISamplerSettings>> )
	{
		this.#sampler = { ...this.#sampler, ...settings };
	}

	/**
	 * Get the sampler. Samplers with the same settings are shared.
	 * @returns {GPUSampler} The sampler.
	 */
	public get sampler() : GPUSampler
	{
		return getSampler ( this.#sampler );
	}

	/**
	 * Get the view of the GPU texture, making the texture if we have to.
	 * @returns {GPUTextureView} The view.
	 */
	public get view() : GPUTextureView
	{
		this.makeTextureIfNeeded();
		return this.#view!;
	}

	/**
	 * Get the GPU texture, making it if we have to. It can be copied from,
	 * for example to read its pixels back.
	 * @returns {GPUTexture} The texture.
	 */
	public get gpuTexture() : GPUTexture
	{
		this.makeTextureIfNeeded();
		return this.#texture!;
	}

	/**
	 * Make the GPU texture if we don't have one for the current device.
	 */
	protected makeTextureIfNeeded() : void
	{
		// A texture from a device that was lost can't be used with the new one.
		if ( this.#texture && ( this.#device !== Device.instance.id ) )
		{
			this.releaseGpuObjects();
		}

		// Make it if we have to.
		if ( ( !this.#texture ) || ( !this.#view ) )
		{
			this.makeTexture();
		}
	}

	/**
	 * Get the size of the GPU texture in bytes, with all its levels.
	 * @param {GPUTexture} texture - The texture.
	 * @returns {number} The size in bytes.
	 */
	protected static getBytes ( texture: GPUTexture ) : number
	{
		let bytes = 0;
		for ( let level = 0; level < texture.mipLevelCount; ++level )
		{
			bytes += ( Math.max ( 1, ( texture.width >> level ) ) * Math.max ( 1, ( texture.height >> level ) ) * 4 );
		}
		return bytes;
	}

	/**
	 * Make the GPU texture and fill it with the image.
	 */
	protected makeTexture() : void
	{
		const { device } = Device.instance;
		const image = this.#image;
		const { width, height } = image;

		// The size has to fit.
		const max = device.limits.maxTextureDimension2D;
		if ( ( width > max ) || ( height > max ) )
		{
			throw new Error ( `Texture image of ${width} by ${height} pixels is larger than this GPU's limit of ${max}` );
		}

		// Make the texture. It's drawn into to make the mipmaps.
		const texture = device.createTexture ( {
			label: `Texture ${this.id}`,
			size: [ width, height ],
			format: this.format,
			mipLevelCount: this.numLevels,
			usage: ( GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT ),
		} );

		// Fill it.
		if ( isRawImage ( image ) )
		{
			// Pass the underlying buffer and offset, because the data may be a
			// view into part of a larger buffer.
			const { data } = image;
			device.queue.writeTexture ( { texture }, data.buffer, { offset: data.byteOffset, bytesPerRow: ( width * 4 ) }, [ width, height ] );
		}
		else
		{
			device.queue.copyExternalImageToTexture ( { source: image }, { texture, premultipliedAlpha: false }, [ width, height ] );
		}

		// Make the mipmaps from the image.
		if ( texture.mipLevelCount > 1 )
		{
			generateMipmaps ( texture );
		}

		// Save it.
		this.#texture = texture;
		this.#view = texture.createView ( { label: `View of texture ${this.id}` } );
		this.#device = Device.instance.id;
		Texture.#totalBytes += Texture.getBytes ( texture );
	}

	/**
	 * Destroy the GPU texture. A new one is made when needed.
	 */
	public releaseGpuObjects() : void
	{
		const texture = this.#texture;
		if ( texture )
		{
			Texture.#totalBytes -= Texture.getBytes ( texture );
			texture.destroy();
			this.#texture = null;
			this.#view = null;
		}
	}

	/**
	 * Called when nothing uses this texture anymore. Destroy its GPU texture.
	 * The image is kept, so a new texture is made if it's used again.
	 */
	protected override onLastUnref() : void
	{
		this.releaseGpuObjects();
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		this.releaseGpuObjects();
		super.destroy();
	}
}
