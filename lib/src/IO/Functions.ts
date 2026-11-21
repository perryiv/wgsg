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
import type { IProgressCallback } from "../Types";


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


///////////////////////////////////////////////////////////////////////////////
//
//	The function called for each line of text.
//
///////////////////////////////////////////////////////////////////////////////

export type LineCallback = ( ( line: string, lineNumber: number ) => void );


///////////////////////////////////////////////////////////////////////////////
/**
 * Read a text file one line at a time. Lines can end with "\n" or "\r\n",
 * and the line passed to the callback does not include the ending. Line
 * numbers start at 1. To stop reading, throw from the line callback.
 * @param {File} file The file to read.
 * @param {LineCallback} onLine The function called for each line.
 * @param {IProgressCallback} [onProgress] Called with the number of bytes read
 * and the size of the file. If it returns false then reading stops and the
 * promise is rejected with Cancelled.
 * @returns {Promise<void>} A promise that resolves when all lines are read.
 */
///////////////////////////////////////////////////////////////////////////////

export async function readLines ( file: File, onLine: LineCallback, onProgress?: IProgressCallback ) : Promise < void >
{
	// Shortcuts.
	const { size } = file;
	const reader = file.stream().getReader();
	const decoder = new TextDecoder();

	// Call the callback for one line, without the "\r" if there is one.
	let lineNumber = 0;
	const handleLine = ( line: string ) =>
	{
		if ( line.endsWith ( "\r" ) )
		{
			line = line.substring ( 0, line.length - 1 );
		}
		onLine ( line, ++lineNumber );
	};

	// Initialize for the loop below.
	let partial = "";
	let bytesRead = 0;
	let lastYield = performance.now();

	try
	{
		// Loop until there are no more chunks of data.
		while ( true )
		{
			// Get the next chunk.
			const { done, value } = await reader.read();
			if ( done )
			{
				break;
			}

			// Decode the chunk and put back the partial line from last time.
			// Characters split between chunks are handled by the decoder.
			bytesRead += value.byteLength;
			const lines = ( partial + decoder.decode ( value, { stream: true } ) ).split ( "\n" );

			// The last one is not finished, unless the file ends with "\n".
			partial = ( lines.pop() ?? "" );

			// Handle the complete lines.
			for ( const line of lines )
			{
				handleLine ( line );
			}

			// Report progress and check to see if reading was cancelled.
			if ( onProgress && ( false === onProgress ( bytesRead, size ) ) )
			{
				throw new Cancelled ( "File reading was cancelled by the progress callback" );
			}

			// Let the page update now and then. Doing this for every chunk
			// would make big files slow to read.
			if ( ( performance.now() - lastYield ) > 16 )
			{
				await yieldToEventLoop();
				lastYield = performance.now();
			}
		}

		// Handle the last line, if the file does not end with "\n".
		partial += decoder.decode();
		if ( partial.length > 0 )
		{
			handleLine ( partial );
		}
	}

	catch ( error )
	{
		// Stop the stream before passing the error along.
		await reader.cancel();
		throw error;
	}
}
