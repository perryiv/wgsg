///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Unpack the two kinds of glTF files. Both hold the same JSON, which says
//	where the vertices and indices are in the buffers of binary data.
//
//	A .glb file has a header, a chunk with the JSON, and usually a chunk with
//	the binary data of the first buffer.
//
//	A .gltf file is only the JSON. Its buffers are either other files, which
//	this reader can't get, or embedded in the JSON as base64 "data:" URIs.
//
///////////////////////////////////////////////////////////////////////////////

import { readBytes } from "../../Functions";
import {
	GLB_CHUNK_HEADER_SIZE,
	GLB_CHUNK_TYPE_BIN,
	GLB_CHUNK_TYPE_JSON,
	GLB_FILE_HEADER_SIZE,
	GLB_MAGIC_NUMBER,
	type IGltfData,
	type IGltfJson,
} from "./Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Parse the JSON and check that it is glTF 2.
 * @param {string} text The JSON text.
 * @returns {IGltfJson} The JSON.
 */
///////////////////////////////////////////////////////////////////////////////

export const parseJson = ( text: string ) : IGltfJson =>
{
	// Ignore a byte order mark, which some writers add.
	const json = JSON.parse ( text.replace ( /^\uFEFF/, "" ) ) as unknown;

	// It has to be an object with the asset's version.
	if ( ( !json ) || ( "object" !== typeof json ) || ( Array.isArray ( json ) ) )
	{
		throw new Error ( "The glTF JSON is not an object" );
	}
	const { asset } = ( json as Partial<IGltfJson> );
	if ( ( !asset ) || ( "string" !== typeof asset.version ) )
	{
		throw new Error ( "The glTF JSON has no asset version" );
	}

	// Only glTF 2 is supported. Version 1 is very different.
	const major = asset.version.split ( "." )[0];
	if ( "2" !== major )
	{
		throw new Error ( `glTF version ${asset.version} is not supported, only version 2` );
	}

	return ( json as IGltfJson );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Decode a base64 "data:" URI.
 * @param {string} uri The URI.
 * @returns {Uint8Array} The bytes.
 */
///////////////////////////////////////////////////////////////////////////////

export const decodeDataUri = ( uri: string ) : Uint8Array =>
{
	const comma = uri.indexOf ( "," );
	const header = uri.slice ( 0, comma );
	if ( ( comma < 0 ) || ( false === header.endsWith ( ";base64" ) ) )
	{
		throw new Error ( "Only base64 data URIs are supported" );
	}
	const text = atob ( uri.slice ( comma + 1 ) );
	const bytes = new Uint8Array ( text.length );
	for ( let i = 0; i < text.length; ++i )
	{
		bytes[i] = text.charCodeAt ( i );
	}
	return bytes;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the binary data of each buffer in the JSON.
 * @param {IGltfJson} json The JSON.
 * @param {Uint8Array | null} glb The data in the GLB file's binary chunk, if any.
 * @returns {Uint8Array[]} The data of each buffer.
 */
///////////////////////////////////////////////////////////////////////////////

const getBuffers = ( json: Readonly<IGltfJson>, glb: ( Uint8Array | null ) ) : Uint8Array[] =>
{
	return ( json.buffers ?? [] ).map ( ( buffer, index ) =>
	{
		// Get the data.
		let data: Uint8Array;
		const { uri } = buffer;
		if ( undefined === uri )
		{
			// Only the first buffer of a GLB file can have no URI. Its data is
			// in the binary chunk.
			if ( ( 0 !== index ) || ( !glb ) )
			{
				throw new Error ( `glTF buffer ${index} has no data` );
			}
			data = glb;
		}
		else if ( uri.startsWith ( "data:" ) )
		{
			data = decodeDataUri ( uri );
		}
		else
		{
			throw new Error ( `glTF buffer ${index} is in another file, '${uri}', which is not supported yet. ` +
				"Use a .glb file, or a .gltf file with the data embedded" );
		}

		// There can be more data than the buffer's length, from padding, but
		// not less.
		if ( data.length < buffer.byteLength )
		{
			throw new Error ( `glTF buffer ${index} should have ${buffer.byteLength} bytes but has ${data.length}` );
		}
		return data;
	} );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Unpack a .gltf file.
 * @param {File} file The file.
 * @returns {Promise<IGltfData>} The JSON and the data of its buffers.
 */
///////////////////////////////////////////////////////////////////////////////

export const readGltf = async ( file: File ) : Promise < IGltfData > =>
{
	const json = parseJson ( await file.text() );
	return { json, buffers: getBuffers ( json, null ) };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Unpack a .glb file.
 * @param {File} file The file.
 * @returns {Promise<IGltfData>} The JSON and the data of its buffers.
 */
///////////////////////////////////////////////////////////////////////////////

export const readGlb = async ( file: File ) : Promise < IGltfData > =>
{
	// Read the whole file. The binary chunk is most of it.
	const bytes = new Uint8Array ( await readBytes ( file ) );
	const view = new DataView ( bytes.buffer );

	// Check the header.
	if ( bytes.length < GLB_FILE_HEADER_SIZE )
	{
		throw new Error ( `The GLB file has only ${bytes.length} bytes` );
	}
	const magic   = view.getUint32 ( 0, true );
	const version = view.getUint32 ( 4, true );
	const length  = view.getUint32 ( 8, true );
	if ( GLB_MAGIC_NUMBER !== magic )
	{
		throw new Error ( "The file does not start with 'glTF', so it is not a GLB file" );
	}
	if ( 2 !== version )
	{
		throw new Error ( `GLB version ${version} is not supported, only version 2` );
	}
	if ( length !== bytes.length )
	{
		throw new Error ( `The GLB header says the file has ${length} bytes, but it has ${bytes.length}` );
	}

	// Read the chunks. The first one is the JSON.
	let json: ( IGltfJson | null ) = null;
	let bin: ( Uint8Array | null ) = null;
	let offset = GLB_FILE_HEADER_SIZE;
	while ( offset < length )
	{
		// Get the chunk's header.
		if ( ( offset + GLB_CHUNK_HEADER_SIZE ) > length )
		{
			throw new Error ( `The GLB chunk at byte ${offset} has no room for its header` );
		}
		const chunkLength = view.getUint32 ( offset, true );
		const chunkType   = view.getUint32 ( offset + 4, true );
		const start = offset + GLB_CHUNK_HEADER_SIZE;
		const end = start + chunkLength;
		if ( end > length )
		{
			throw new Error ( `The GLB chunk at byte ${offset} has ${chunkLength} bytes, which is past the end of the file` );
		}
		const data = bytes.subarray ( start, end );

		// The first chunk has to be the JSON.
		if ( !json )
		{
			if ( GLB_CHUNK_TYPE_JSON !== chunkType )
			{
				throw new Error ( "The first GLB chunk is not JSON" );
			}
			json = parseJson ( new TextDecoder().decode ( data ) );
		}

		// The next one can be the binary data. Ignore other kinds of chunks.
		else if ( ( GLB_CHUNK_TYPE_BIN === chunkType ) && ( !bin ) )
		{
			bin = data;
		}

		offset = end;
	}

	// There has to be JSON.
	if ( !json )
	{
		throw new Error ( "The GLB file has no JSON chunk" );
	}

	return { json, buffers: getBuffers ( json, bin ) };
};
