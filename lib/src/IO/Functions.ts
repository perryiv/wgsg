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
