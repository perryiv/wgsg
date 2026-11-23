///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for reading binary PLY files.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Cancelled, getReader } from "../../../../lib/src/IO";
import { PLY } from "../../../../lib/src/IO/Readers/PLY";
import { readBinary } from "../../../../lib/src/IO/Readers/PLY/Binary";
import { readHeader } from "../../../../lib/src/IO/Readers/PLY/Header";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { PhongShading } from "../../../../lib/src/Shaders/PhongShading";
import { Geometry, Group, Indexed, Node as SceneNode } from "../../../../lib/src/Scene";
import type { IProgressCallback } from "../../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

// A value to write, as its type in the header and the number.
type IValue = [ string, number ];

// How to write each type.
const WRITERS: Record < string, [ number, ( view: DataView, offset: number, value: number, little: boolean ) => void ] > = {
	char: [ 1, ( v, o, n ) => v.setInt8 ( o, n ) ],
	uchar: [ 1, ( v, o, n ) => v.setUint8 ( o, n ) ],
	short: [ 2, ( v, o, n, l ) => v.setInt16 ( o, n, l ) ],
	ushort: [ 2, ( v, o, n, l ) => v.setUint16 ( o, n, l ) ],
	int: [ 4, ( v, o, n, l ) => v.setInt32 ( o, n, l ) ],
	uint: [ 4, ( v, o, n, l ) => v.setUint32 ( o, n, l ) ],
	float: [ 4, ( v, o, n, l ) => v.setFloat32 ( o, n, l ) ],
	double: [ 8, ( v, o, n, l ) => v.setFloat64 ( o, n, l ) ],
};

/**
 * Make the bytes of the values.
 * @param {IValue[]} values The values.
 * @param {boolean} little True for little endian.
 * @returns {Uint8Array} The bytes.
 */
const toBytes = ( values: IValue[], little: boolean ) : Uint8Array < ArrayBuffer > =>
{
	const size = values.reduce ( ( sum, [ type ] ) => ( sum + WRITERS[type][0] ), 0 );
	const bytes = new Uint8Array ( size );
	const view = new DataView ( bytes.buffer );
	let offset = 0;
	for ( const [ type, value ] of values )
	{
		const [ typeSize, write ] = WRITERS[type];
		write ( view, offset, value, little );
		offset += typeSize;
	}
	return bytes;
};

/**
 * Make a binary PLY file.
 * @param {string[]} lines The lines of the header between the format and "end_header".
 * @param {IValue[]} values The data.
 * @param {boolean} [little] True for little endian.
 * @returns {File} The file.
 */
const makeFile = ( lines: string[], values: IValue[], little = true ) : File =>
{
	const format = ( little ? "binary_little_endian" : "binary_big_endian" );
	const header = [ "ply", `format ${format} 1.0`, ...lines, "end_header", "" ].join ( "\n" );
	return new File ( [ header, toBytes ( values, little ) ], "test.ply" );
};

/**
 * Read the file with the PLY reader.
 * @param {File} file The file.
 * @param {IProgressCallback} [progress] The progress callback.
 * @returns {Promise<SceneNode>} The scene.
 */
const read = async ( file: File, progress?: IProgressCallback ) : Promise < SceneNode > =>
{
	const reader = getReader ( "ply" )!();
	if ( progress )
	{
		reader.progress = progress;
	}
	return await reader.read ( file );
};

/**
 * Get the error that the promise rejects with.
 * @param {Promise<unknown>} promise The promise.
 * @returns {Promise<Error>} The error.
 */
const getError = async ( promise: Promise < unknown > ) : Promise < Error > =>
{
	try
	{
		await promise;
	}
	catch ( error )
	{
		return ( error as Error );
	}
	throw new Error ( "Expected the promise to reject" );
};

/**
 * Get the geometries in the scene.
 * @param {SceneNode} scene The scene.
 * @returns {Geometry[]} The geometries.
 */
const getGeometries = ( scene: SceneNode ) : Geometry[] =>
{
	expect ( scene ).to.be.instanceOf ( Group );
	const answer: Geometry[] = [];
	( scene as Group ).forEachChild ( ( child ) =>
	{
		expect ( child ).to.be.instanceOf ( Geometry );
		answer.push ( child as Geometry );
	} );
	return answer;
};

/**
 * Get the triangles in the scene as their corner points, in order.
 * @param {SceneNode} scene The scene.
 * @returns {number[][]} Each triangle as [ x0, y0, z0, x1, y1, z1, x2, y2, z2 ].
 */
const getTriangles = ( scene: SceneNode ) : number[][] =>
{
	const answer: number[][] = [];
	for ( const geom of getGeometries ( scene ) )
	{
		const points = Array.from ( geom.points!.values! );
		const indices = Array.from ( ( geom.primitives![0] as Indexed ).indices!.values! );
		for ( let i = 0; i < indices.length; i += 3 )
		{
			answer.push ( indices.slice ( i, i + 3 ).map ( ( v ) => points.slice ( v * 3, v * 3 + 3 ) ).flat() );
		}
	}
	return answer;
};

/**
 * Make values for points with float x, y, and z.
 * @param {number[]} coordinates The coordinates.
 * @returns {IValue[]} The values.
 */
const floats = ( coordinates: number[] ) : IValue[] =>
{
	return coordinates.map ( ( n ) : IValue => [ "float", n ] );
};

/**
 * Make values for a face with a uchar count and int indices.
 * @param {number[]} indices The indices.
 * @returns {IValue[]} The values.
 */
const face = ( indices: number[] ) : IValue[] =>
{
	return [ [ "uchar", indices.length ], ...indices.map ( ( i ) : IValue => [ "int", i ] ) ];
};

// A header like the one in the Stanford Lucy scan.
const LUCY_LINES = ( numVertices: number, numFaces: number ) : string[] => [
	`element vertex ${numVertices}`,
	"property float x",
	"property float y",
	"property float z",
	`element face ${numFaces}`,
	"property list uchar int vertex_indices",
];

// Four points of a square, and two triangles that make it.
const SQUARE = [ 0, 0, 0,  1, 0, 0,  1, 1, 0,  0, 1, 0 ];
const SQUARE_VALUES = [ ...floats ( SQUARE ), ...face ( [ 0, 1, 2 ] ), ...face ( [ 0, 2, 3 ] ) ];
const SQUARE_TRIANGLES = [
	[ 0, 0, 0,  1, 0, 0,  1, 1, 0 ],
	[ 0, 0, 0,  1, 1, 0,  0, 1, 0 ],
];

/**
 * Make a file with every kind of thing in it: other elements before,
 * between, and after; lists in the vertices; other properties; a polygon;
 * and types of every size.
 * @param {boolean} little True for little endian.
 * @returns {File} The file.
 */
const makeEverythingFile = ( little: boolean ) : File =>
{
	const lines = [
		"element material 2",
		"property uchar red",
		"property list ushort double weights",
		"element vertex 4",
		"property list char short extra",
		"property double x",
		"property short y",
		"property char z",
		"property uint id",
		"element edge 1",
		"property int vertex1",
		"property int vertex2",
		"element face 1",
		"property uchar flags",
		"property list uint ushort vertex_index",
		"property list uchar float texcoord",
		"element nothing 0",
		"property int nada",
		"element extra 2",
		"property list int uchar stuff",
	];
	const values: IValue[] = [
		// Materials.
		[ "uchar", 255 ], [ "ushort", 0 ],
		[ "uchar", 128 ], [ "ushort", 2 ], [ "double", 0.5 ], [ "double", 0.25 ],
		// Vertices.
		[ "char", 0 ], [ "double", 0 ], [ "short", 0 ], [ "char", 0 ], [ "uint", 10 ],
		[ "char", 1 ], [ "short", -7 ], [ "double", 1 ], [ "short", 0 ], [ "char", 0 ], [ "uint", 11 ],
		[ "char", 2 ], [ "short", 7 ], [ "short", 8 ], [ "double", 1 ], [ "short", 1 ], [ "char", 0 ], [ "uint", 12 ],
		[ "char", 0 ], [ "double", 0 ], [ "short", 1 ], [ "char", 0 ], [ "uint", 13 ],
		// Edges.
		[ "int", 0 ], [ "int", 1 ],
		// A square as one face.
		[ "uchar", 9 ], [ "uint", 4 ], [ "ushort", 0 ], [ "ushort", 1 ], [ "ushort", 2 ], [ "ushort", 3 ],
		[ "uchar", 2 ], [ "float", 0.5 ], [ "float", 0.5 ],
		// Extra.
		[ "int", 3 ], [ "uchar", 1 ], [ "uchar", 2 ], [ "uchar", 3 ],
		[ "int", 0 ],
	];
	return makeFile ( lines, values, little );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Binary", function ()
	{
		it ( "Should read both little and big endian files, with flat shading", async function ()
		{
			for ( const little of [ true, false ] )
			{
				const scene = await read ( makeFile ( LUCY_LINES ( 4, 2 ), SQUARE_VALUES, little ) );
				const geometries = getGeometries ( scene );
				expect ( geometries.length ).to.equal ( 1 );
				const geom = geometries[0];
				expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( SQUARE );
				expect ( Array.from ( ( geom.primitives![0] as Indexed ).indices!.values! ) ).to.deep.equal ( [ 0, 1, 2,  0, 2, 3 ] );
				expect ( geom.normals ).to.be.null;
				expect ( geom.state?.shader ).to.be.instanceOf ( FlatShading );
			}
		} );

		it ( "Should read the normals, with smooth shading", async function ()
		{
			const lines = [
				"element vertex 3",
				"property float nx", "property float x", "property float ny", "property float y", "property float nz", "property float z",
				"element face 1",
				"property list uchar int vertex_indices",
			];
			const values = [
				...floats ( [ 0.5, 1, 0.25, 2, 0.125, 3 ] ),
				...floats ( [ 1, 4, 0, 5, 0, 6 ] ),
				...floats ( [ 0, 7, 1, 8, 0, 9 ] ),
				...face ( [ 0, 1, 2 ] ),
			];
			const geom = getGeometries ( await read ( makeFile ( lines, values ) ) )[0];
			expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ] );
			expect ( Array.from ( geom.normals!.values! ) ).to.deep.equal ( [ 0.5, 0.25, 0.125, 1, 0, 0, 0, 1, 0 ] );
			expect ( geom.state?.shader ).to.be.instanceOf ( PhongShading );
		} );

		it ( "Should read every type, lists anywhere, polygons, and skip other elements", async function ()
		{
			for ( const little of [ true, false ] )
			{
				expect ( getTriangles ( await read ( makeEverythingFile ( little ) ) ) ).to.deep.equal ( SQUARE_TRIANGLES );
			}
		} );

		it ( "Should read the same thing with any chunk size", async function ()
		{
			for ( const little of [ true, false ] )
			{
				const file = makeEverythingFile ( little );
				const header = await readHeader ( file );
				const dataSize = file.size - header.dataOffset;
				for ( let chunkSize = 1; chunkSize <= ( dataSize + 1 ); ++chunkSize )
				{
					const calls: number[] = [];
					const scene = await readBinary ( file, header, ( value ) => { calls.push ( value ); return true; }, chunkSize );
					expect ( getTriangles ( scene ) ).to.deep.equal ( SQUARE_TRIANGLES );

					// The progress only goes up, and ends at the size.
					calls.forEach ( ( value, i ) => expect ( value ).to.be.at.least ( calls[i - 1] ?? 0 ) );
					expect ( calls[calls.length - 1] ).to.equal ( file.size );
				}
			}
		} );

		it ( "Should read a file with no vertices or faces", async function ()
		{
			const scene = await read ( makeFile ( LUCY_LINES ( 0, 0 ), [] ) );
			expect ( getGeometries ( scene ) ).to.deep.equal ( [] );
		} );

		it ( "Should read many faces into more than one geometry", async function ()
		{
			// A strip of triangles, 2 for each pair of points.
			const n = 1000;
			const coordinates: number[] = [];
			for ( let i = 0; i < n; ++i )
			{
				coordinates.push ( i, 0, 0,  i, 1, 0 );
			}
			const faces: IValue[] = [];
			const expected: number[][] = [];
			for ( let i = 0; i < ( n - 1 ); ++i )
			{
				const a = i * 2;
				faces.push ( ...face ( [ a, a + 2, a + 1 ] ), ...face ( [ a + 1, a + 2, a + 3 ] ) );
				expected.push ( [ i, 0, 0,  i + 1, 0, 0,  i, 1, 0 ], [ i, 1, 0,  i + 1, 0, 0,  i + 1, 1, 0 ] );
			}
			const file = makeFile ( LUCY_LINES ( n * 2, ( n - 1 ) * 2 ), [ ...floats ( coordinates ), ...faces ], false );

			const saved = PLY.maxVerticesPerGeometry;
			try
			{
				PLY.maxVerticesPerGeometry = 100;
				const header = await readHeader ( file );
				const scene = await readBinary ( file, header, () => true, 1000 );
				const geometries = getGeometries ( scene );
				expect ( geometries.length ).to.be.greaterThan ( 20 );
				geometries.forEach ( ( geom ) => expect ( geom.points!.values!.length ).to.be.at.most ( 300 ) );
				expect ( getTriangles ( scene ) ).to.deep.equal ( expected );
			}
			finally
			{
				PLY.maxVerticesPerGeometry = saved;
			}
		} );

		it ( "Should report progress that ends with the file size", async function ()
		{
			const file = makeFile ( LUCY_LINES ( 4, 2 ), SQUARE_VALUES );
			const calls: number[][] = [];
			await read ( file, ( value, total ) =>
			{
				calls.push ( [ value, total ] );
				return true;
			} );
			expect ( calls[calls.length - 1] ).to.deep.equal ( [ file.size, file.size ] );
		} );

		it ( "Should reject with Cancelled when the progress callback returns false", async function ()
		{
			const file = makeFile ( LUCY_LINES ( 4, 2 ), SQUARE_VALUES );
			expect ( await getError ( read ( file, () => false ) ) ).to.be.instanceOf ( Cancelled );
			const onlyLast = ( value: number, total: number ) => ( value < total );
			expect ( await getError ( read ( file, onlyLast ) ) ).to.be.instanceOf ( Cancelled );

			// When it is not the last chunk too.
			const header = await readHeader ( file );
			expect ( await getError ( readBinary ( file, header, () => false, 10 ) ) ).to.be.instanceOf ( Cancelled );
		} );

		describe ( "Errors", function ()
		{
			/**
			 * Get the message of the error from reading the file.
			 * @param {File} file The file.
			 * @returns {Promise<string>} The message.
			 */
			const getMessage = async ( file: File ) : Promise < string > =>
			{
				const error = await getError ( read ( file ) );
				expect ( error ).to.not.be.instanceOf ( Cancelled );
				return error.message;
			};

			it ( "Should reject a file that ends too soon, wherever it ends", async function ()
			{
				const lines = LUCY_LINES ( 4, 2 );
				const full = makeFile ( lines, SQUARE_VALUES );
				const header = await readHeader ( full );
				const bytes = new Uint8Array ( await full.arrayBuffer() );

				// The records end at these offsets in the data.
				const ends = [ 12, 24, 36, 48, 61, 74 ];
				for ( let size = header.dataOffset; size < bytes.length; ++size )
				{
					const data = size - header.dataOffset;
					const done = ends.filter ( ( end ) => ( end <= data ) ).length;
					const where = ( ( done < 4 ) ? `${done} of the 4 records of element 'vertex'` : `${done - 4} of the 2 records of element 'face'` );
					const message = await getMessage ( new File ( [ bytes.subarray ( 0, size ) ], "test.ply" ) );
					expect ( message ).to.equal ( `Error reading PLY file: The PLY file ended after ${where}` );
				}
			} );

			it ( "Should reject more data than the header says", async function ()
			{
				for ( const extra of [ 1, 13, 100 ] )
				{
					const file = makeFile ( LUCY_LINES ( 4, 2 ), [ ...SQUARE_VALUES, ...new Array < IValue > ( extra ).fill ( [ "uchar", 0 ] ) ] );
					expect ( await getMessage ( file ) ).to.equal (
						`Error reading PLY file: There are ${extra} more bytes of data than the PLY header says` );
				}
			} );

			it ( "Should reject an index that is not a vertex, with where it is", async function ()
			{
				const file = makeFile ( LUCY_LINES ( 4, 2 ), [ ...floats ( SQUARE ), ...face ( [ 0, 1, 2 ] ), ...face ( [ 0, -1, 3 ] ) ] );
				const header = await readHeader ( file );
				expect ( await getMessage ( file ) ).to.equal (
					"Error reading PLY file: PLY face has vertex index -1, but there are 4 vertices, " +
					`in face 1 at byte ${header.dataOffset + 61} of the PLY file` );
			} );

			it ( "Should reject a point that is not finite", async function ()
			{
				for ( const bad of [ NaN, Infinity, -Infinity ] )
				{
					const points = [ ...SQUARE ];
					points[7] = bad;
					const file = makeFile ( LUCY_LINES ( 4, 2 ), [ ...floats ( points ), ...face ( [ 0, 1, 2 ] ) ] );
					const header = await readHeader ( file );
					expect ( await getMessage ( file ) ).to.equal (
						`Error reading PLY file: Invalid value '${bad}' for property 'y', in vertex 2 at byte ${header.dataOffset + 24} of the PLY file` );
				}

				// With the walking reader too.
				const lines = [ "element vertex 1", "property list uchar float extra", ...LUCY_LINES ( 1, 0 ).slice ( 1 ) ];
				const file = makeFile ( lines, [ [ "uchar", 0 ], ...floats ( [ 0, 0, NaN ] ) ] );
				expect ( await getMessage ( file ) ).to.include ( "Invalid value 'NaN' for property 'z', in vertex 0" );
			} );

			it ( "Should reject a negative list count", async function ()
			{
				const lines = [ ...LUCY_LINES ( 4, 1 ) ];
				lines[5] = "property list char int vertex_indices";
				const file = makeFile ( lines, [ ...floats ( SQUARE ), [ "char", -1 ] ] );
				expect ( await getMessage ( file ) ).to.include ( "Invalid count '-1' for list 'vertex_indices', in face 0 at byte" );
			} );

			it ( "Should reject a bad chunk size and the wrong format", async function ()
			{
				const file = makeFile ( LUCY_LINES ( 4, 2 ), SQUARE_VALUES );
				const header = await readHeader ( file );
				for ( const bad of [ 0, -1, 1.5, NaN ] )
				{
					expect ( ( await getError ( readBinary ( file, header, () => true, bad ) ) ).message ).to.equal ( `Invalid chunk size: ${bad}` );
				}
				const text = new File ( [ "ply\nformat ascii 1.0\nend_header\n" ], "test.ply" );
				expect ( ( await getError ( readBinary ( text, await readHeader ( text ), () => true ) ) ).message ).to.equal (
					"Reading an 'ascii' PLY file as binary" );
			} );
		} );
	} );
}
