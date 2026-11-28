///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Make small PNG files in memory, so that tests don't need image files.
//
//	The PNG is RGBA, 8 bits each, with its pixels in zlib "stored" blocks,
//	which are not compressed. It's still a valid PNG, which browsers decode.
//	Where there is no browser decoder, like in Node, decodePng() reads these
//	PNGs back, and only these.
//	https://www.w3.org/TR/png/
//
///////////////////////////////////////////////////////////////////////////////

import type { IRawImage } from "../../../lib/src/Textures/Texture";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

const SIGNATURE = [ 137, 80, 78, 71, 13, 10, 26, 10 ];
const MAX_STORED_BLOCK = 65535;

// The table for CRC32, which each chunk ends with.
const CRC_TABLE = ( () : Uint32Array =>
{
	const table = new Uint32Array ( 256 );
	for ( let n = 0; n < 256; ++n )
	{
		let c = n;
		for ( let k = 0; k < 8; ++k )
		{
			c = ( ( c & 1 ) ? ( 0xEDB88320 ^ ( c >>> 1 ) ) : ( c >>> 1 ) );
		}
		table[n] = c >>> 0;
	}
	return table;
} ) ();


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the CRC32 of the bytes.
 * @param {number[]} bytes - The bytes.
 * @returns {number} The CRC32.
 */
///////////////////////////////////////////////////////////////////////////////

const crc32 = ( bytes: readonly number[] ) : number =>
{
	let c = 0xFFFFFFFF;
	for ( const byte of bytes )
	{
		c = CRC_TABLE[( c ^ byte ) & 0xFF] ^ ( c >>> 8 );
	}
	return ( c ^ 0xFFFFFFFF ) >>> 0;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the four bytes of a number, the most significant first.
 * @param {number} value - The number.
 * @returns {number[]} The bytes.
 */
///////////////////////////////////////////////////////////////////////////////

const uint32 = ( value: number ) : number[] =>
{
	return [ ( value >>> 24 ) & 0xFF, ( value >>> 16 ) & 0xFF, ( value >>> 8 ) & 0xFF, value & 0xFF ];
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a chunk: its length, type, data, and CRC32 of the type and data.
 * @param {string} type - The type, like "IHDR".
 * @param {number[]} data - The data.
 * @returns {number[]} The chunk.
 */
///////////////////////////////////////////////////////////////////////////////

const chunk = ( type: string, data: readonly number[] ) : number[] =>
{
	const typeAndData = [ ...Array.from ( type, ( char ) => char.charCodeAt ( 0 ) ), ...data ];
	return [ ...uint32 ( data.length ), ...typeAndData, ...uint32 ( crc32 ( typeAndData ) ) ];
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a PNG file of the pixels.
 * @param {IRawImage} image - The pixels: red, green, blue, and alpha, the top
 * row first.
 * @returns {Uint8Array} The bytes of the PNG file.
 */
///////////////////////////////////////////////////////////////////////////////

export const makePng = ( image: Readonly<IRawImage> ) : Uint8Array < ArrayBuffer > =>
{
	const { width, height, data } = image;

	// The rows, each after a filter type of 0, which means none.
	const raw: number[] = [];
	for ( let y = 0; y < height; ++y )
	{
		raw.push ( 0, ...data.subarray ( ( y * width * 4 ), ( ( y + 1 ) * width * 4 ) ) );
	}

	// zlib: a header, stored blocks, and the Adler-32 of the raw bytes.
	const zlib: number[] = [ 0x78, 0x01 ];
	for ( let start = 0; start < raw.length; start += MAX_STORED_BLOCK )
	{
		const block = raw.slice ( start, ( start + MAX_STORED_BLOCK ) );
		const last = ( ( start + MAX_STORED_BLOCK ) >= raw.length ) ? 1 : 0;
		const length = block.length;
		zlib.push ( last, ( length & 0xFF ), ( length >>> 8 ), ( ~length & 0xFF ), ( ( ~length >>> 8 ) & 0xFF ), ...block );
	}
	let a = 1;
	let b = 0;
	for ( const byte of raw )
	{
		a = ( a + byte ) % 65521;
		b = ( b + a ) % 65521;
	}
	zlib.push ( ...uint32 ( ( ( b << 16 ) | a ) >>> 0 ) );

	// The file: 8 bits each, RGBA, which is color type 6.
	const header = [ ...uint32 ( width ), ...uint32 ( height ), 8, 6, 0, 0, 0 ];
	return new Uint8Array ( [ ...SIGNATURE, ...chunk ( "IHDR", header ), ...chunk ( "IDAT", zlib ), ...chunk ( "IEND", [] ) ] );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read a PNG made by makePng() back into pixels. Other PNGs, which are
 * compressed, are rejected.
 * @param {Uint8Array} bytes - The bytes of the PNG file.
 * @returns {IRawImage} The pixels.
 */
///////////////////////////////////////////////////////////////////////////////

export const decodePng = ( bytes: Uint8Array ) : IRawImage =>
{
	const read32 = ( at: number ) : number =>
		( ( ( bytes[at] << 24 ) | ( bytes[at + 1] << 16 ) | ( bytes[at + 2] << 8 ) | bytes[at + 3] ) >>> 0 );

	// The chunks we need.
	let width = 0;
	let height = 0;
	const zlib: number[] = [];
	for ( let at = SIGNATURE.length; at < bytes.length; )
	{
		const length = read32 ( at );
		const type = String.fromCharCode ( ...bytes.subarray ( ( at + 4 ), ( at + 8 ) ) );
		const data = bytes.subarray ( ( at + 8 ), ( at + 8 + length ) );
		if ( "IHDR" === type )
		{
			width = read32 ( at + 8 );
			height = read32 ( at + 12 );
		}
		else if ( "IDAT" === type )
		{
			zlib.push ( ...data );
		}
		at += ( 12 + length );
	}

	// The stored blocks, after the 2-byte header.
	const raw: number[] = [];
	for ( let at = 2; at < ( zlib.length - 4 ); )
	{
		if ( 0 !== ( zlib[at] & 0x06 ) )
		{
			throw new Error ( "This test decoder only reads PNGs made by makePng()" );
		}
		const length = ( zlib[at + 1] | ( zlib[at + 2] << 8 ) );
		raw.push ( ...zlib.slice ( ( at + 5 ), ( at + 5 + length ) ) );
		at += ( 5 + length );
	}

	// The rows, without their filter types.
	const data = new Uint8Array ( width * height * 4 );
	for ( let y = 0; y < height; ++y )
	{
		const start = ( y * ( ( width * 4 ) + 1 ) ) + 1;
		data.set ( raw.slice ( start, ( start + ( width * 4 ) ) ), ( y * width * 4 ) );
	}
	return { width, height, data };
};
