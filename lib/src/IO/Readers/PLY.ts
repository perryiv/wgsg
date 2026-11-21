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
import { PhongShading } from "../../Shaders";
import { Reader as BaseClass } from "../Reader";
import { readFile } from "../Functions";
import { vec3 } from "gl-matrix";
import type { IVector3 } from "../../Types";
import {
	Geometry,
	Group,
	Node as SceneNode,
} from "../../Scene/Nodes";
import {
	ColorAttribute as Color,
	Indexed,
	TwoSidedLight,
} from "../../Scene";


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

type FileHeader = Set < string >;

interface FileHeaderResult
{
	header: FileHeader;
	offset: number;
}

type EndianType = "little" | "big";


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
	const header = new Set ( data5 );

	// Return the answer.
	return { header, offset };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the text data and build the scene.
 * @param {File} file The file to read.
 * @param {FileHeader} header The header of the PLY file.
 * @param {number} offset The offset in the file where the text data starts.
 * @returns {Promise<SceneNode>} A promise that resolves with the scene node built from the text data.
 */
///////////////////////////////////////////////////////////////////////////////

const readTextData = async ( file: File, header: FileHeader, offset: number ) : Promise < SceneNode > =>
{
	// See how many vertices there are.
	const numVertices = ( () =>
	{
		const answer = Array.from ( header ).find ( ( line ) =>
		{
			return line.startsWith ( "element vertex" );
		} );
		return ( answer ? parseInt ( answer.split ( " " )[2] ) : 0 );
	} ) ();

	// Make sure the number is a positive integer.
	if ( numVertices <= 0 )
	{
		throw new Error ( `Invalid number of vertices: ${numVertices}` );
	}

	// Allocate the array for the points.
	const arrayLengthPoints = numVertices * 3;
	const points = new Float32Array ( arrayLengthPoints );

	// Loop through the lines of vertices in the text file.
	{
		let data, index, lines, numLines, line, components, x, y, z, count = 0;

		while ( count < arrayLengthPoints )
		{
			// Read the next chunk of data.
			data = ( ( await readFile ( file, "Text", offset, ( offset + 1024 ) ) ) as string );

			// Reverse find the end of the last complete line.
			index = data.lastIndexOf ( "\n" );

			// This might happen if the file is truncated.
			if ( -1 === index )
			{
				throw new Error ( "Failed to find the end of the last complete line in the vertex data" );
			}

			// Trim the data at the end of the last complete line.
			data = data.substring ( 0, index );

			// Split the data into lines.
			lines = data.split ( "\n" );

			// Loop through the lines and process each vertex.
			numLines = lines.length;
			for ( let i = 0; i < numLines; ++i )
			{
				// Get the line.
				line = lines[i];

				// Update offset.
				offset += ( line.length + 1 );

				// Split the line into components.
				line = line.trim();
				components = line.split ( " " );

				// There should be at least 3 components for the x, y, and z coordinates.
				if ( components.length < 3 )
				{
					throw new Error ( `Invalid vertex line: ${line}` );
				}

				// Get the coordinates.
				// Note: There may be more values on the line but we ignore them.
				x = parseFloat ( components[0] );
				y = parseFloat ( components[1] );
				z = parseFloat ( components[2] );

				// Write the coordinates to the array of points.
				points[count++] = x;
				points[count++] = y;
				points[count++] = z;

				// Are we done? Do this to avoid processing beyond the points.
				if ( count >= arrayLengthPoints )
				{
					break;
				}
			}
		}
	}

	// Now make the array of normals.
	const normals = new Float32Array ( arrayLengthPoints );

	// Now loop through the points and make the normal vectors. We could not do
	// this above because we were not necessarily reading 3 vertices at a time.
	{
		const a: IVector3 = [ 0, 0, 0 ];
		const b: IVector3 = [ 0, 0, 0 ];
		const c: IVector3 = [ 0, 0, 0 ];
		const n: IVector3 = [ 0, 0, 0 ];
		const ab: IVector3 = [ 0, 0, 0 ];
		const ac: IVector3 = [ 0, 0, 0 ];
		let count = 0;

		while ( count < arrayLengthPoints )
		{
			// Get the three points.
			a[0] = points[count + 0];
			a[1] = points[count + 1];
			a[2] = points[count + 2];

			b[0] = points[count + 3];
			b[1] = points[count + 4];
			b[2] = points[count + 5];

			c[0] = points[count + 6];
			c[1] = points[count + 7];
			c[2] = points[count + 8];

			// Make the vectors for the edges of the triangle.
			vec3.subtract ( ab, b, a );
			vec3.subtract ( ac, c, a );

			// Calculate the normal vector.
			vec3.cross ( n, ab, ac );

			// Make sure it's unit length.
			vec3.normalize ( n, n );

			// Store the normal vector for each point.
			normals[count++] = n[0];
			normals[count++] = n[1];
			normals[count++] = n[2];

			normals[count++] = n[0];
			normals[count++] = n[1];
			normals[count++] = n[2];

			normals[count++] = n[0];
			normals[count++] = n[1];
			normals[count++] = n[2];
		}
	}

	// The next thing should be the faces. See how many there are.
	const numFaces = ( () =>
	{
		const answer = Array.from ( header ).find ( ( line ) =>
		{
			return line.startsWith ( "element face" );
		} );
		return ( answer ? parseInt ( answer.split ( " " )[2] ) : 0 );
	} ) ();

	// Now make the array of indices.
	const arrayLengthIndices = numFaces * 3;
	const indices = new Uint32Array ( arrayLengthIndices );

	// Loop through all the faces.
	{
		let data, index, lines, numLines, line, components, a, b, c, count = 0;

		while ( count < arrayLengthIndices )
		{
			// Read the next chunk of data.
			data = ( ( await readFile ( file, "Text", offset, ( offset + 1024 ) ) ) as string );

			// Reverse find the end of the last complete line.
			index = data.lastIndexOf ( "\n" );

			// This might happen if the file is truncated.
			if ( -1 === index )
			{
				throw new Error ( "Failed to find the end of the last complete line in the face data" );
			}

			// Trim the data at the end of the last complete line.
			data = data.substring ( 0, index );

			// Split the data into lines.
			lines = data.split ( "\n" );

			// Loop through the lines and process each face.
			numLines = lines.length;
			for ( let i = 0; i < numLines; ++i )
			{
				// Get the line.
				line = lines[i];

				// Update offset.
				offset += ( line.length + 1 );

				// Split the line into components.
				line = line.trim();
				components = line.split ( " " );

				// We only handle triangles for now.
				if ( 4 === components.length )
				{
					// Get the indices of the vertices for the triangle.
					a = parseInt ( components[1] ); // Start at one!
					b = parseInt ( components[2] );
					c = parseInt ( components[3] );

					// Write the indices to the array of faces.
					indices[count++] = a;
					indices[count++] = b;
					indices[count++] = c;
				}

				// Are we done? Do this to avoid processing beyond the points.
				if ( count >= arrayLengthIndices )
				{
					break;
				}
			}
		}
	}

	// The group that we return.
	const group = new Group();

	// The geometry for the triangles.
	const tris = new Geometry ( { points, normals } );

	// Add the triangles.
	{
		// Make the primitives.
		const topology = "triangle-list";
		tris.primitives = new Indexed ( { topology, indices } );

		// The color of the triangles.
		const color = [ 0.5, 0.5, 0.5, 1.0 ];

		// Add the state.
		const state = PhongShading.makeState ( { topology } );
		state.addAttribute ( new Color ( color ) );
		state.addAttribute ( new TwoSidedLight ( true ) );
		tris.state = state;

		// To speed things up later, calculate the bounds now.
		void tris.box;

		// Add the triangles to the scene.
		group.addChild ( tris );
	}

	// To speed things up later, calculate the bounds now.
	void group.bounds;

	// Return the group.
	return group;
}


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
		const { header, offset } = await readFileHeader ( file );

		// Print what we have.
		console.debug ( header, offset );

		// Is the file ASCII or binary?
		if ( header.has ( "format ascii 1.0" ) )
		{
			return await readTextData ( file, header, offset );
		}

		// Is the file little endian binary?
		else if ( header.has ( "format binary_little_endian 1.0" ) )
		{
			return await readBinaryData ( file, header, offset, "little" );
		}

		// Is the file big endian binary?
		else if ( header.has ( "format binary_big_endian 1.0" ) )
		{
			return await readBinaryData ( file, header, offset, "big" );
		}

		// Handle unknown format.
		else
		{
			throw new Error ( "Unknown PLY format" );
		}
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
