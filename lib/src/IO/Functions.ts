///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions for reading files.
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled } from "./Cancelled";


///////////////////////////////////////////////////////////////////////////////
//
//	The method type for reading files.
//
///////////////////////////////////////////////////////////////////////////////

export type Method = ( "Text" | "ArrayBuffer" | "DataURL" );


///////////////////////////////////////////////////////////////////////////////
/**
 * Get a blob from a file with optional start and end positions.
 * @param {File} file The file to get the blob from.
 * @param {number} [start] The start position in the file.
 * @param {number} [end] The end position in the file.
 * @returns {Blob} The resulting blob.
 */
///////////////////////////////////////////////////////////////////////////////

export function getBlob ( file: File, start?: number, end?: number ) : Blob
{
	if ( undefined === start )
	{
		return file;
	}

	if ( start < 0 )
	{
		throw new Error ( `Invalid start position: ${start}` );
	}

	if ( undefined == end )
	{
		return file.slice ( start );
	}

	if ( end <= start )
	{
		throw new Error ( `End position ${end} must be greater than start position ${start}` );
	}

	return file.slice ( start, end );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Reads a file asynchronously using the specified method.
 * @param {File} file The file to read.
 * @param {Method} method The method to use for reading the file ("Text", "ArrayBuffer", or "DataURL").
 * @param {number} [start] The start position in the file.
 * @param {number} [end] The end position in the file.
 * @returns {Promise<string | ArrayBuffer | null>} A promise that resolves to the file content as a string, ArrayBuffer, or DataURL, depending on the specified method.
 */
///////////////////////////////////////////////////////////////////////////////

export function readFile ( file: File, method: Method, start?: number, end?: number ) : Promise < string | ArrayBuffer | null >
{
	return new Promise ( ( resolve, reject ) =>
	{
		const reader = new FileReader();

		reader.onload = () =>
		{
			resolve ( reader.result );
		};

		reader.onerror = () =>
		{
			const error = reader.error;
			const message = ( error?.message ) ?? `Unknown error when reading file '${file.name}'`;
			reject ( new Error ( message ) );
		}

		reader.onabort = () =>
		{
			reject ( new Cancelled ( "File reading was cancelled" ) );
		}

		const blob = getBlob ( file, start, end );

		switch ( method )
		{
			case "Text":
			{
				reader.readAsText ( blob );
				break;
			}
			case "ArrayBuffer":
			{
				reader.readAsArrayBuffer ( blob );
				break;
			}
			case "DataURL":
			{
				reader.readAsDataURL ( blob );
				break;
			}
			default:
			{
				reject ( new Error ( `Unsupported read method: ${method as string}` ) );
				break;
			}
		}
	} );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read bytes from a file with optional start and end positions.
 * Unlike readFile(), this does not use FileReader, so errors thrown while
 * processing the result reject the caller's promise instead of escaping.
 * @param {File} file The file to read.
 * @param {number} [start] The start position in the file.
 * @param {number} [end] The end position in the file.
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the bytes.
 */
///////////////////////////////////////////////////////////////////////////////

export async function readBytes ( file: File, start?: number, end?: number ) : Promise < ArrayBuffer >
{
	return await getBlob ( file, start, end ).arrayBuffer();
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Let the event loop run, so that long operations do not freeze the page and
 * progress updates have a chance to be drawn.
 * @returns {Promise<void>} A promise that resolves on a later turn of the event loop.
 */
///////////////////////////////////////////////////////////////////////////////

export function yieldToEventLoop() : Promise < void >
{
	return new Promise ( ( resolve ) =>
	{
		setTimeout ( resolve, 0 );
	} );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Find the byte offset of ASCII text in an array of bytes. This searches the
 * bytes directly, so the answer is a byte offset, not a character index.
 * @param {Uint8Array} bytes The bytes to search.
 * @param {string} text The ASCII text to find.
 * @param {number} [from] The byte offset to start searching from.
 * @returns {number} The byte offset of the text, or -1 if it is not found.
 */
///////////////////////////////////////////////////////////////////////////////

export function findBytes ( bytes: Readonly<Uint8Array>, text: string, from = 0 ) : number
{
	// Handle empty text.
	if ( text.length <= 0 )
	{
		throw new Error ( "Empty text when searching bytes" );
	}

	// Convert the text to byte values. Only ASCII is supported because
	// otherwise one character is not one byte.
	const numChars = text.length;
	const needle = new Array < number > ( numChars );
	for ( let i = 0; i < numChars; ++i )
	{
		const code = text.charCodeAt ( i );
		if ( code > 127 )
		{
			throw new Error ( `Non-ASCII character in text when searching bytes: ${text}` );
		}
		needle[i] = code;
	}

	// Look for the text.
	const last = bytes.length - numChars;
	for ( let i = Math.max ( 0, from ); i <= last; ++i )
	{
		let j = 0;
		while ( ( j < numChars ) && ( bytes[i + j] === needle[j] ) )
		{
			++j;
		}
		if ( j === numChars )
		{
			return i;
		}
	}

	// If we get to here then we did not find it.
	return -1;
}
