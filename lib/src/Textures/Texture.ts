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
//	The GPU texture is made when it's first needed, and again after the
//	device is lost or the image changes. When nothing uses the texture any
//	more (see Base.ref() and unref()), the GPU texture is destroyed, but the
//	image is kept, so it can be used again.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base/Base";
import { Device } from "../Tools/Device";
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

// How the texture is sampled.
export interface ISamplerSettings
{
	wrapU: GPUAddressMode;
	wrapV: GPUAddressMode;
	magFilter: GPUFilterMode;
	minFilter: GPUFilterMode;
}

export interface ITextureInput extends Partial < ISamplerSettings >
{
	image: ITextureImage;
	srgb?: boolean;
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
	#sampler: ISamplerSettings = { wrapU: "repeat", wrapV: "repeat", magFilter: "linear", minFilter: "linear" };
	#texture: ( GPUTexture | null ) = null;
	#view: ( GPUTextureView | null ) = null;
	#device = 0; // The id of the device the texture was made with.

	/**
	 * Construct the class.
	 * @class
	 * @param {ITextureInput} input - The image, and how to sample it. The
	 * defaults are sRGB, repeat, and linear filtering.
	 */
	constructor ( input: Readonly<ITextureInput> )
	{
		super();
		Texture.checkImage ( input.image );
		this.#image = input.image;
		this.#srgb = ( input.srgb ?? true );
		const { wrapU, wrapV, magFilter, minFilter } = input;
		this.#sampler = {
			wrapU: ( wrapU ?? "repeat" ),
			wrapV: ( wrapV ?? "repeat" ),
			magFilter: ( magFilter ?? "linear" ),
			minFilter: ( minFilter ?? "linear" ),
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
		return this.#view!;
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

		// Make the texture.
		const texture = device.createTexture ( {
			label: `Texture ${this.id}`,
			size: [ width, height ],
			format: this.format,
			usage: ( GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT ),
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

		// Save it.
		this.#texture = texture;
		this.#view = texture.createView ( { label: `View of texture ${this.id}` } );
		this.#device = Device.instance.id;
		Texture.#totalBytes += ( width * height * 4 );
	}

	/**
	 * Destroy the GPU texture. A new one is made when needed.
	 */
	public releaseGpuObjects() : void
	{
		const texture = this.#texture;
		if ( texture )
		{
			Texture.#totalBytes -= ( texture.width * texture.height * 4 );
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
