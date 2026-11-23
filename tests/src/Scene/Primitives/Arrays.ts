///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the primitives that have no indices.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { buildTriangleEdges } from "../../../../lib/src/Builders";
import { Arrays, Geometry, Indexed } from "../../../../lib/src/Scene";
import type { Draw as DrawVisitor } from "../../../../lib/src/Visitors/Draw";


///////////////////////////////////////////////////////////////////////////////
//
//	Two triangles that share an edge, with their own copies of the shared
//	points, like the triangles in an STL file.
//
///////////////////////////////////////////////////////////////////////////////

const TWO_TRIANGLES = [
	0, 0, 0,  1, 0, 0,  0, 1, 0,
	1, 0, 0,  1, 1, 0,  0, 1, 0,
];


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the indices that the primitives use.
 * @param {Arrays} prims The primitives.
 * @returns {number[][]} Pairs of the index and its position.
 */
///////////////////////////////////////////////////////////////////////////////

const getIndices = ( prims: Arrays ) : number[][] =>
{
	const answer: number[][] = [];
	prims.forEachIndex ( ( index: number, i: number ) => { answer.push ( [ index, i ] ); } );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Arrays", function ()
	{
		it ( "Should have defaults when made with no input", function ()
		{
			const prims = new Arrays();
			expect ( prims.first ).to.equal ( 0 );
			expect ( prims.count ).to.equal ( 0 );
			expect ( prims.topology ).to.equal ( "point-list" );
			expect ( getIndices ( prims ) ).to.deep.equal ( [] );
		} );

		it ( "Should use the input, with first defaulting to 0", function ()
		{
			const a = new Arrays ( { topology: "triangle-list", count: 6 } );
			expect ( a.topology ).to.equal ( "triangle-list" );
			expect ( a.first ).to.equal ( 0 );
			expect ( a.count ).to.equal ( 6 );

			const b = new Arrays ( { topology: "line-list", first: 4, count: 2 } );
			expect ( b.topology ).to.equal ( "line-list" );
			expect ( b.first ).to.equal ( 4 );
			expect ( b.count ).to.equal ( 2 );
		} );

		it ( "Should change first and count with the setters", function ()
		{
			const prims = new Arrays ( { topology: "triangle-list", count: 3 } );
			prims.first = 3;
			prims.count = 6;
			expect ( prims.first ).to.equal ( 3 );
			expect ( prims.count ).to.equal ( 6 );
			prims.first = 0;
			prims.count = 0;
			expect ( prims.first ).to.equal ( 0 );
			expect ( prims.count ).to.equal ( 0 );
		} );

		it ( "Should reject a first or count that is not an integer >= 0", function ()
		{
			const prims = new Arrays ( { topology: "triangle-list", first: 1, count: 3 } );
			for ( const bad of [ -1, 0.5, NaN, Infinity, -Infinity ] )
			{
				expect ( () => { prims.first = bad; } ).to.throw ( RangeError );
				expect ( () => { prims.count = bad; } ).to.throw ( RangeError );
				expect ( () => new Arrays ( { topology: "triangle-list", first: bad, count: 3 } ) ).to.throw ( RangeError );
				expect ( () => new Arrays ( { topology: "triangle-list", count: bad } ) ).to.throw ( RangeError );
			}

			// A rejected value should not change anything.
			expect ( prims.first ).to.equal ( 1 );
			expect ( prims.count ).to.equal ( 3 );
		} );

		it ( "Should loop through each index from first, in order", function ()
		{
			const prims = new Arrays ( { topology: "triangle-list", first: 2, count: 4 } );
			expect ( getIndices ( prims ) ).to.deep.equal ( [ [ 2, 0 ], [ 3, 1 ], [ 4, 2 ], [ 5, 3 ] ] );
		} );

		it ( "Should include first and count in its JSON", function ()
		{
			const prims = new Arrays ( { topology: "triangle-list", first: 3, count: 6 } );
			const json = prims.toJSON() as Record < string, unknown >;
			expect ( json.type ).to.equal ( "Scene.Primitives.Arrays" );
			expect ( json.topology ).to.equal ( "triangle-list" );
			expect ( json.first ).to.equal ( 3 );
			expect ( json.count ).to.equal ( 6 );
		} );

		it ( "Should ask the draw visitor to draw arrays", function ()
		{
			const prims = new Arrays ( { topology: "triangle-list", count: 3 } );
			const visited: Arrays[] = [];
			const visitor = {
				visitArrays: ( p: Arrays ) => { visited.push ( p ); },
				visitIndexed: () => { throw new Error ( "Should not visit indexed primitives" ); },
			};
			prims.accept ( visitor as unknown as DrawVisitor );
			expect ( visited ).to.deep.equal ( [ prims ] );
		} );

		it ( "Should give a geometry bounds from only the points it uses", function ()
		{
			// The first triangle is far away, and is skipped.
			const points = [ 100, 100, 100, 101, 100, 100, 100, 101, 100, ...TWO_TRIANGLES ];
			const primitives = new Arrays ( { topology: "triangle-list", first: 3, count: 6 } );
			const geom = new Geometry ( { points, primitives } );
			const box = geom.box;
			expect ( box.valid ).to.be.true;
			expect ( Array.from ( box.min ) ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( Array.from ( box.max ) ).to.deep.equal ( [ 1, 1, 0 ] );
		} );

		it ( "Should build the triangle edges, the same as with indices", function ()
		{
			const points = TWO_TRIANGLES;

			const withArrays = buildTriangleEdges ( new Geometry ( { points,
				primitives: new Arrays ( { topology: "triangle-list", count: 6 } ) } ) );
			const withIndices = buildTriangleEdges ( new Geometry ( { points,
				primitives: new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2, 3, 4, 5 ] } ) } ) );

			expect ( withArrays ).to.not.be.null;
			expect ( withIndices ).to.not.be.null;

			const lines = withArrays!.primitives![0] as Indexed;
			expect ( lines.topology ).to.equal ( "line-list" );

			// The shared edge is only made once, so there are 5 edges.
			const indices = Array.from ( lines.indices!.values! );
			expect ( indices.length ).to.equal ( 10 );
			expect ( indices ).to.deep.equal ( Array.from ( ( withIndices!.primitives![0] as Indexed ).indices!.values! ) );
		} );

		it ( "Should build the triangle edges of only the triangles it uses", function ()
		{
			const primitives = new Arrays ( { topology: "triangle-list", first: 3, count: 3 } );
			const edges = buildTriangleEdges ( new Geometry ( { points: TWO_TRIANGLES, primitives } ) );
			const indices = Array.from ( ( edges!.primitives![0] as Indexed ).indices!.values! );
			expect ( indices.length ).to.equal ( 6 );
			expect ( Math.min ( ...indices ) ).to.equal ( 3 );
			expect ( Math.max ( ...indices ) ).to.equal ( 5 );
		} );

		it ( "Should not build triangle edges when the topology is not a triangle-list", function ()
		{
			const primitives = new Arrays ( { topology: "line-list", count: 6 } );
			expect ( buildTriangleEdges ( new Geometry ( { points: TWO_TRIANGLES, primitives } ) ) ).to.be.null;
		} );
	} );
}
