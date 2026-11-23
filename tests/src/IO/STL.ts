///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the STL reader. The files are made in memory by the tests.
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled, getReader } from "../../../lib/src/IO";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { ColorAttribute } from "../../../lib/src/Scene";
import { expect } from "chai";
import { Geometry, Group, Node as SceneNode } from "../../../lib/src/Scene/Nodes";
import { Arrays } from "../../../lib/src/Scene/Primitives/Arrays";
import { STL_MAX_TRIANGLES_PER_GEOMETRY } from "../../../lib/src/IO/Readers/STL/Common";
import type { IProgressCallback } from "../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types and helper functions.
//
///////////////////////////////////////////////////////////////////////////////

interface ITriangle
{
	normal: number[]; // 3 values.
	points: number[]; // 9 values.
}

/**
 * Make a binary STL file.
 * @param {ITriangle[]} triangles The triangles.
 * @param {Uint8Array} [header] The bytes to put at the start of the 80 byte header.
 * @returns {File} The file.
 */
const makeBinaryFile = ( triangles: ITriangle[], header?: Uint8Array ) : File =>
{
	const buffer = new ArrayBuffer ( 84 + ( triangles.length * 50 ) );
	const view = new DataView ( buffer );

	if ( header )
	{
		new Uint8Array ( buffer, 0, 80 ).set ( header.subarray ( 0, 80 ) );
	}

	view.setUint32 ( 80, triangles.length, true );

	let offset = 84;
	for ( const { normal, points } of triangles )
	{
		for ( const value of [ ...normal, ...points ] )
		{
			view.setFloat32 ( offset, value, true );
			offset += 4;
		}
		offset += 2; // The attribute byte count.
	}

	return new File ( [ buffer ], "test.stl" );
};

/**
 * Make a text STL file.
 * @param {string} text The contents of the file.
 * @returns {File} The file.
 */
const makeTextFile = ( text: string ) : File =>
{
	return new File ( [ text ], "test.stl" );
};

/**
 * Read the file with the STL reader.
 * @param {File} file The file.
 * @param {IProgressCallback} [progress] The progress callback.
 * @returns {Promise<SceneNode>} The scene.
 */
const read = async ( file: File, progress?: IProgressCallback ) : Promise < SceneNode > =>
{
	const factory = getReader ( "stl" );
	if ( !factory )
	{
		throw new Error ( "No reader for 'stl' files" );
	}
	const reader = factory();
	reader.progress = ( progress ?? null );
	return await reader.read ( file );
};

/**
 * Return the error that the promise rejects with.
 * @param {Promise<unknown>} promise The promise that should reject.
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
 * Get all the geometries in the scene, in order.
 * @param {SceneNode} node The scene.
 * @returns {Geometry[]} The geometries.
 */
const getGeometries = ( node: SceneNode ) : Geometry[] =>
{
	if ( node instanceof Geometry )
	{
		return [ node ];
	}
	const answer: Geometry[] = [];
	if ( node instanceof Group )
	{
		node.forEachChild ( ( child: SceneNode ) =>
		{
			answer.push ( ...getGeometries ( child ) );
		} );
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

/**
 * Get the points of the geometry as a plain array, and its only primitives,
 * which have no indices.
 * @param {Geometry} geom The geometry.
 * @returns {{ points: number[], prims: Arrays }} The points and primitives.
 */
const getArrays = ( geom: Geometry ) : { points: number[], prims: Arrays } =>
{
	const primitives = geom.primitives;
	expect ( primitives ).to.not.be.null;
	expect ( primitives!.length ).to.equal ( 1 );
	const prims = primitives![0];
	expect ( prims ).to.be.instanceOf ( Arrays );
	expect ( prims.topology ).to.equal ( "triangle-list" );
	return {
		points: Array.from ( geom.points?.values ?? [] ),
		prims: ( prims as Arrays ),
	};
};

/**
 * Get the color of the geometry.
 * @param {Geometry} geom The geometry.
 * @returns {number[]} The color.
 */
const getColor = ( geom: Geometry ) : number[] =>
{
	for ( const attribute of ( geom.state?.attributes.values() ?? [] ) )
	{
		if ( attribute instanceof ColorAttribute )
		{
			return Array.from ( attribute.color );
		}
	}
	throw new Error ( "Geometry has no color attribute" );
};

// Two triangles that are easy to check. The values are exact in 32 bits.
const TRIANGLE_1: ITriangle = { normal: [ 0, 0, 2 ], points: [ 0, 0, 0, 1, 0, 0, 0, 1, 0 ] };
const TRIANGLE_2: ITriangle = { normal: [ 0, 0, 1 ], points: [ 1, 0, 0, 1, 1, 0, 0, 1, 0.5 ] };

// The same two triangles as text, with different line endings, case, and
// white space, and without a newline at the end.
const TEXT_TWO_TRIANGLES = [
	"solid test",
	"  facet normal 0 0 2",
	"    outer loop",
	"      vertex 0 0 0",
	"      vertex 1 0 0",
	"      vertex 0 1 0",
	"    endloop",
	"  endfacet\r",
	"",
	"\tFACET NORMAL 0 0 1",
	"OUTER LOOP",
	"VERTEX 1 0 0",
	"VERTEX   1 1 0",
	"VERTEX 0 1 0.5",
	"ENDLOOP",
	"ENDFACET",
	"endsolid test",
].join ( "\n" );


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "STL", function ()
	{
		describe ( "Binary", function ()
		{
			it ( "Should read the points, and have no normals or indices", async function ()
			{
				const scene = await read ( makeBinaryFile ( [ TRIANGLE_1, TRIANGLE_2 ] ) );
				const geom = getOnlyGeometry ( scene );
				const { points, prims } = getArrays ( geom );

				expect ( points ).to.deep.equal ( [ ...TRIANGLE_1.points, ...TRIANGLE_2.points ] );
				expect ( prims.first ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 6 );
				expect ( geom.normals ).to.be.null;
			} );

			it ( "Should use flat shading", async function ()
			{
				const scene = await read ( makeBinaryFile ( [ TRIANGLE_1 ] ) );
				expect ( getOnlyGeometry ( scene ).state?.shader ).to.be.instanceOf ( FlatShading );
			} );

			it ( "Should ignore the normals in the file, even ones that are not finite", async function ()
			{
				const triangle = { normal: [ NaN, Infinity, 0 ], points: [ 0, 0, 0, 2, 0, 0, 0, 2, 0 ] };
				const scene = await read ( makeBinaryFile ( [ triangle ] ) );
				const geom = getOnlyGeometry ( scene );
				expect ( getArrays ( geom ).points ).to.deep.equal ( triangle.points );
				expect ( geom.normals ).to.be.null;
			} );

			it ( "Should read the color, including alpha, from the header", async function ()
			{
				// A 2-byte UTF-8 character before the keyword makes sure the color
				// is found by byte offset, not by character index.
				const header = new Uint8Array ( [
					...new TextEncoder().encode ( "Made by é COLOR=" ),
					255, 0, 51, 102
				] );
				const scene = await read ( makeBinaryFile ( [ TRIANGLE_1 ], header ) );
				const color = getColor ( getOnlyGeometry ( scene ) );

				expect ( color[0] ).to.be.closeTo ( 1.0, 1e-6 );
				expect ( color[1] ).to.be.closeTo ( 0.0, 1e-6 );
				expect ( color[2] ).to.be.closeTo ( 0.2, 1e-6 );
				expect ( color[3] ).to.be.closeTo ( 0.4, 1e-6 );
			} );

			it ( "Should read a file with no triangles", async function ()
			{
				const scene = await read ( makeBinaryFile ( [] ) );
				const { points, prims } = getArrays ( getOnlyGeometry ( scene ) );
				expect ( points.length ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 0 );
			} );

			it ( "Should reject a triangle with a non-finite value", async function ()
			{
				const triangle = { normal: [ 0, 0, 1 ], points: [ 0, 0, 0, NaN, 0, 0, 0, 1, 0 ] };
				const error = await getError ( read ( makeBinaryFile ( [ TRIANGLE_1, triangle ] ) ) );

				expect ( error ).to.not.be.instanceOf ( Cancelled );
				expect ( error.message ).to.equal ( "Error reading STL file: Second point for triangle 1 has non-finite values" );
			} );

			it ( "Should reject with Cancelled when the progress callback returns false", async function ()
			{
				const error = await getError ( read ( makeBinaryFile ( [ TRIANGLE_1, TRIANGLE_2 ] ), () => false ) );
				expect ( error ).to.be.instanceOf ( Cancelled );
			} );

			it ( "Should reject with Cancelled when only the final progress call returns false", async function ()
			{
				const progress = ( value: number, total: number ) => ( value < total );
				const error = await getError ( read ( makeBinaryFile ( [ TRIANGLE_1, TRIANGLE_2 ] ), progress ) );
				expect ( error ).to.be.instanceOf ( Cancelled );
			} );

			it ( "Should report progress that ends with the total", async function ()
			{
				const calls: number[][] = [];
				await read ( makeBinaryFile ( [ TRIANGLE_1, TRIANGLE_2 ] ), ( value, total ) =>
				{
					calls.push ( [ value, total ] );
					return true;
				} );
				expect ( calls[calls.length - 1] ).to.deep.equal ( [ 2, 2 ] );
			} );

			it ( "Should split a big file into more than one geometry", async function ()
			{
				// Make the file directly because there are so many triangles.
				const numTriangles = STL_MAX_TRIANGLES_PER_GEOMETRY + 1;
				const buffer = new ArrayBuffer ( 84 + ( numTriangles * 50 ) );
				const view = new DataView ( buffer );
				view.setUint32 ( 80, numTriangles, true );
				for ( let i = 0; i < numTriangles; ++i )
				{
					const offset = 84 + ( i * 50 );
					view.setFloat32 ( offset + 8, 1, true );  // Normal z.
					view.setFloat32 ( offset + 24, 1, true ); // Second point x.
					view.setFloat32 ( offset + 40, 1, true ); // Third point y.
					view.setFloat32 ( offset + 44, i, true ); // Third point z.
				}

				const scene = await read ( new File ( [ buffer ], "big.stl" ) );
				const geometries = getGeometries ( scene );

				expect ( geometries.length ).to.equal ( 2 );
				expect ( geometries[0].points?.length ).to.equal ( STL_MAX_TRIANGLES_PER_GEOMETRY * 9 );
				expect ( geometries[1].points?.length ).to.equal ( 9 );

				// The last triangle should be the only one in the second geometry.
				expect ( getArrays ( geometries[0] ).prims.count ).to.equal ( STL_MAX_TRIANGLES_PER_GEOMETRY * 3 );
				const { points, prims } = getArrays ( geometries[1] );
				expect ( points[8] ).to.equal ( STL_MAX_TRIANGLES_PER_GEOMETRY );
				expect ( prims.first ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 3 );
			} );
		} );

		describe ( "Text", function ()
		{
			it ( "Should read the points, and have no normals or indices", async function ()
			{
				const scene = await read ( makeTextFile ( TEXT_TWO_TRIANGLES ) );
				const geom = getOnlyGeometry ( scene );
				const { points, prims } = getArrays ( geom );

				expect ( points ).to.deep.equal ( [ ...TRIANGLE_1.points, ...TRIANGLE_2.points ] );
				expect ( prims.first ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 6 );
				expect ( geom.normals ).to.be.null;
			} );

			it ( "Should use flat shading", async function ()
			{
				const scene = await read ( makeTextFile ( TEXT_TWO_TRIANGLES ) );
				expect ( getOnlyGeometry ( scene ).state?.shader ).to.be.instanceOf ( FlatShading );
			} );

			it ( "Should ignore the normals in the file, even ones that are not numbers", async function ()
			{
				const text = [
					"solid test",
					"facet normal x y z",
					"outer loop",
					"vertex 0 0 0",
					"vertex 2 0 0",
					"vertex 0 2 0",
					"endloop",
					"endfacet",
					"endsolid test",
				].join ( "\n" );
				const scene = await read ( makeTextFile ( text ) );
				const geom = getOnlyGeometry ( scene );
				expect ( getArrays ( geom ).points ).to.deep.equal ( [ 0, 0, 0, 2, 0, 0, 0, 2, 0 ] );
				expect ( geom.normals ).to.be.null;
			} );

			it ( "Should read a small file with no triangles", async function ()
			{
				// Smaller than a binary header, so this also tests the detection.
				const scene = await read ( makeTextFile ( "solid empty\nendsolid empty\n" ) );
				const { points, prims } = getArrays ( getOnlyGeometry ( scene ) );
				expect ( points.length ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 0 );
			} );

			it ( "Should reject a small file that is not STL", async function ()
			{
				const error = await getError ( read ( makeTextFile ( "hello" ) ) );
				expect ( error.message ).to.equal ( "Text STL file has no 'solid' keyword" );
			} );

			it ( "Should reject a vertex outside of a facet, with the line number", async function ()
			{
				const text = [
					"solid test",
					"",
					"vertex 0 0 0",
					"endsolid test",
				].join ( "\n" );
				const error = await getError ( read ( makeTextFile ( text ) ) );

				expect ( error ).to.not.be.instanceOf ( Cancelled );
				expect ( error.message ).to.equal ( "Keyword 'vertex' on line 3 not inside a 'facet'" );
			} );

			it ( "Should reject 'outer' without 'loop'", async function ()
			{
				const error = await getError ( read ( makeTextFile ( "solid test\nfacet normal 0 0 1\nouter\n" ) ) );
				expect ( error.message ).to.equal ( "Keyword 'outer' on line 3 not followed by 'loop'" );
			} );

			it ( "Should reject with Cancelled when the progress callback returns false", async function ()
			{
				const error = await getError ( read ( makeTextFile ( TEXT_TWO_TRIANGLES ), () => false ) );
				expect ( error ).to.be.instanceOf ( Cancelled );
			} );

			it ( "Should reject with Cancelled when only the final progress call returns false", async function ()
			{
				// The line reader reports the bytes read, which reaches the total
				// before the final call, so only cancel on the last call.
				let calls = 0;
				const file = makeTextFile ( TEXT_TWO_TRIANGLES );
				await read ( file, () => { ++calls; return true; } );
				let count = 0;
				const error = await getError ( read ( file, () => ( ++count < calls ) ) );
				expect ( error ).to.be.instanceOf ( Cancelled );
			} );

			it ( "Should report progress in bytes that ends with the file size", async function ()
			{
				const file = makeTextFile ( TEXT_TWO_TRIANGLES );
				const calls: number[][] = [];
				await read ( file, ( value, total ) =>
				{
					calls.push ( [ value, total ] );
					return true;
				} );
				expect ( calls[calls.length - 1] ).to.deep.equal ( [ file.size, file.size ] );
			} );
		} );
	} );
};
