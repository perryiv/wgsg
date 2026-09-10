///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	GLB file reader.
//
///////////////////////////////////////////////////////////////////////////////

import { addReader, ReaderFactory as Factory } from "../Reader";
import { Group, Node as SceneNode } from "../../Scene/Nodes";
import { Reader as BaseClass } from "../Reader";
import { readFile } from "../Functions";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants for this file.
//
///////////////////////////////////////////////////////////////////////////////

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;
const GLTF_MAGIC_NUMBER = 0x46546C67; // ASCII for "glTF".
const GLTF_TYPE_JSON = 0x4E4F534A;


///////////////////////////////////////////////////////////////////////////////
//
//	Types needed below.
//
///////////////////////////////////////////////////////////////////////////////

interface FileHeader
{
	magic: number;
	version: number;
	length: number;
};

interface FileHeaderResult
{
	header: FileHeader;
	offset: number;
}

interface ChunkHeader
{
	length: number;
	type: number;
};

interface ChunkHeaderResult
{
	header: ChunkHeader;
	offset: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the GLB file.
 * @param {File} file The GLB file to read.
 * @returns {Promise<FileHeaderResult>} A promise that resolves with the file header and the offset after the header.
 */
///////////////////////////////////////////////////////////////////////////////

const readFileHeader = async ( file: File ) : Promise < FileHeaderResult > =>
{
	const end = GLB_FILE_HEADER_SIZE;
	const result = await readFile ( file, "ArrayBuffer", 0, end );

	// Make the view for the header data.
	const buffer = ( result as ArrayBuffer );
	const view = new DataView ( buffer );

	// Get the header.
	const magic   = view.getUint32 ( 0, true );
	const version = view.getUint32 ( 4, true );
	const length  = view.getUint32 ( 8, true );

	// Make sure the magic number is correct.
	if ( GLTF_MAGIC_NUMBER !== magic ) // ASCII for "glTF".
	{
		throw new Error ( `Incorrect GLB magic number: ${magic}, should be ${GLTF_MAGIC_NUMBER}` );
	}

	// Make sure the version is supported.
	if ( 2 !== version )
	{
		throw new Error ( `Unsupported GLB version: ${version}` );
	}

	// Make sure the length is consistent with the file size.
	if ( length !== file.size )
	{
		throw new Error ( `Invalid GLB file length: expected ${length}, got ${file.size}` );
	}

	// Return the answer.
	return { header: { magic, version, length }, offset: end };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the next chunk of data.
 * @param {File} file The file to read.
 * @param {number} offset The offset in the file where the chunk header starts.
 * @returns {Promise<ChunkHeaderResult>} A promise that resolves with the chunk header and the offset after the header.
 */
///////////////////////////////////////////////////////////////////////////////

const readChunkHeader = async ( file: File, offset: number ) : Promise < ChunkHeaderResult > =>
{
	const end = offset + GLB_CHUNK_HEADER_SIZE;
	const result = await readFile ( file, "ArrayBuffer", offset, end );

	// Make the view for the chunk header data.
	const buffer = ( result as ArrayBuffer );
	const view = new DataView ( buffer );

	// Get the chunk header.
	const length = view.getUint32 ( 0, true );
	const type   = view.getUint32 ( 4, true );

	// Return the answer.
	return { header: { length, type }, offset: end };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the next chunk of data.
 * @param {File} file The file to read.
 * @param {ChunkHeaderResult} result The result from reading the chunk header.
 * @returns {Promise<string>} A promise that resolves with the JSON string from the chunk.
 */
///////////////////////////////////////////////////////////////////////////////

const readJSON = async ( file: File, result: ChunkHeaderResult ) : Promise < string > =>
{
	const end = result.offset + result.header.length;
	const text = await readFile ( file, "Text", result.offset, end );

	if ( "string" !== ( typeof text ) )
	{
		throw new Error ( `Failed to read JSON chunk as text` );
	}

	return ( text as string );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for GLB file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

class GLB extends BaseClass
{
	#file: ( string | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 */
	public constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "IO.Readers.GLB";
	}

	/**
	 * Get the file name.
	 * @returns {(string | null)} The file name.
	 */
	public get file() : ( string | null )
	{
		return this.#file;
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override async read ( file: File ) : Promise < SceneNode >
	{
		// Do this first.
		this.#file = file.name;

		// Read the header information.
		const result1 = await readFileHeader ( file );

		// Read the JSON header.
		const result2 = await readChunkHeader ( file, result1.offset );

		// Make sure the data type is JSON.
		if ( GLTF_TYPE_JSON !== result2.header.type )
		{
			throw new Error ( `Expected JSON data but found type ${result2.header.type}` );
		}

		// Read the JSON data.
		const result3 = await readJSON ( file, result2 );

		// Convert it to an object.
		const result4 = JSON.parse ( result3 ) as Record < string, unknown >;

		// We only handle triangle meshes.
		console.debug ( result4 );

		return new Group();
	}
}


////////////////////////////////////////////////////////////////////////////////
//
//	The factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

const factory: Factory = () =>
{
	return new GLB();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "glb", factory );
addReader ( "GLB", factory );
