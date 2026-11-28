///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test turning triangle strips and fans into lists of triangles.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	fanToTriangles,
	makeVertexSequence,
	stripToTriangles,
	toTriangles,
} from "../../../lib/src/Algorithms/Triangles";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Get which way each triangle faces, in the xy plane: 1 if its corners go
 * counter-clockwise, and -1 if clockwise.
 * @param {number[]} points - Two numbers, x and y, for each vertex.
 * @param {ArrayLike<number>} triangles - Three indices for each triangle.
 * @returns {number[]} The sign of each triangle's area.
 */
const getFacing = ( points: readonly number[], triangles: ArrayLike<number> ) : number[] =>
{
	const answer: number[] = [];
	for ( let i = 0; i < triangles.length; i += 3 )
	{
		const [ a, b, c ] = [ triangles[i], triangles[i + 1], triangles[i + 2] ];
		const abx = points[b * 2] - points[a * 2];
		const aby = points[( b * 2 ) + 1] - points[( a * 2 ) + 1];
		const acx = points[c * 2] - points[a * 2];
		const acy = points[( c * 2 ) + 1] - points[( a * 2 ) + 1];
		answer.push ( Math.sign ( ( abx * acy ) - ( aby * acx ) ) );
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Triangles", function ()
	{
		it ( "Should turn a strip into triangles in glTF's order", function ()
		{
			expect ( Array.from ( stripToTriangles ( [ 0, 1, 2, 3, 4 ] ) ) ).to.deep.equal ( [
				0, 1, 2,
				1, 3, 2,
				2, 3, 4,
			] );
		} );

		it ( "Should turn a fan into triangles in glTF's order", function ()
		{
			expect ( Array.from ( fanToTriangles ( [ 0, 1, 2, 3, 4 ] ) ) ).to.deep.equal ( [
				1, 2, 0,
				2, 3, 0,
				3, 4, 0,
			] );
		} );

		it ( "Should keep every triangle of a strip facing the same way", function ()
		{
			// A strip zig-zagging along x, top then bottom, whose first
			// triangle is counter-clockwise.
			const points = [ 0, 0,   0, 1,   1, 0,   1, 1,   2, 0,   2, 1 ];
			const triangles = stripToTriangles ( [ 1, 0, 3, 2, 5, 4 ] );
			expect ( getFacing ( points, triangles ) ).to.deep.equal ( [ 1, 1, 1, 1 ] );
		} );

		it ( "Should keep every triangle of a fan facing the same way", function ()
		{
			// A fan around the middle, counter-clockwise.
			const points = [ 0, 0,   1, 0,   1, 1,   0, 1,   -1, 1,   -1, 0 ];
			const triangles = fanToTriangles ( [ 0, 1, 2, 3, 4, 5 ] );
			expect ( getFacing ( points, triangles ) ).to.deep.equal ( [ 1, 1, 1, 1 ] );
		} );

		it ( "Should use the indices given, not their positions", function ()
		{
			expect ( Array.from ( stripToTriangles ( [ 7, 3, 9, 5 ] ) ) ).to.deep.equal ( [ 7, 3, 9,   3, 5, 9 ] );
			expect ( Array.from ( fanToTriangles ( [ 7, 3, 9, 5 ] ) ) ).to.deep.equal ( [ 3, 9, 7,   9, 5, 7 ] );
		} );

		it ( "Should leave out triangles with a repeated vertex, which strips use to join pieces", function ()
		{
			// Two strips, 0 1 2 3 and 4 5 6 7, joined by repeating 3 and 4.
			const joined = stripToTriangles ( [ 0, 1, 2, 3, 3, 4, 4, 5, 6, 7 ] );
			expect ( Array.from ( joined ) ).to.deep.equal ( [
				0, 1, 2,
				1, 3, 2,
				4, 5, 6,
				5, 7, 6,
			] );

			// Each of a, b, and c being the repeated one.
			expect ( Array.from ( fanToTriangles ( [ 0, 0, 1 ] ) ) ).to.deep.equal ( [] );
			expect ( Array.from ( fanToTriangles ( [ 0, 1, 1 ] ) ) ).to.deep.equal ( [] );
			expect ( Array.from ( fanToTriangles ( [ 1, 0, 1 ] ) ) ).to.deep.equal ( [] );
		} );

		it ( "Should make no triangles from fewer than three vertices", function ()
		{
			for ( const vertices of [ [], [ 0 ], [ 0, 1 ] ] )
			{
				expect ( stripToTriangles ( vertices ).length ).to.equal ( 0 );
				expect ( fanToTriangles ( vertices ).length ).to.equal ( 0 );
				expect ( toTriangles ( "triangle-list", vertices ).length ).to.equal ( 0 );
			}
		} );

		it ( "Should use 16-bit indices when they fit, and 32-bit when they don't", function ()
		{
			expect ( stripToTriangles ( [ 0, 1, 65535 ] ) ).to.be.instanceOf ( Uint16Array );
			const big = stripToTriangles ( [ 0, 1, 65536 ] );
			expect ( big ).to.be.instanceOf ( Uint32Array );
			expect ( Array.from ( big ) ).to.deep.equal ( [ 0, 1, 65536 ] );
			expect ( fanToTriangles ( new Uint32Array ( [ 70000, 1, 2 ] ) ) ).to.be.instanceOf ( Uint32Array );
		} );

		it ( "Should pick the conversion from the topology", function ()
		{
			const vertices = [ 0, 1, 2, 3 ];
			expect ( toTriangles ( "triangle-strip", vertices ) ).to.deep.equal ( stripToTriangles ( vertices ) );
			expect ( toTriangles ( "triangle-fan", vertices ) ).to.deep.equal ( fanToTriangles ( vertices ) );

			// A list keeps its whole triangles, without the repeated ones.
			expect ( Array.from ( toTriangles ( "triangle-list", [ 0, 1, 2,   3, 3, 4,   5, 6, 7,   8 ] ) ) ).to.deep.equal ( [ 0, 1, 2,   5, 6, 7 ] );

			expect ( () => toTriangles ( "line-list" as "triangle-list", vertices ) ).to.throw ( "Unknown triangle topology 'line-list'" );
		} );

		it ( "Should make a sequence of vertices for those without indices", function ()
		{
			const sequence = makeVertexSequence ( 2, 4 );
			expect ( sequence ).to.be.instanceOf ( Uint16Array );
			expect ( Array.from ( sequence ) ).to.deep.equal ( [ 2, 3, 4, 5 ] );
			expect ( makeVertexSequence ( 0, 65536 ) ).to.be.instanceOf ( Uint16Array );
			expect ( makeVertexSequence ( 1, 65536 ) ).to.be.instanceOf ( Uint32Array );
			expect ( makeVertexSequence ( 0, 0 ).length ).to.equal ( 0 );
			expect ( Array.from ( stripToTriangles ( makeVertexSequence ( 0, 4 ) ) ) ).to.deep.equal ( [ 0, 1, 2,   1, 3, 2 ] );
		} );
	} );
};
