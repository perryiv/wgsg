///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helpers for tests that read back the pixels of a texture.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * The pixels of a texture, in RGBA order, one row after another, starting
 * at the top.
 */
export interface IPixels
{
	width: number;
	height: number;
	data: Uint8Array;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a texture that the draw visitor can render into, and that we can
 * read the pixels of.
 * @param {number} size - The width and height.
 * @returns {GPUTexture} The texture.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeTexture ( size: number ) : GPUTexture
{
	const { device, preferredFormat } = Device.instance;
	return device.createTexture ( {
		size: [ size, size ],
		format: preferredFormat,
		usage: ( GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC ),
	} );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the pixels of a texture.
 * @param {GPUTexture} texture - The texture, with COPY_SRC usage.
 * @returns {Promise<IPixels>} The pixels.
 */
///////////////////////////////////////////////////////////////////////////////

export async function readPixels ( texture: GPUTexture ) : Promise < IPixels >
{
	const { device } = Device.instance;
	const { width, height, format } = texture;
	const bytesPerRow = Math.ceil ( ( width * 4 ) / 256 ) * 256; // Must be a multiple of 256.
	const buffer = device.createBuffer ( {
		size: ( bytesPerRow * height ),
		usage: ( GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ ),
	} );
	const encoder = device.createCommandEncoder();
	encoder.copyTextureToBuffer ( { texture }, { buffer, bytesPerRow }, [ width, height ] );
	device.queue.submit ( [ encoder.finish() ] );
	await buffer.mapAsync ( GPUMapMode.READ );
	const mapped = new Uint8Array ( buffer.getMappedRange() );

	// Copy the rows without the padding, and put blue last if it's first.
	const data = new Uint8Array ( width * height * 4 );
	const bgra = ( "bgra8unorm" === format );
	for ( let y = 0; y < height; ++y )
	{
		for ( let x = 0; x < width; ++x )
		{
			const from = ( y * bytesPerRow ) + ( x * 4 );
			const to = ( ( y * width ) + x ) * 4;
			data[ to     ] = mapped[ from + ( bgra ? 2 : 0 ) ];
			data[ to + 1 ] = mapped[ from + 1 ];
			data[ to + 2 ] = mapped[ from + ( bgra ? 0 : 2 ) ];
			data[ to + 3 ] = mapped[ from + 3 ];
		}
	}
	buffer.unmap();
	buffer.destroy();
	return { width, height, data };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get one pixel.
 * @param {IPixels} pixels - The pixels from readPixels().
 * @param {number} x - The column, from the left.
 * @param {number} y - The row, from the top.
 * @returns {number[]} The pixel, in RGBA order.
 */
///////////////////////////////////////////////////////////////////////////////

export function getPixel ( pixels: IPixels, x: number, y: number ) : number[]
{
	const i = ( ( y * pixels.width ) + x ) * 4;
	return Array.from ( pixels.data.subarray ( i, i + 4 ) );
}
