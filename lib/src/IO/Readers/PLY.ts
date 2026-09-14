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

const PLY_FILE_HEADER_MAGIC_NUMBER = "ply";
const PLY_FILE_HEADER_FORMATS = new Set ( [
	"format ascii 1.0",
	"format binary_little_endian 1.0",
	"format binary_big_endian 1.0"
] );


///////////////////////////////////////////////////////////////////////////////
//
//	Types needed below.
//
///////////////////////////////////////////////////////////////////////////////

interface FileHeader
{
	lines: Set < string >;
};

interface FileHeaderResult
{
	header: FileHeader;
	offset: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of the PLY file.
 * @param {File} file The PLY file to read.
 * @returns {Promise<FileHeaderResult>} A promise that resolves with the file header and the offset after the header.
 */
///////////////////////////////////////////////////////////////////////////////

const readFileHeader = async ( file: File ) : Promise < FileHeaderResult > =>
{
	// Read beyond where the header should end.
	const data1 = ( ( await readFile ( file, "Text", 0, 1024 ) ) as string );

	// Where does the header end?
	let offset = data1.indexOf ( "end_header" );

	// Make sure.
	if ( -1 === offset )
	{
		throw new Error ( `PLY file is missing 'end_header'` );
	}

	// The offset will be after the end of the header.
	offset += "end_header\n".length;

	// We want everything before "end_header".
	const data2 = data1.split ( "end_header" )[0];

	// Remove the last newline character.
	const data3 = data2.trim();

	// Make it an array.
	const data4 = data3.split ( "\n" );

	// Remove any comments.
	const data5 = data4.filter ( ( line ) =>
	{
		return ( false === line.startsWith ( "comment" ) );
	} );

	// Make sure the first line of the header is correct.
	if ( PLY_FILE_HEADER_MAGIC_NUMBER !== data5[0] )
	{
		throw new Error ( `Incorrect first line in PLY file: ${data5[0]}, should be ${PLY_FILE_HEADER_MAGIC_NUMBER}` );
	}

	// Make sure the format is correct.
	if ( false === PLY_FILE_HEADER_FORMATS.has ( data5[1] ) )
	{
		throw new Error ( `Incorrect second line in PLY file: ${data5[1]}, should be one of ${Array.from ( PLY_FILE_HEADER_FORMATS ).join ( ", " )}` );
	}

	// Turn the array into a set.
	const lines = new Set ( data5 );

	// Return the answer.
	return { header: { lines }, offset };
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
