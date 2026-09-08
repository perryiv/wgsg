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
 * Reads a file asynchronously using the specified method.
 * @param {File} file The file to read.
 * @param {Method} method The method to use for reading the file ("Text", "ArrayBuffer", or "DataURL").
 * @returns {Promise<string | ArrayBuffer | null>} A promise that resolves to the file content as a string, ArrayBuffer, or DataURL, depending on the specified method.
 */
///////////////////////////////////////////////////////////////////////////////

export function readFileAsync ( file: File, method: Method ) : Promise < string | ArrayBuffer | null >
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

		switch ( method )
		{
			case "Text":
			{
				reader.readAsText ( file );
				break;
			}
			case "ArrayBuffer":
			{
				reader.readAsArrayBuffer ( file );
				break;
			}
			case "DataURL":
			{
				reader.readAsDataURL ( file );
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
