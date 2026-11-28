///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Read the images and samplers of glTF textures.
//
//	An image is in a buffer view, with its MIME type, or in a base64 "data:"
//	URI. An image in another file needs that file, which this reader can't
//	get yet.
//
//	The bytes are decoded by an image decoder, which by default is the
//	browser's createImageBitmap(). Another one can be given, for example to
//	decode images where there is no createImageBitmap().
//
///////////////////////////////////////////////////////////////////////////////

import { decodeDataUri } from "./Container";
import type { ITextureImage, ITextureInput } from "../../../Textures/Texture";
import {
	getItem,
	GLTF_CLAMP_TO_EDGE,
	GLTF_LINEAR,
	GLTF_LINEAR_MIPMAP_LINEAR,
	GLTF_LINEAR_MIPMAP_NEAREST,
	GLTF_MIRRORED_REPEAT,
	GLTF_NEAREST,
	GLTF_NEAREST_MIPMAP_LINEAR,
	GLTF_NEAREST_MIPMAP_NEAREST,
	GLTF_REPEAT,
	type IGltfData,
	type IGltfSampler,
} from "./Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

// Decodes the bytes of an image file, like a PNG or JPEG.
export type IImageDecoder = ( bytes: Uint8Array, mimeType: string ) => Promise < ITextureImage >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Decode the image with the browser's createImageBitmap(). Its colors and
 * alpha are kept as they are in the file: not converted to another color
 * space, and not pre-multiplied, because the textures and shaders do that.
 * @param {Uint8Array} bytes - The bytes of the image file.
 * @param {string} mimeType - The type, like "image/png".
 * @returns {Promise<ImageBitmap>} The image.
 */
///////////////////////////////////////////////////////////////////////////////

export const decodeImage: IImageDecoder = async ( bytes: Uint8Array, mimeType: string ) : Promise < ImageBitmap > =>
{
	const blob = new Blob ( [ new Uint8Array ( bytes ) ], { type: mimeType } );
	return await createImageBitmap ( blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" } );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the bytes of an image and its MIME type.
 * @param {IGltfData} data - The JSON and the buffers.
 * @param {number} index - The index of the image.
 * @returns {object} The bytes and the MIME type.
 */
///////////////////////////////////////////////////////////////////////////////

export const getImageBytes = ( data: Readonly<IGltfData>, index: number ) : { bytes: Uint8Array, mimeType: string } =>
{
	const image = getItem ( data.json.images, index, "image" );
	const { uri, bufferView, mimeType } = image;

	// In a buffer view.
	if ( undefined !== bufferView )
	{
		if ( !mimeType )
		{
			throw new Error ( `Image ${index} is in a buffer view but has no MIME type` );
		}
		const view = getItem ( data.json.bufferViews, bufferView, "buffer view" );
		const buffer = data.buffers[view.buffer];
		const start = ( view.byteOffset ?? 0 );
		if ( ( !buffer ) || ( ( start + view.byteLength ) > buffer.length ) )
		{
			throw new Error ( `Image ${index} is past the end of its buffer` );
		}
		return { bytes: buffer.subarray ( start, ( start + view.byteLength ) ), mimeType };
	}

	// In a data URI, which says its type, like "data:image/png;base64,...".
	if ( uri?.startsWith ( "data:" ) )
	{
		const type = uri.slice ( 5, uri.indexOf ( ";" ) );
		return { bytes: decodeDataUri ( uri ), mimeType: ( mimeType ?? type ) };
	}

	// In another file, or nowhere.
	if ( uri )
	{
		throw new Error ( `Image ${index} is in another file, '${uri}', which is not supported yet` );
	}
	throw new Error ( `Image ${index} has no data` );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get a texture's settings from its glTF sampler. What the sampler leaves
 * out is the texture's default: repeat, linear filtering, and mipmaps. A
 * minifying filter without mipmaps turns them off.
 * @param {IGltfSampler | undefined} sampler - The sampler, if any.
 * @returns {Partial<ITextureInput>} The settings.
 */
///////////////////////////////////////////////////////////////////////////////

export const getSamplerSettings = ( sampler: ( Readonly<IGltfSampler> | undefined ) ) : Partial < ITextureInput > =>
{
	const wraps: Record < number, GPUAddressMode > = {
		[GLTF_CLAMP_TO_EDGE]: "clamp-to-edge",
		[GLTF_MIRRORED_REPEAT]: "mirror-repeat",
		[GLTF_REPEAT]: "repeat",
	};
	const mins: Record < number, [ GPUFilterMode, GPUMipmapFilterMode | null ] > = {
		[GLTF_NEAREST]: [ "nearest", null ],
		[GLTF_LINEAR]: [ "linear", null ],
		[GLTF_NEAREST_MIPMAP_NEAREST]: [ "nearest", "nearest" ],
		[GLTF_LINEAR_MIPMAP_NEAREST]: [ "linear", "nearest" ],
		[GLTF_NEAREST_MIPMAP_LINEAR]: [ "nearest", "linear" ],
		[GLTF_LINEAR_MIPMAP_LINEAR]: [ "linear", "linear" ],
	};

	const settings: Partial < ITextureInput > = {};
	if ( !sampler )
	{
		return settings;
	}

	const { wrapS, wrapT, magFilter, minFilter } = sampler;
	if ( ( undefined !== wrapS ) && wraps[wrapS] )
	{
		settings.wrapU = wraps[wrapS];
	}
	if ( ( undefined !== wrapT ) && wraps[wrapT] )
	{
		settings.wrapV = wraps[wrapT];
	}
	if ( GLTF_NEAREST === magFilter )
	{
		settings.magFilter = "nearest";
	}
	const min = ( ( undefined === minFilter ) ? undefined : mins[minFilter] );
	if ( min )
	{
		const [ minFilterMode, mipmapFilter ] = min;
		settings.minFilter = minFilterMode;
		if ( mipmapFilter )
		{
			settings.mipmapFilter = mipmapFilter;
		}
		else
		{
			settings.mipmaps = false;
		}
	}
	return settings;
};
