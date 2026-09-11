///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	PLY file reader.
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

const PLY_FILE_HEADER_LINE_1 = "ply";
const PLY_FILE_HEADER_LINE_2 = new Set ( [
	"format ascii 1.0",
	"format binary_little_endian 1.0",
	"format binary_big_endian 1.0"
] );
const PLY_FILE_HEADER_LINE_3 = "element vertex";
const PLY_FILE_HEADER_LINE_4 = "property float x";
const PLY_FILE_HEADER_LINE_5 = "property float y";
const PLY_FILE_HEADER_LINE_6 = "property float z";


///////////////////////////////////////////////////////////////////////////////
//
//	Types needed below.
//
///////////////////////////////////////////////////////////////////////////////

interface FileHeader
{
	kind: string;
	format: number;
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
 * Read the header of the PLY file.
 * @param {File} file The PLY file to read.
 * @returns {Promise<FileHeaderResult>} A promise that resolves with the file header and the offset after the header.
 */
///////////////////////////////////////////////////////////////////////////////

const readFileHeader = async ( file: File ) : Promise < string[] > =>
{
	// Get the header text as an array.
	const header = await ( async () =>
	{
		// Read the beyond where the header should end.
		const data1 = ( ( await readFile ( file, "Text", 0, 1024 ) ) as string );

		// We want everything before "end_header".
		const data2 = data1.split ( "end_header" )[0];

		// Remove the last newline character.
		const data3 = data2.trim();

		// Make it an array.
		const data4 = data3.split ( "\n" );

		// Remove any comments.
		return data4.filter ( line => !line.startsWith ( "comment" ) );
	} ) ();

	// Make sure the first line of the header is correct.
	if ( PLY_FILE_HEADER_LINE_1 !== header[0] )
	{
		throw new Error ( `Incorrect first line in PLY file: ${header[0]}, should be ${PLY_FILE_HEADER_LINE_1}` );
	}

	// Make sure the format is correct.
	if ( !PLY_FILE_HEADER_LINE_2.has ( header[1] ) )
	{
		throw new Error ( `Incorrect second line in PLY file: ${header[1]}, should be one of ${Array.from ( PLY_FILE_HEADER_LINE_2 ).join ( ", " )}` );
	}

	// Save the format and version.
	const format = header[1].split ( " " )[1];
	const version = header[1].split ( " " )[2];

	// We do not support big endian files.
	if ( format === "binary_big_endian" )
	{
		throw new Error ( `Big endian PLY files are not supported.` );
	}

	// We only support this version.
	if ( "1" !== version )
	{
		throw new Error ( `Unsupported PLY version: ${version}` );
	}

	// The next line should say how many vertices there are.
	if ( !header[2].startsWith ( PLY_FILE_HEADER_LINE_3 ) )
	{
		throw new Error ( `Incorrect third line in PLY file: ${header[2]}, should start with "${PLY_FILE_HEADER_LINE_3}"` );
	}

	// Get the number of vertices.
	const numVertices = parseInt ( header[2].split ( " " )[2], 10 );

	// Make sure the number of vertices is valid.
	if ( ( isNaN ( numVertices ) ) || ( numVertices <= 0 ) )
	{
		throw new Error ( `Invalid number of vertices in PLY file: ${header[2]}` );
	}

	// We should have 3 floats next.
	{
		if ( PLY_FILE_HEADER_LINE_4 !== header[3] )
		{
			throw new Error ( `Incorrect fourth line in PLY file: ${header[3]}, expected: ${PLY_FILE_HEADER_LINE_4}` );
		}

		if ( PLY_FILE_HEADER_LINE_5 !== header[4] )
		{
			throw new Error ( `Incorrect fifth line in PLY file: ${header[4]}, expected: ${PLY_FILE_HEADER_LINE_5}` );
		}

		if ( PLY_FILE_HEADER_LINE_6 !== header[5] )
		{
			throw new Error ( `Incorrect sixth line in PLY file: ${header[5]}, expected: ${PLY_FILE_HEADER_LINE_6}` );
		}
	}

	// Skip any other "property float ..." lines and find the number of faces.
	const numFaces = ( () =>
	{
		let i = 6;
		while ( ( i < header.length ) && ( header[i].startsWith ( "property float" ) ) )
		{
			++i;
		}
		if ( ( i < header.length ) && ( header[i].startsWith ( "element face" ) ) )
		{
			return parseInt ( header[i].split ( " " )[2], 10 );
		}
		return 0;
	} ) ();


	// Make sure the number of faces is valid.
	if ( ( isNaN ( numFaces ) ) || ( numFaces <= 0 ) )
	{
		throw new Error ( `Invalid number of faces in PLY file: ${numFaces}` );
	}

	return header;

	// Get the header.
	// const magic   = view.getUint32 ( 0, true );
	// const version = view.getUint32 ( 4, true );
	// const length  = view.getUint32 ( 8, true );

	// Make sure the magic number is correct.
	// if ( PLY_MAGIC_NUMBER !== magic ) // ASCII for "PLY ".
	// {
	// 	throw new Error ( `Incorrect PLY magic number: ${magic}, should be ${PLY_MAGIC_NUMBER}` );
	// }

	// // Make sure the version is supported.
	// if ( 1 !== version )
	// {
	// 	throw new Error ( `Unsupported PLY version: ${version}` );
	// }

	// // Make sure the length is consistent with the file size.
	// if ( length !== file.size )
	// {
	// 	throw new Error ( `Invalid PLY file length: expected ${length}, got ${file.size}` );
	// }

	// // Return the answer.
	// return { header: { magic, version, length }, offset: end };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the next chunk of data.
 * @param {File} file The file to read.
 * @param {number} offset The offset in the file where the chunk header starts.
 * @returns {Promise<ChunkHeaderResult>} A promise that resolves with the chunk header and the offset after the header.
 */
///////////////////////////////////////////////////////////////////////////////

// const readChunkHeader = async ( file: File, offset: number ) : Promise < ChunkHeaderResult > =>
// {
// 	const end = offset + PLY_CHUNK_HEADER_SIZE;
// 	const result = await readFile ( file, "ArrayBuffer", offset, end );

// 	// Make the view for the chunk header data.
// 	const buffer = ( result as ArrayBuffer );
// 	const view = new DataView ( buffer );

// 	// Get the chunk header.
// 	const length = view.getUint32 ( 0, true );
// 	const type   = view.getUint32 ( 4, true );

// 	// Return the answer.
// 	return { header: { length, type }, offset: end };
// }


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the next chunk of data.
 * @param {File} file The file to read.
 * @param {ChunkHeaderResult} result The result from reading the chunk header.
 * @returns {Promise<string>} A promise that resolves with the JSON string from the chunk.
 */
///////////////////////////////////////////////////////////////////////////////

// const readJSON = async ( file: File, result: ChunkHeaderResult ) : Promise < string > =>
// {
// 	const end = result.offset + result.header.length;
// 	const text = await readFile ( file, "Text", result.offset, end );

// 	if ( "string" !== ( typeof text ) )
// 	{
// 		throw new Error ( `Failed to read JSON chunk as text` );
// 	}

// 	return ( text as string );
// }


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for PLY file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

class PLY extends BaseClass
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
		return "IO.Readers.PLY";
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

		// // Read the JSON header.
		// const result2 = await readChunkHeader ( file, result1.offset );

		// // Make sure the data type is JSON.
		// if ( PLY_TYPE_JSON !== result2.header.type )
		// {
		// 	throw new Error ( `Expected JSON data but found type ${result2.header.type}` );
		// }

		// // Read the JSON data and convert it to an object.
		// const json = JSON.parse ( await readJSON ( file, result2 ) ) as Record < string, unknown >;

		// Print what we have.
		console.debug ( result1 );

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
	return new PLY();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "ply", factory );
addReader ( "PLY", factory );
