///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the parts of reading a PLY file that do not depend on its
//	format.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { PhongShading } from "../../../../lib/src/Shaders/PhongShading";
import { ColorAttribute, Geometry, Group, Indexed } from "../../../../lib/src/Scene";
import { getLayout, MeshBuilder, PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY } from "../../../../lib/src/IO/Readers/PLY/Common";
import { parseHeader, type IPlyHeader } from "../../../../lib/src/IO/Readers/PLY/Header";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Parse a header with the given lines between the format and "end_header".
 * @param {string[]} lines The lines.
 * @returns {IPlyHeader} The header.
 */
const makeHeader = ( lines: string[] ) : IPlyHeader =>
{
	const text = [ "ply", "format ascii 1.0", ...lines, "end_header", "" ].join ( "\n" );
	return parseHeader ( new TextEncoder().encode ( text ) )!;
};

// The usual faces.
const FACES = [ "element face 1", "property list uchar int vertex_indices" ];

/**
 * Get the message of the error thrown when getting the layout.
 * @param {string[]} lines The lines of the header.
 * @returns {string} The error message.
 */
const getLayoutError = ( lines: string[] ) : string =>
{
	const header = makeHeader ( lines );
	try
	{
		getLayout ( header );
	}
	catch ( error )
	{
		return ( error as Error ).message;
	}
	throw new Error ( "Getting the layout did not throw" );
};

/**
 * Make a builder for the points, which are given as [ x0, y0, z0, ... ].
 * @param {number[]} points The points.
 * @param {object} [options] The options.
 * @param {number[]} [options.normals] The normals.
 * @param {number} [options.maxVertices] The most vertices in one geometry.
 * @returns {MeshBuilder} The builder.
 */
const makeBuilder = ( points: number[], options?: { normals?: number[], maxVertices?: number } ) : MeshBuilder =>
{
	const { normals, maxVertices } = ( options ?? {} );
	const builder = new MeshBuilder ( {
		numVertices: points.length / 3,
		hasNormals: !!normals,
		color: [ 0.1, 0.2, 0.3, 1 ],
		maxVertices,
	} );
	builder.points.set ( points );
	if ( normals )
	{
		builder.normals!.set ( normals );
	}
	return builder;
};

/**
 * Get the geometries in the group.
 * @param {Group} group The group.
 * @returns {Geometry[]} The geometries.
 */
const getGeometries = ( group: Group ) : Geometry[] =>
{
	const answer: Geometry[] = [];
	group.forEachChild ( ( child ) =>
	{
		expect ( child ).to.be.instanceOf ( Geometry );
		answer.push ( child as Geometry );
	} );
	return answer;
};

/**
 * Get the arrays of the geometry as plain arrays.
 * @param {Geometry} geom The geometry.
 * @returns {{ points: number[], normals: number[] | null, indices: number[] }} The arrays.
 */
const getArrays = ( geom: Geometry ) : { points: number[], normals: ( number[] | null ), indices: number[] } =>
{
	const prims = geom.primitives;
	expect ( prims?.length ).to.equal ( 1 );
	expect ( prims![0] ).to.be.instanceOf ( Indexed );
	const indexed = prims![0] as Indexed;
	expect ( indexed.topology ).to.equal ( "triangle-list" );
	const normals = geom.normals?.values;
	return {
		points: Array.from ( geom.points!.values! ),
		normals: ( normals ? Array.from ( normals ) : null ),
		indices: Array.from ( indexed.indices!.values! ),
	};
};

/**
 * Get the message of the error thrown by the function.
 * @param {Function} fun The function.
 * @returns {string} The error message.
 */
const getError = ( fun: () => void ) : string =>
{
	try
	{
		fun();
	}
	catch ( error )
	{
		return ( error as Error ).message;
	}
	throw new Error ( "The function did not throw" );
};

// Six points that make a strip of four triangles:
//
//	3---4---5
//	| \ | \ |
//	0---1---2
//
const STRIP = [
	0, 0, 0,  1, 0, 0,  2, 0, 0,
	0, 1, 0,  1, 1, 0,  2, 1, 0,
];
const STRIP_FACES = [ [ 0, 1, 3 ], [ 1, 4, 3 ], [ 1, 2, 4 ], [ 2, 5, 4 ] ];


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Common", function ()
	{
		describe ( "Layout", function ()
		{
			it ( "Should find the points and faces", function ()
			{
				const header = makeHeader ( [ "element vertex 3", "property float x", "property float y", "property float z", ...FACES ] );
				const layout = getLayout ( header );
				expect ( layout.vertex ).to.equal ( header.elements[0] );
				expect ( layout.face ).to.equal ( header.elements[1] );
				expect ( [ layout.x, layout.y, layout.z ] ).to.deep.equal ( [ 0, 1, 2 ] );
				expect ( layout.normal ).to.be.null;
				expect ( layout.faceIndices ).to.equal ( 0 );
			} );

			it ( "Should find the properties wherever they are", function ()
			{
				const header = makeHeader ( [
					"element vertex 3",
					"property float confidence",
					"property float z",
					"property float nz",
					"property float x",
					"property float ny",
					"property float y",
					"property float nx",
					"element edge 0",
					"property int vertex1",
					"element face 1",
					"property uchar flags",
					"property list uchar uint vertex_index",
				] );
				const layout = getLayout ( header );
				expect ( [ layout.x, layout.y, layout.z ] ).to.deep.equal ( [ 3, 5, 1 ] );
				expect ( layout.normal ).to.deep.equal ( [ 6, 4, 2 ] );
				expect ( layout.faceIndices ).to.equal ( 1 );
			} );

			it ( "Should not use the normals unless all three are there", function ()
			{
				const header = makeHeader ( [ "element vertex 3", "property float x", "property float y", "property float z",
					"property float nx", "property float ny", ...FACES ] );
				expect ( getLayout ( header ).normal ).to.be.null;
			} );

			it ( "Should reject a file without what it needs", function ()
			{
				const xyz = [ "property float x", "property float y", "property float z" ];
				expect ( getLayoutError ( FACES ) ).to.equal ( "The PLY file has no 'vertex' element" );
				expect ( getLayoutError ( [ "element vertex 1", "property float x", "property float z", ...FACES ] ) ).to.equal (
					"The PLY vertices have no 'y' property" );
				expect ( getLayoutError ( [ "element vertex 1", "property list uchar float x", "property float y", "property float z", ...FACES ] ) ).to.equal (
					"PLY property 'x' of element 'vertex' should be a number, not a list" );
				expect ( getLayoutError ( [ "element vertex 1", ...xyz, "property list uchar float nx", ...FACES ] ) ).to.equal (
					"PLY property 'nx' of element 'vertex' should be a number, not a list" );
				expect ( getLayoutError ( [ "element vertex 1", ...xyz ] ) ).to.include ( "has no 'face' element" );
				expect ( getLayoutError ( [ ...FACES, "element vertex 1", ...xyz ] ) ).to.equal (
					"The PLY faces come before the vertices, which is not supported" );
				expect ( getLayoutError ( [ "element vertex 1", ...xyz, "element face 1", "property list uchar int corners" ] ) ).to.equal (
					"The PLY faces have no 'vertex_indices' property" );
				expect ( getLayoutError ( [ "element vertex 1", ...xyz, "element face 1", "property int vertex_indices" ] ) ).to.equal (
					"PLY property 'vertex_indices' of element 'face' should be a list" );
				expect ( getLayoutError ( [ "element vertex 1", ...xyz, "element face 1", "property list uchar float vertex_indices" ] ) ).to.equal (
					"PLY property 'vertex_indices' of element 'face' should be a list of integers" );
			} );
		} );

		describe ( "Builder", function ()
		{
			it ( "Should make one geometry for a few triangles", function ()
			{
				const builder = makeBuilder ( STRIP );
				STRIP_FACES.forEach ( ( face ) => builder.addFace ( face ) );
				const geometries = getGeometries ( builder.finish() );
				expect ( geometries.length ).to.equal ( 1 );

				// The vertices are in the order they are first used.
				const { points, normals, indices } = getArrays ( geometries[0] );
				expect ( points ).to.deep.equal ( [ 0, 0, 0,  1, 0, 0,  0, 1, 0,  1, 1, 0,  2, 0, 0,  2, 1, 0 ] );
				expect ( indices ).to.deep.equal ( [ 0, 1, 2,  1, 3, 2,  1, 4, 3,  4, 5, 3 ] );
				expect ( normals ).to.be.null;
			} );

			it ( "Should use 16-bit indices, and the size that is used", function ()
			{
				const builder = makeBuilder ( STRIP );
				builder.addFace ( [ 0, 1, 3 ] );
				const geom = getGeometries ( builder.finish() )[0];
				const indices = ( geom.primitives![0] as Indexed ).indices!.values!;
				expect ( indices ).to.be.instanceOf ( Uint16Array );
				expect ( indices.length ).to.equal ( 3 );
				expect ( geom.points!.values!.length ).to.equal ( 9 );
			} );

			it ( "Should use 32-bit indices when a geometry can have more vertices", function ()
			{
				const numVertices = PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY + 10;
				const builder = new MeshBuilder ( { numVertices, hasNormals: false, maxVertices: numVertices } );
				builder.addTriangle ( 0, 1, numVertices - 1 );
				const geom = getGeometries ( builder.finish() )[0];
				expect ( ( geom.primitives![0] as Indexed ).indices!.values ).to.be.instanceOf ( Uint32Array );
			} );

			it ( "Should use flat shading without normals, and smooth shading with them", function ()
			{
				const flat = makeBuilder ( STRIP );
				flat.addFace ( [ 0, 1, 3 ] );
				expect ( getGeometries ( flat.finish() )[0].state?.shader ).to.be.instanceOf ( FlatShading );

				const normals = STRIP.map ( ( _, i ) => ( i % 3 ) ); // Not real normals, but easy to check.
				const smooth = makeBuilder ( STRIP, { normals } );
				smooth.addFace ( [ 5, 2, 4 ] );
				const geom = getGeometries ( smooth.finish() )[0];
				expect ( geom.state?.shader ).to.be.instanceOf ( PhongShading );
				expect ( getArrays ( geom ).normals ).to.deep.equal ( [ 0, 1, 2,  0, 1, 2,  0, 1, 2 ] );
			} );

			it ( "Should copy the points and normals that each geometry uses", function ()
			{
				const normals = [ ...Array ( 18 ).keys() ].map ( ( i ) => ( i * 10 ) );
				const builder = makeBuilder ( STRIP, { normals } );
				builder.addFace ( [ 5, 2, 4 ] );
				const { points, normals: n } = getArrays ( getGeometries ( builder.finish() )[0] );
				expect ( points ).to.deep.equal ( [ 2, 1, 0,  2, 0, 0,  1, 1, 0 ] );
				expect ( n ).to.deep.equal ( [ 150, 160, 170,  60, 70, 80,  120, 130, 140 ] );
			} );

			it ( "Should split faces with more than three vertices into triangles", function ()
			{
				const builder = makeBuilder ( STRIP );
				builder.addFace ( [ 0, 1, 2, 5, 4, 3 ] );
				const { indices } = getArrays ( getGeometries ( builder.finish() )[0] );
				expect ( indices ).to.deep.equal ( [ 0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 5 ] );
			} );

			it ( "Should use only the given count of indices", function ()
			{
				const builder = makeBuilder ( STRIP );
				builder.addFace ( new Uint32Array ( [ 0, 1, 3, 4, 99, 99 ] ), 4 );
				const { indices } = getArrays ( getGeometries ( builder.finish() )[0] );
				expect ( indices ).to.deep.equal ( [ 0, 1, 2,  0, 2, 3 ] );
			} );

			it ( "Should ignore faces with fewer than three vertices", function ()
			{
				const builder = makeBuilder ( STRIP );
				builder.addFace ( [] );
				builder.addFace ( [ 0 ] );
				builder.addFace ( [ 0, 1 ] );
				builder.addFace ( [ 0, 1, 3 ], 2 );
				expect ( getGeometries ( builder.finish() ) ).to.deep.equal ( [] );
			} );

			it ( "Should make an empty group when there are no faces", function ()
			{
				const builder = new MeshBuilder ( { numVertices: 0, hasNormals: false } );
				const scene = builder.finish();
				expect ( scene ).to.be.instanceOf ( Group );
				expect ( getGeometries ( scene ) ).to.deep.equal ( [] );
			} );

			it ( "Should split into geometries with at most the most vertices", function ()
			{
				const builder = makeBuilder ( STRIP, { maxVertices: 4 } );
				STRIP_FACES.forEach ( ( face ) => builder.addFace ( face ) );
				const geometries = getGeometries ( builder.finish() );
				expect ( geometries.length ).to.equal ( 2 );

				// The first two triangles use 4 vertices.
				const first = getArrays ( geometries[0] );
				expect ( first.points ).to.deep.equal ( [ 0, 0, 0,  1, 0, 0,  0, 1, 0,  1, 1, 0 ] );
				expect ( first.indices ).to.deep.equal ( [ 0, 1, 2,  1, 3, 2 ] );

				// The next two have their own copies of vertices 1 and 4.
				const second = getArrays ( geometries[1] );
				expect ( second.points ).to.deep.equal ( [ 1, 0, 0,  2, 0, 0,  1, 1, 0,  2, 1, 0 ] );
				expect ( second.indices ).to.deep.equal ( [ 0, 1, 2,  1, 3, 2 ] );
			} );

			it ( "Should draw the same triangles however they are split", function ()
			{
				// Make a grid of triangles, then add them in a shuffled order.
				const n = 10;
				const points: number[] = [];
				for ( let j = 0; j <= n; ++j )
				{
					for ( let i = 0; i <= n; ++i )
					{
						points.push ( i, j, ( i * j ) );
					}
				}
				const faces: number[][] = [];
				for ( let j = 0; j < n; ++j )
				{
					for ( let i = 0; i < n; ++i )
					{
						const a = ( j * ( n + 1 ) ) + i;
						faces.push ( [ a, a + 1, a + n + 2 ], [ a, a + n + 2, a + n + 1 ] );
					}
				}
				let seed = 12345;
				const random = () => ( ( seed = ( ( seed * 1103515245 ) + 12345 ) % 2147483648 ) / 2147483648 );
				for ( let i = faces.length - 1; i > 0; --i )
				{
					const j = Math.floor ( random() * ( i + 1 ) );
					[ faces[i], faces[j] ] = [ faces[j], faces[i] ];
				}

				// The triangles as their corner points, so they can be compared.
				const expected = faces.map ( ( face ) => face.map ( ( v ) => points.slice ( v * 3, v * 3 + 3 ) ).flat() );

				for ( const maxVertices of [ 3, 4, 5, 7, 16, 50, 1000 ] )
				{
					const builder = makeBuilder ( points, { maxVertices } );
					faces.forEach ( ( face ) => builder.addFace ( face ) );
					const actual: number[][] = [];
					for ( const geom of getGeometries ( builder.finish() ) )
					{
						const { points: p, indices } = getArrays ( geom );
						expect ( p.length / 3 ).to.be.at.most ( maxVertices );
						for ( let i = 0; i < indices.length; i += 3 )
						{
							actual.push ( indices.slice ( i, i + 3 ).map ( ( v ) => p.slice ( v * 3, v * 3 + 3 ) ).flat() );
						}
					}
					expect ( actual ).to.deep.equal ( expected );
				}
			} );

			it ( "Should split when a geometry has the most triangles", function ()
			{
				// With 3 vertices there is room for 12 triangles.
				const builder = makeBuilder ( STRIP, { maxVertices: 3 } );
				for ( let i = 0; i < 13; ++i )
				{
					builder.addTriangle ( 0, 1, 3 );
				}
				const geometries = getGeometries ( builder.finish() );
				expect ( geometries.map ( ( g ) => getArrays ( g ).indices.length ) ).to.deep.equal ( [ 36, 3 ] );
				expect ( getArrays ( geometries[1] ).points ).to.deep.equal ( [ 0, 0, 0,  1, 0, 0,  0, 1, 0 ] );
			} );

			it ( "Should count a vertex used twice in a triangle once", function ()
			{
				const builder = makeBuilder ( STRIP, { maxVertices: 3 } );
				builder.addTriangle ( 0, 1, 1 );
				builder.addTriangle ( 2, 2, 2 );
				builder.addTriangle ( 0, 2, 0 );
				const geometries = getGeometries ( builder.finish() );
				expect ( geometries.length ).to.equal ( 1 );
				expect ( getArrays ( geometries[0] ).indices ).to.deep.equal ( [ 0, 1, 1,  2, 2, 2,  0, 2, 0 ] );
			} );

			it ( "Should share one state with the color", function ()
			{
				const builder = makeBuilder ( STRIP, { maxVertices: 4 } );
				STRIP_FACES.forEach ( ( face ) => builder.addFace ( face ) );
				const [ a, b ] = getGeometries ( builder.finish() );
				expect ( a.state ).to.equal ( b.state );
				const color = Array.from ( a.state!.attributes.values() ).find (
					( attr ) : attr is ColorAttribute => ( attr instanceof ColorAttribute ) );
				const actual = Array.from ( color!.color );
				[ 0.1, 0.2, 0.3, 1 ].forEach ( ( value, i ) => expect ( actual[i] ).to.be.closeTo ( value, 1e-6 ) );
			} );

			it ( "Should have the bounds of all the points used", function ()
			{
				const builder = makeBuilder ( STRIP );
				builder.addFace ( [ 0, 1, 4 ] );
				const scene = builder.finish();
				const box = getGeometries ( scene )[0].box;
				expect ( Array.from ( box.min ) ).to.deep.equal ( [ 0, 0, 0 ] );
				expect ( Array.from ( box.max ) ).to.deep.equal ( [ 1, 1, 0 ] );
				expect ( scene.bounds.valid ).to.be.true;
			} );

			it ( "Should reject an index that is not a vertex", function ()
			{
				const builder = makeBuilder ( STRIP );
				for ( const bad of [ -1, 6, 1.5, NaN, Infinity ] )
				{
					expect ( getError ( () => builder.addTriangle ( 0, 1, bad ) ) ).to.equal (
						`PLY face has vertex index ${bad}, but there are 6 vertices` );
					expect ( getError ( () => builder.addFace ( [ bad, 0, 1 ] ) ) ).to.include ( `index ${bad}` );
				}

				// Nothing should have been added.
				expect ( getGeometries ( builder.finish() ) ).to.deep.equal ( [] );
			} );

			it ( "Should reject bad input", function ()
			{
				for ( const bad of [ -1, 1.5, NaN ] )
				{
					expect ( getError ( () => new MeshBuilder ( { numVertices: bad, hasNormals: false } ) ) ).to.equal (
						`Invalid number of vertices: ${bad}` );
				}
				for ( const bad of [ 2, 0, -1, 3.5, NaN, Infinity ] )
				{
					expect ( getError ( () => new MeshBuilder ( { numVertices: 3, hasNormals: false, maxVertices: bad } ) ) ).to.equal (
						`The most vertices in one geometry has to be an integer of at least 3, not ${bad}` );
				}
			} );
		} );

		describe ( "Setting", function ()
		{
			// Put the setting back after each test.
			let saved = 0;
			beforeEach ( function ()
			{
				saved = MeshBuilder.maxVerticesPerGeometry;
			} );
			afterEach ( function ()
			{
				MeshBuilder.maxVerticesPerGeometry = saved;
			} );

			it ( "Should default to the most that can use 16-bit indices", function ()
			{
				expect ( PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY ).to.equal ( 65536 );
				expect ( MeshBuilder.maxVerticesPerGeometry ).to.equal ( PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY );
			} );

			it ( "Should be used by the builders made after it changes", function ()
			{
				const before = makeBuilder ( STRIP );
				MeshBuilder.maxVerticesPerGeometry = 4;
				expect ( MeshBuilder.maxVerticesPerGeometry ).to.equal ( 4 );
				const after = makeBuilder ( STRIP );
				for ( const builder of [ before, after ] )
				{
					STRIP_FACES.forEach ( ( face ) => builder.addFace ( face ) );
				}
				expect ( getGeometries ( before.finish() ).length ).to.equal ( 1 );
				expect ( getGeometries ( after.finish() ).length ).to.equal ( 2 );
			} );

			it ( "Should be overridden by the builder's input", function ()
			{
				MeshBuilder.maxVerticesPerGeometry = 3;
				const builder = makeBuilder ( STRIP, { maxVertices: 100 } );
				STRIP_FACES.forEach ( ( face ) => builder.addFace ( face ) );
				expect ( getGeometries ( builder.finish() ).length ).to.equal ( 1 );
			} );

			it ( "Should use 32-bit indices when it is more than 65536", function ()
			{
				const numVertices = 70000;
				MeshBuilder.maxVerticesPerGeometry = 65537;
				const big = new MeshBuilder ( { numVertices, hasNormals: false } );
				big.addTriangle ( 0, 1, 2 );
				expect ( ( getGeometries ( big.finish() )[0].primitives![0] as Indexed ).indices!.values ).to.be.instanceOf ( Uint32Array );

				MeshBuilder.maxVerticesPerGeometry = 65536;
				const small = new MeshBuilder ( { numVertices, hasNormals: false } );
				small.addTriangle ( 0, 1, 2 );
				expect ( ( getGeometries ( small.finish() )[0].primitives![0] as Indexed ).indices!.values ).to.be.instanceOf ( Uint16Array );
			} );

			it ( "Should reject a value that is not an integer of at least 3", function ()
			{
				MeshBuilder.maxVerticesPerGeometry = 1000;
				for ( const bad of [ 2, 0, -1, 3.5, NaN, Infinity ] )
				{
					expect ( getError ( () => { MeshBuilder.maxVerticesPerGeometry = bad; } ) ).to.equal (
						`The most vertices in one geometry has to be an integer of at least 3, not ${bad}` );
				}
				expect ( MeshBuilder.maxVerticesPerGeometry ).to.equal ( 1000 );
			} );
		} );
	} );
}
