///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for reading ASCII PLY files.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Cancelled, getReader } from "../../../../lib/src/IO";
import { PLY } from "../../../../lib/src/IO/Readers/PLY";
import { MeshBuilder } from "../../../../lib/src/IO/Readers/PLY/Common";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { PhongShading } from "../../../../lib/src/Shaders/PhongShading";
import { Geometry, Group, Indexed, Node as SceneNode } from "../../../../lib/src/Scene";
import type { IProgressCallback } from "../../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Make a PLY file from its lines.
 * @param {string[]} lines The lines.
 * @param {string} [ending] The line ending.
 * @returns {File} The file.
 */
const makeFile = ( lines: string[], ending = "\n" ) : File =>
{
	return new File ( [ lines.join ( ending ) + ending ], "test.ply" );
};

/**
 * Read the file with the PLY reader.
 * @param {File} file The file.
 * @param {IProgressCallback} [progress] The progress callback.
 * @returns {Promise<SceneNode>} The scene.
 */
const read = async ( file: File, progress?: IProgressCallback ) : Promise < SceneNode > =>
{
	const factory = getReader ( "ply" );
	expect ( factory ).to.not.be.null;
	const reader = factory!();
	if ( progress )
	{
		reader.progress = progress;
	}
	return await reader.read ( file );
};

/**
 * Get the error that reading the file rejects with.
 * @param {File} file The file.
 * @param {IProgressCallback} [progress] The progress callback.
 * @returns {Promise<Error>} The error.
 */
const getError = async ( file: File, progress?: IProgressCallback ) : Promise < Error > =>
{
	try
	{
		await read ( file, progress );
	}
	catch ( error )
	{
		return ( error as Error );
	}
	throw new Error ( "Expected reading the file to fail" );
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
 * Get the only geometry in the scene.
 * @param {SceneNode} scene The scene.
 * @returns {Geometry} The geometry.
 */
const getOnlyGeometry = ( scene: SceneNode ) : Geometry =>
{
	const geometries = getGeometries ( scene );
	expect ( geometries.length ).to.equal ( 1 );
	return geometries[0];
};

// The start of a header for vertices with x, y, and z.
const XYZ = [ "property float x", "property float y", "property float z" ];

/**
 * Make the lines of a file with the vertices and faces.
 * @param {string[]} vertices The vertex lines.
 * @param {string[]} faces The face lines.
 * @returns {string[]} The lines.
 */
const makeLines = ( vertices: string[], faces: string[] ) : string[] =>
{
	return [
		"ply",
		"format ascii 1.0",
		`element vertex ${vertices.length}`,
		...XYZ,
		`element face ${faces.length}`,
		"property list uchar int vertex_indices",
		"end_header",
		...vertices,
		...faces,
	];
};

// Four points of a square, and two triangles that make it.
const SQUARE = [ "0 0 0", "1 0 0", "1 1 0", "0 1 0" ];
const SQUARE_FACES = [ "3 0 1 2", "3 0 2 3" ];
const SQUARE_TRIANGLES = [
	[ 0, 0, 0,  1, 0, 0,  1, 1, 0 ],
	[ 0, 0, 0,  1, 1, 0,  0, 1, 0 ],
];


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Text", function ()
	{
		it ( "Should have a reader for both cases of the extension", function ()
		{
			expect ( getReader ( "ply" ) ).to.not.be.null;
			expect ( getReader ( "PLY" ) ).to.not.be.null;
			expect ( getReader ( "ply" )!() ).to.be.instanceOf ( PLY );
		} );

		it ( "Should read the points and faces, with flat shading", async function ()
		{
			const scene = await read ( makeFile ( makeLines ( SQUARE, SQUARE_FACES ) ) );
			const geom = getOnlyGeometry ( scene );
			expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( [ 0, 0, 0,  1, 0, 0,  1, 1, 0,  0, 1, 0 ] );
			expect ( Array.from ( ( geom.primitives![0] as Indexed ).indices!.values! ) ).to.deep.equal ( [ 0, 1, 2,  0, 2, 3 ] );
			expect ( geom.normals ).to.be.null;
			expect ( geom.state?.shader ).to.be.instanceOf ( FlatShading );
		} );

		it ( "Should read a file like the Stanford bunny", async function ()
		{
			const lines = [
				"ply",
				"format ascii 1.0",
				"comment zipper output",
				"element vertex 4",
				...XYZ,
				"property float confidence",
				"property float intensity",
				"element face 2",
				"property list uchar int vertex_indices",
				"end_header",
				"0 0 0 0.850855 0.5 ",
				"1 0 0 0.900159 0.5 ",
				"1 1 0 0.734503 0.5 ",
				"0 1 0 0.5 0.5 ",
				"3 0 1 2 ",
				"3 0 2 3 ",
			];
			expect ( getTriangles ( await read ( makeFile ( lines ) ) ) ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should read the normals, with smooth shading", async function ()
		{
			const lines = [
				"ply",
				"format ascii 1.0",
				"element vertex 3",
				"property float nz", "property float x", "property float ny", "property float y", "property float nx", "property float z",
				"element face 1",
				"property list uchar int vertex_indices",
				"end_header",
				"0.3 1 0.2 2 0.1 3",
				"0.6 4 0.5 5 0.4 6",
				"0.9 7 0.8 8 0.7 9",
				"3 0 1 2",
			];
			const geom = getOnlyGeometry ( await read ( makeFile ( lines ) ) );
			expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ] );
			const normals = Array.from ( geom.normals!.values! );
			[ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9 ].forEach ( ( n, i ) => expect ( normals[i] ).to.be.closeTo ( n, 1e-6 ) );
			expect ( geom.state?.shader ).to.be.instanceOf ( PhongShading );
		} );

		it ( "Should split faces with more than three vertices", async function ()
		{
			const scene = await read ( makeFile ( makeLines ( SQUARE, [ "4 0 1 2 3" ] ) ) );
			expect ( getTriangles ( scene ) ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should handle lists and other properties anywhere", async function ()
		{
			const lines = [
				"ply",
				"format ascii 1.0",
				"element vertex 4",
				"property list uchar float extra",
				...XYZ,
				"element face 2",
				"property uchar flags",
				"property list uchar int vertex_index",
				"property list uchar float texcoord",
				"end_header",
				"0 0 0 0",
				"2 9 9 1 0 0",
				"1 9 1 1 0",
				"3 9 9 9 0 1 0",
				"7 3 0 1 2 6 0 0 1 0 1 1",
				"7 3 0 2 3 0",
			];
			expect ( getTriangles ( await read ( makeFile ( lines ) ) ) ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should skip other elements, before, between, and after", async function ()
		{
			const lines = [
				"ply",
				"format ascii 1.0",
				"element material 1",
				"property uchar red",
				"element vertex 4",
				...XYZ,
				"element edge 2",
				"property int vertex1",
				"property int vertex2",
				"element face 2",
				"property list uchar int vertex_indices",
				"element extra 1",
				"property list uchar int stuff",
				"end_header",
				"255",
				...SQUARE,
				"0 1",
				"this is not checked",
				...SQUARE_FACES,
				"2 5 6",
			];
			expect ( getTriangles ( await read ( makeFile ( lines ) ) ) ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should accept Windows line endings, tabs, extra spaces, and empty lines", async function ()
		{
			const lines = makeLines ( SQUARE, SQUARE_FACES );
			lines.splice ( lines.indexOf ( "end_header" ) + 1, 0, "" );
			lines.push ( "", "   " );
			const messy = lines.map ( ( line ) => line.replace ( / /g, " \t  " ) );
			const scene = await read ( makeFile ( messy, "\r\n" ) );
			expect ( getTriangles ( scene ) ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should accept other ways of writing numbers", async function ()
		{
			const vertices = [ "0.0 -0 +0", "1e0 0.0e5 0", "1. 1.000 0", ".0 10E-1 -0.0" ];
			const scene = await read ( makeFile ( makeLines ( vertices, SQUARE_FACES ) ) );
			const triangles = getTriangles ( scene ).map ( ( t ) => t.map ( ( v ) => ( v + 0 ) ) ); // Make -0 into 0.
			expect ( triangles ).to.deep.equal ( SQUARE_TRIANGLES );
		} );

		it ( "Should read a file with no vertices or faces", async function ()
		{
			const scene = await read ( makeFile ( makeLines ( [], [] ) ) );
			expect ( getGeometries ( scene ) ).to.deep.equal ( [] );

			// Also when the file ends with "end_header" and no line ending.
			const header = makeLines ( [], [] ).join ( "\n" );
			expect ( getGeometries ( await read ( new File ( [ header ], "test.ply" ) ) ) ).to.deep.equal ( [] );
		} );

		it ( "Should use the setting for the most vertices in a geometry", async function ()
		{
			const saved = PLY.maxVerticesPerGeometry;
			try
			{
				PLY.maxVerticesPerGeometry = 3;
				expect ( MeshBuilder.maxVerticesPerGeometry ).to.equal ( 3 );
				const scene = await read ( makeFile ( makeLines ( SQUARE, SQUARE_FACES ) ) );
				expect ( getGeometries ( scene ).length ).to.equal ( 2 );
				expect ( getTriangles ( scene ) ).to.deep.equal ( SQUARE_TRIANGLES );
				expect ( () => { PLY.maxVerticesPerGeometry = 2; } ).to.throw ( "at least 3, not 2" );
			}
			finally
			{
				PLY.maxVerticesPerGeometry = saved;
			}
			expect ( PLY.maxVerticesPerGeometry ).to.equal ( saved );
		} );

		it ( "Should report progress that ends with the file size", async function ()
		{
			const file = makeFile ( makeLines ( SQUARE, SQUARE_FACES ) );
			const calls: number[][] = [];
			await read ( file, ( value, total ) =>
			{
				calls.push ( [ value, total ] );
				return true;
			} );
			expect ( calls.length ).to.be.greaterThan ( 0 );
			expect ( calls[calls.length - 1] ).to.deep.equal ( [ file.size, file.size ] );
		} );

		it ( "Should reject with Cancelled when the progress callback returns false", async function ()
		{
			const file = makeFile ( makeLines ( SQUARE, SQUARE_FACES ) );
			expect ( await getError ( file, () => false ) ).to.be.instanceOf ( Cancelled );
			const onlyLast = ( value: number, total: number ) => ( value < total );
			expect ( await getError ( file, onlyLast ) ).to.be.instanceOf ( Cancelled );
		} );

		describe ( "Errors", function ()
		{
			/**
			 * Get the message of the error from reading the lines.
			 * @param {string[]} lines The lines.
			 * @returns {Promise<string>} The message.
			 */
			const getMessage = async ( lines: string[] ) : Promise < string > =>
			{
				const error = await getError ( makeFile ( lines ) );
				expect ( error ).to.not.be.instanceOf ( Cancelled );
				return error.message;
			};

			it ( "Should reject a file that is not PLY", async function ()
			{
				expect ( await getMessage ( [ "solid test", "endsolid test" ] ) ).to.equal (
					"Error reading PLY file: Not a PLY file, the first line is not 'ply'" );
			} );

			it ( "Should reject binary files for now", async function ()
			{
				const lines = makeLines ( [], [] );
				lines[1] = "format binary_little_endian 1.0";
				expect ( await getMessage ( lines ) ).to.equal ( "Error reading PLY file: Binary PLY files are not supported yet" );
			} );

			it ( "Should reject a header without what is needed", async function ()
			{
				const lines = makeLines ( SQUARE, SQUARE_FACES );
				lines[5] = "property float w";
				expect ( await getMessage ( lines ) ).to.equal ( "Error reading PLY file: The PLY vertices have no 'z' property" );
			} );

			it ( "Should reject a value that is not a number, with the line number", async function ()
			{
				const vertices = [ ...SQUARE ];
				vertices[2] = "1 one 0";
				expect ( await getMessage ( makeLines ( vertices, SQUARE_FACES ) ) ).to.equal (
					"Error reading PLY file: Invalid value 'one' for property 'y', in vertex 2 on line 12 of the PLY file" );

				const faces = [ "3 0 1 x" ];
				expect ( await getMessage ( makeLines ( SQUARE, faces ) ) ).to.equal (
					"Error reading PLY file: Invalid value 'x' for property 'vertex_indices', in face 0 on line 14 of the PLY file" );
			} );

			it ( "Should reject a record with too few or too many values", async function ()
			{
				const few = [ ...SQUARE ];
				few[1] = "1 0";
				expect ( await getMessage ( makeLines ( few, SQUARE_FACES ) ) ).to.equal (
					"Error reading PLY file: There are 2 values, but the properties of 'vertex' need 3, in vertex 1 on line 11 of the PLY file" );

				expect ( await getMessage ( makeLines ( SQUARE, [ "3 0 1 2 3" ] ) ) ).to.include (
					"There are 5 values, but the properties of 'face' need 4, in face 0 on line 14" );
				expect ( await getMessage ( makeLines ( SQUARE, [ "4 0 1 2" ] ) ) ).to.include (
					"There are 4 values, but the properties of 'face' need 5, in face 0 on line 14" );
			} );

			it ( "Should reject a bad list count", async function ()
			{
				for ( const count of [ "-1", "1.5", "x" ] )
				{
					expect ( await getMessage ( makeLines ( SQUARE, [ `${count} 0 1 2` ] ) ) ).to.include (
						`Invalid count '${count}' for list 'vertex_indices', in face 0 on line 14` );
				}
			} );

			it ( "Should reject an index that is not a vertex", async function ()
			{
				expect ( await getMessage ( makeLines ( SQUARE, [ "3 0 1 2", "3 0 4 1" ] ) ) ).to.equal (
					"Error reading PLY file: PLY face has vertex index 4, but there are 4 vertices, in face 1 on line 15 of the PLY file" );
				expect ( await getMessage ( makeLines ( SQUARE, [ "3 0 1.5 2" ] ) ) ).to.include ( "vertex index 1.5" );
			} );

			it ( "Should reject more data than the header says", async function ()
			{
				expect ( await getMessage ( [ ...makeLines ( SQUARE, SQUARE_FACES ), "3 0 1 2" ] ) ).to.equal (
					"Error reading PLY file: There is more data than the PLY header says, in the end on line 16 of the PLY file" );
			} );

			it ( "Should reject a file that ends too soon", async function ()
			{
				const lines = makeLines ( SQUARE, SQUARE_FACES );
				expect ( await getMessage ( lines.slice ( 0, -1 ) ) ).to.equal (
					"Error reading PLY file: The PLY file ended after 1 of the 2 records of element 'face'" );
				expect ( await getMessage ( lines.slice ( 0, -4 ) ) ).to.equal (
					"Error reading PLY file: The PLY file ended after 2 of the 4 records of element 'vertex'" );
			} );
		} );
	} );
}
