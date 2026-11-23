///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test splitting the glTF node transforms.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	determinant33,
	flipTriangles,
	type IMatrix33,
	multiply33,
	rotationFromMatrix,
	rotationFromQuaternion,
	splitNodeTransform,
	transformNormals,
	transformPoints,
} from "../../../../lib/src/IO/Readers/GLTF/Transforms";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Expect the numbers to be close.
 * @param {ArrayLike<number>} actual The numbers.
 * @param {number[]} expected The numbers they should be.
 */
const expectClose = ( actual: ArrayLike<number>, expected: number[] ) : void =>
{
	expect ( actual.length ).to.equal ( expected.length );
	for ( let i = 0; i < expected.length; ++i )
	{
		expect ( actual[i] ).to.be.closeTo ( expected[i], 1e-6 );
	}
};

// A quarter turn around z, so x goes to y.
const S = Math.SQRT1_2;
const QUARTER_TURN_Z = [ 0, 0, S, S ];
const QUARTER_TURN_Z_33: IMatrix33 = [ 0, 1, 0,   -1, 0, 0,   0, 0, 1 ];


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Transforms", function ()
	{
		describe ( "Matrices", function ()
		{
			it ( "Should multiply and get the determinant", function ()
			{
				const scale: IMatrix33 = [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ];
				expectClose ( multiply33 ( QUARTER_TURN_Z_33, scale ), [ 0, 2, 0,   -3, 0, 0,   0, 0, 4 ] );
				expect ( determinant33 ( scale ) ).to.equal ( 24 );
				expect ( determinant33 ( [ -1, 0, 0,   0, 1, 0,   0, 0, 1 ] ) ).to.equal ( -1 );
			} );

			it ( "Should make a rotation from a quaternion, even one that is not unit length", function ()
			{
				expectClose ( rotationFromQuaternion ( QUARTER_TURN_Z ), QUARTER_TURN_Z_33 );
				expectClose ( rotationFromQuaternion ( [ 0, 0, 2, 2 ] ), QUARTER_TURN_Z_33 );
				expectClose ( rotationFromQuaternion ( [ 0, 0, 0, 0 ] ), [ 1, 0, 0,   0, 1, 0,   0, 0, 1 ] );
			} );

			it ( "Should get the rotation of a matrix that scales", function ()
			{
				const m = multiply33 ( QUARTER_TURN_Z_33, [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
				expectClose ( rotationFromMatrix ( m ), QUARTER_TURN_Z_33 );
			} );

			it ( "Should leave the mirror out of the rotation", function ()
			{
				const r = rotationFromMatrix ( [ -2, 0, 0,   0, 1, 0,   0, 0, 1 ] );
				expect ( determinant33 ( r ) ).to.be.closeTo ( 1, 1e-6 );
			} );

			it ( "Should use the identity for a matrix that flattens space", function ()
			{
				expectClose ( rotationFromMatrix ( [ 1, 0, 0,   0, 0, 0,   0, 0, 1 ] ), [ 1, 0, 0,   0, 1, 0,   0, 0, 1 ] );
			} );
		} );

		describe ( "Splitting a node", function ()
		{
			it ( "Should keep a translation", function ()
			{
				const { matrix, leftover } = splitNodeTransform ( { translation: [ 1, 2, 3 ] }, 0, null );
				expect ( matrix ).to.deep.equal ( [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   1, 2, 3, 1 ] );
				expect ( leftover ).to.be.null;
			} );

			it ( "Should keep the rotation and translation, and leave the scale", function ()
			{
				const node = { translation: [ 1, 2, 3 ], rotation: QUARTER_TURN_Z, scale: [ 2, 3, 4 ] };
				const { matrix, leftover } = splitNodeTransform ( node, 0, null );
				expectClose ( matrix!, [ 0, 1, 0, 0,   -1, 0, 0, 0,   0, 0, 1, 0,   1, 2, 3, 1 ] );
				expectClose ( leftover!, [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
			} );

			it ( "Should do the same with a matrix", function ()
			{
				// The same as above, written as a matrix.
				const node = { matrix: [ 0, 2, 0, 0,   -3, 0, 0, 0,   0, 0, 4, 0,   1, 2, 3, 1 ] };
				const { matrix, leftover } = splitNodeTransform ( node, 0, null );
				expectClose ( matrix!, [ 0, 1, 0, 0,   -1, 0, 0, 0,   0, 0, 1, 0,   1, 2, 3, 1 ] );
				expectClose ( leftover!, [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
			} );

			it ( "Should not make a transform for only a scale", function ()
			{
				const { matrix, leftover } = splitNodeTransform ( { scale: [ 2, 3, 4 ] }, 0, null );
				expect ( matrix ).to.be.null;
				expect ( leftover ).to.deep.equal ( [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
			} );

			it ( "Should not make a transform that does nothing", function ()
			{
				for ( const node of [
					{},
					{ translation: [ 0, 0, 0 ], scale: [ 1, 1, 1 ] },
					{ rotation: [ 0, 0, 0, 1 ] },
					{ matrix: [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   0, 0, 0, 1 ] },
				] )
				{
					const { matrix, leftover } = splitNodeTransform ( node, 0, null );
					expect ( matrix ).to.be.null;
					expect ( leftover ).to.be.null;
				}
			} );

			it ( "Should scale the translation by the leftover from above", function ()
			{
				const { matrix, leftover } = splitNodeTransform ( { translation: [ 1, 1, 1 ] }, 0, [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
				expect ( matrix!.slice ( 12, 15 ) ).to.deep.equal ( [ 2, 3, 4 ] );
				expect ( leftover ).to.deep.equal ( [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
			} );

			it ( "Should turn the leftover from above with the node's rotation", function ()
			{
				// The parent stretches x. The child turns x to y, so in the child,
				// it's y that gets stretched.
				const { leftover } = splitNodeTransform ( { rotation: QUARTER_TURN_Z }, 0, [ 2, 0, 0,   0, 1, 0,   0, 0, 1 ] );
				expectClose ( leftover!, [ 1, 0, 0,   0, 2, 0,   0, 0, 1 ] );
			} );

			it ( "Should reject arrays of the wrong size", function ()
			{
				expect ( () => splitNodeTransform ( { matrix: [ 1, 2, 3 ] }, 4, null ) ).to.throw ( "Node 4 has a matrix with 3 numbers instead of 16" );
				expect ( () => splitNodeTransform ( { rotation: [ 0, 0, 1 ] }, 4, null ) ).to.throw ( "rotation with 3 numbers instead of 4" );
			} );
		} );

		describe ( "Changing the arrays", function ()
		{
			it ( "Should multiply the points", function ()
			{
				const points = transformPoints ( new Float32Array ( [ 1, 2, 3,   4, 5, 6 ] ), [ 2, 0, 0,   0, 3, 0,   0, 0, 4 ] );
				expect ( Array.from ( points ) ).to.deep.equal ( [ 2, 6, 12,   8, 15, 24 ] );
			} );

			it ( "Should keep the normals at right angles to the surface", function ()
			{
				// A matrix that stretches, turns, and shears.
				const m: IMatrix33 = [ 2, 0.5, 0,   0.3, 1, 0.2,   0, -0.4, 3 ];

				// A surface with these two directions in it, and its normal.
				const a = [ 1, 1, 0 ];
				const b = [ 0, 1, 1 ];
				const n = [ ( a[1] * b[2] ) - ( a[2] * b[1] ), ( a[2] * b[0] ) - ( a[0] * b[2] ), ( a[0] * b[1] ) - ( a[1] * b[0] ) ];

				const [ ta, tb ] = [ a, b ].map ( ( v ) => transformPoints ( new Float32Array ( v ), m ) );
				const tn = transformNormals ( new Float32Array ( n ), m );
				const dot = ( u: ArrayLike<number>, v: ArrayLike<number> ) => ( ( u[0] * v[0] ) + ( u[1] * v[1] ) + ( u[2] * v[2] ) );
				expect ( dot ( tn, ta ) ).to.be.closeTo ( 0, 1e-6 );
				expect ( dot ( tn, tb ) ).to.be.closeTo ( 0, 1e-6 );
				expect ( Math.sqrt ( dot ( tn, tn ) ) ).to.be.closeTo ( 1, 1e-6 );

				// It still points to the same side.
				const tc = [ ( ta[1] * tb[2] ) - ( ta[2] * tb[1] ), ( ta[2] * tb[0] ) - ( ta[0] * tb[2] ), ( ta[0] * tb[1] ) - ( ta[1] * tb[0] ) ];
				expect ( dot ( tn, tc ) ).to.be.greaterThan ( 0 );
			} );

			it ( "Should mirror the normals with the points", function ()
			{
				const normals = transformNormals ( new Float32Array ( [ 1, 0, 0,   0, 1, 0 ] ), [ -2, 0, 0,   0, 1, 0,   0, 0, 1 ] );
				expectClose ( normals, [ -1, 0, 0,   0, 1, 0 ] );
			} );

			it ( "Should turn the triangles around", function ()
			{
				const flipped = flipTriangles ( new Uint16Array ( [ 0, 1, 2,   3, 4, 5 ] ) );
				expect ( flipped ).to.be.instanceOf ( Uint16Array );
				expect ( Array.from ( flipped ) ).to.deep.equal ( [ 0, 2, 1,   3, 5, 4 ] );
			} );
		} );
	} );
};
