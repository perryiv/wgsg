///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the frustum classes.
//
///////////////////////////////////////////////////////////////////////////////

import { Box } from "../../../lib/src/Math/Box";
import { expect } from "chai";
import { expectClose, TOLERANCE } from "./Plane";
import { Frustum } from "../../../lib/src/Math/Frustum";
import { mat4 } from "gl-matrix";
import { Plane } from "../../../lib/src/Math/Plane";
import { Sphere } from "../../../lib/src/Math/Sphere";
import { ViewFrustum } from "../../../lib/src/Math/ViewFrustum";
import type { IMatrix44, IVector3 } from "../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Make a frustum that is the box from -1 to 1 in x, y, and z.
 * @returns {Frustum} The frustum.
 */
const makeCube = () : Frustum =>
{
	return new Frustum ( [
		new Plane ( { point: [ -1, 0, 0 ], normal: [ 1, 0, 0 ] } ),
		new Plane ( { point: [ 1, 0, 0 ], normal: [ -1, 0, 0 ] } ),
		new Plane ( { point: [ 0, -1, 0 ], normal: [ 0, 1, 0 ] } ),
		new Plane ( { point: [ 0, 1, 0 ], normal: [ 0, -1, 0 ] } ),
		new Plane ( { point: [ 0, 0, -1 ], normal: [ 0, 0, 1 ] } ),
		new Plane ( { point: [ 0, 0, 1 ], normal: [ 0, 0, -1 ] } ),
	] );
};

/**
 * Make a frustum that is an endless prism along z, with a regular polygon
 * of the given number of sides around the z axis, each side 1 from it.
 * @param {number} sides - The number of sides.
 * @returns {Frustum} The frustum.
 */
const makePrism = ( sides: number ) : Frustum =>
{
	const planes: Plane[] = [];
	for ( let i = 0; i < sides; ++i )
	{
		const angle = ( ( i / sides ) * Math.PI * 2 );
		const out: IVector3 = [ Math.cos ( angle ), Math.sin ( angle ), 0 ];
		planes.push ( new Plane ( { point: out, normal: [ -out[0], -out[1], 0 ] } ) );
	}
	return new Frustum ( planes );
};

/**
 * Make a box.
 * @param {IVector3} min - The smallest corner.
 * @param {IVector3} max - The largest corner.
 * @returns {Box} The box.
 */
const box = ( min: IVector3, max: IVector3 ) : Box =>
{
	return new Box ( { min, max } );
};

/**
 * Make a matrix that moves.
 * @param {IVector3} move - How far to move.
 * @returns {IMatrix44} The matrix.
 */
const translate = ( move: IVector3 ) : IMatrix44 =>
{
	return Array.from ( mat4.fromTranslation ( mat4.create(), move ) ) as IMatrix44;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Frustum", function ()
	{
		it ( "Should have the planes it was given, as copies", function ()
		{
			const plane = new Plane ( { coefficients: [ 1, 0, 0, 1 ] } );
			const frustum = new Frustum ( [ plane ] );
			expect ( frustum.numPlanes ).to.equal ( 1 );
			plane.point = [ 5, 0, 0 ];
			expect ( frustum.getPlane ( 0 ).coefficients ).to.deep.equal ( [ 1, 0, 0, 1 ] );
			expect ( () => frustum.getPlane ( 1 ) ).to.throw();
			expect ( new Frustum().numPlanes ).to.equal ( 0 );
		} );

		it ( "Should know which points are inside", function ()
		{
			const cube = makeCube();
			expect ( cube.containsPoint ( [ 0, 0, 0 ] ) ).to.be.true;
			expect ( cube.containsPoint ( [ 1, 1, 1 ] ) ).to.be.true;
			expect ( cube.containsPoint ( [ 1.01, 0, 0 ] ) ).to.be.false;
			expect ( cube.containsPoint ( [ 0, 0, -1.01 ] ) ).to.be.false;

			// With no planes, everything is inside.
			expect ( new Frustum().containsPoint ( [ 1e9, 0, 0 ] ) ).to.be.true;
		} );

		it ( "Should find where a sphere is", function ()
		{
			const cube = makeCube();
			expect ( cube.classifySphere ( new Sphere ( [ 0, 0, 0 ], 0.5 ) ) ).to.equal ( "inside" );
			expect ( cube.classifySphere ( new Sphere ( [ 1, 0, 0 ], 0.5 ) ) ).to.equal ( "intersects" );
			expect ( cube.classifySphere ( new Sphere ( [ 3, 0, 0 ], 1 ) ) ).to.equal ( "outside" );
			expect ( cube.classifySphere ( new Sphere ( [ 0, -3, 0 ], 1 ) ) ).to.equal ( "outside" );

			// A sphere around the whole frustum intersects it.
			expect ( cube.classifySphere ( new Sphere ( [ 0, 0, 0 ], 10 ) ) ).to.equal ( "intersects" );

			// Just past a corner, the sphere is outside the frustum, but not
			// outside any one plane, so it intersects. That's safe for culling.
			const corner = new Sphere ( [ 1.6, 1.6, 0 ], 0.7 );
			expect ( Math.hypot ( 0.6, 0.6 ) ).to.be.greaterThan ( 0.7 );
			expect ( cube.classifySphere ( corner ) ).to.equal ( "intersects" );

			expect ( cube.classifySphere ( new Sphere() ) ).to.equal ( "outside" );
		} );

		it ( "Should find where a box is", function ()
		{
			const cube = makeCube();
			expect ( cube.classifyBox ( box ( [ -0.5, -0.5, -0.5 ], [ 0.5, 0.5, 0.5 ] ) ) ).to.equal ( "inside" );
			expect ( cube.classifyBox ( box ( [ -1, -1, -1 ], [ 1, 1, 1 ] ) ) ).to.equal ( "inside" );
			expect ( cube.classifyBox ( box ( [ 0.5, 0, 0 ], [ 1.5, 1, 1 ] ) ) ).to.equal ( "intersects" );
			expect ( cube.classifyBox ( box ( [ -5, -5, -5 ], [ 5, 5, 5 ] ) ) ).to.equal ( "intersects" );
			expect ( cube.classifyBox ( box ( [ 2, 0, 0 ], [ 3, 1, 1 ] ) ) ).to.equal ( "outside" );
			expect ( cube.classifyBox ( box ( [ 0, 0, -3 ], [ 1, 1, -2 ] ) ) ).to.equal ( "outside" );
			expect ( cube.classifyBox ( new Box() ) ).to.equal ( "outside" );
		} );

		it ( "Should work with other numbers of planes", function ()
		{
			// A pyramid with four sides and a base: five planes.
			const pyramid = new Frustum ( [
				new Plane ( { point: [ 0, 0, 0 ], normal: [ 0, 0, 1 ] } ),
				new Plane ( { point: [ 0, 0, 2 ], normal: [ -1, 0, -1 ] } ),
				new Plane ( { point: [ 0, 0, 2 ], normal: [ 1, 0, -1 ] } ),
				new Plane ( { point: [ 0, 0, 2 ], normal: [ 0, -1, -1 ] } ),
				new Plane ( { point: [ 0, 0, 2 ], normal: [ 0, 1, -1 ] } ),
			] );
			expect ( pyramid.numPlanes ).to.equal ( 5 );
			expect ( pyramid.containsPoint ( [ 0, 0, 1 ] ) ).to.be.true;
			expect ( pyramid.containsPoint ( [ 1.5, 0, 1 ] ) ).to.be.false;
			expect ( pyramid.containsPoint ( [ 0, 0, 2.5 ] ) ).to.be.false;
			expect ( pyramid.classifySphere ( new Sphere ( [ 0, 0, 0.5 ], 0.2 ) ) ).to.equal ( "inside" );
			expect ( pyramid.classifySphere ( new Sphere ( [ 0, 0, 3 ], 0.2 ) ) ).to.equal ( "outside" );

			// A prism with eight sides.
			const prism = makePrism ( 8 );
			expect ( prism.numPlanes ).to.equal ( 8 );
			expect ( prism.containsPoint ( [ 0, 0, 1000 ] ) ).to.be.true;
			expect ( prism.containsPoint ( [ 0.99, 0, 0 ] ) ).to.be.true;
			expect ( prism.containsPoint ( [ 1.01, 0, 0 ] ) ).to.be.false;

			// A square's corner at ( 1, 1 ) is outside the octagon.
			expect ( prism.containsPoint ( [ 0.9, 0.9, 0 ] ) ).to.be.false;
			expect ( prism.classifyBox ( box ( [ -0.5, -0.5, -9 ], [ 0.5, 0.5, 9 ] ) ) ).to.equal ( "inside" );
			expect ( prism.classifyBox ( box ( [ 2, 2, 0 ], [ 3, 3, 1 ] ) ) ).to.equal ( "outside" );
		} );

		it ( "Should clone without sharing the planes", function ()
		{
			const cube = makeCube();
			const copy = cube.clone();
			copy.transform ( translate ( [ 10, 0, 0 ] ) );
			expect ( cube.containsPoint ( [ 0, 0, 0 ] ) ).to.be.true;
			expect ( copy.containsPoint ( [ 0, 0, 0 ] ) ).to.be.false;
			expect ( copy.containsPoint ( [ 10, 0, 0 ] ) ).to.be.true;
		} );

		it ( "Should move, and go into the coordinates under a transform", function ()
		{
			const m = translate ( [ 10, 0, 0 ] );

			const moved = makeCube();
			moved.transform ( m );
			expect ( moved.containsPoint ( [ 10.5, 0, 0 ] ) ).to.be.true;
			expect ( moved.containsPoint ( [ 0, 0, 0 ] ) ).to.be.false;

			// A child's point ( -10, 0, 0 ) is at the parent's origin.
			const local = makeCube();
			local.toLocal ( m );
			expect ( local.containsPoint ( [ -10, 0, 0 ] ) ).to.be.true;
			expect ( local.containsPoint ( [ 0, 0, 0 ] ) ).to.be.false;

			// One undoes the other.
			moved.toLocal ( m );
			const cube = makeCube();
			for ( let i = 0; i < cube.numPlanes; ++i )
			{
				expectClose ( moved.getPlane ( i ).coefficients, cube.getPlane ( i ).coefficients );
			}
		} );

		it ( "Should write a string and JSON", function ()
		{
			const frustum = new Frustum ( [ new Plane() ] );
			expect ( frustum.toString() ).to.equal ( "{ planes: [ { coefficients: [ 0, 0, 1, 0 ] } ] }" );
			expect ( JSON.parse ( JSON.stringify ( frustum ) ) ).to.deep.equal ( { planes: [ { coefficients: [ 0, 0, 1, 0 ] } ] } );
		} );
	} );

	describe ( "ViewFrustum", function ()
	{
		it ( "Should be the box WebGPU draws for the identity", function ()
		{
			const frustum = new ViewFrustum();
			expect ( frustum.numPlanes ).to.equal ( 6 );
			expectClose ( frustum.left.coefficients, [ 1, 0, 0, 1 ] );
			expectClose ( frustum.right.coefficients, [ -1, 0, 0, 1 ] );
			expectClose ( frustum.bottom.coefficients, [ 0, 1, 0, 1 ] );
			expectClose ( frustum.top.coefficients, [ 0, -1, 0, 1 ] );
			expectClose ( frustum.near.coefficients, [ 0, 0, 1, 0 ] );
			expectClose ( frustum.far.coefficients, [ 0, 0, -1, 1 ] );
			expect ( frustum.containsPoint ( [ 0, 0, 0.5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, -0.1 ] ) ).to.be.false;
		} );

		it ( "Should have the planes of a perspective projection", function ()
		{
			// 90 degrees, so at 5 in front of the eye the sides are 5 from the axis.
			const m = Array.from ( mat4.perspectiveZO ( mat4.create(), Math.PI / 2, 1, 1, 10 ) ) as IMatrix44;
			const frustum = new ViewFrustum ( m );

			// The eye looks down negative z.
			expect ( frustum.containsPoint ( [ 0, 0, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, -0.99 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0, -1.01 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, -9.99 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, -10.01 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 4.99, 0, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 5.01, 0, -5 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ -5.01, 0, -5 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 4.99, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, -5.01, -5 ] ) ).to.be.false;

			// Behind the eye.
			expect ( frustum.containsPoint ( [ 0, 0, 5 ] ) ).to.be.false;

			// The near and far planes are where they should be, facing in.
			expect ( frustum.near.distance ( [ 0, 0, -1 ] ) ).to.be.closeTo ( 0, TOLERANCE );
			expect ( frustum.far.distance ( [ 0, 0, -10 ] ) ).to.be.closeTo ( 0, TOLERANCE );
			for ( const plane of frustum.planes )
			{
				expect ( plane.distance ( [ 0, 0, -5 ] ) ).to.be.greaterThan ( 0 );
			}
		} );

		it ( "Should have the planes of an orthographic projection", function ()
		{
			const m = Array.from ( mat4.orthoZO ( mat4.create(), -2, 2, -1, 1, 1, 10 ) ) as IMatrix44;
			const frustum = new ViewFrustum ( m );
			expect ( frustum.containsPoint ( [ 1.99, 0, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 2.01, 0, -5 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0.99, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, -1.01, -5 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0, -0.99 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0, -1.01 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, -10.01 ] ) ).to.be.false;
		} );

		it ( "Should put the near plane where WebGPU clips for an OpenGL matrix", function ()
		{
			// OpenGL's depth goes from -1 to 1, and WebGPU only draws 0 to 1. With
			// near 1 and far 10, depth 0 is at 2 * 10 * 1 / ( 10 + 1 ) from the eye.
			const m = Array.from ( mat4.perspectiveNO ( mat4.create(), Math.PI / 2, 1, 1, 10 ) ) as IMatrix44;
			const frustum = new ViewFrustum ( m );
			const clipped = ( 20 / 11 );
			expect ( frustum.near.distance ( [ 0, 0, -clipped ] ) ).to.be.closeTo ( 0, TOLERANCE );
			expect ( frustum.containsPoint ( [ 0, 0, -1.5 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0, -1.9 ] ) ).to.be.true;
		} );

		it ( "Should go into the coordinates under the camera's transform", function ()
		{
			// The camera is at ( 0, 0, 10 ), looking at the origin. Its matrix takes
			// the coordinates under it (the world's) to the eye's.
			const view = Array.from ( mat4.lookAt ( mat4.create(), [ 0, 0, 10 ], [ 0, 0, 0 ], [ 0, 1, 0 ] ) ) as IMatrix44;
			const projection = Array.from ( mat4.perspectiveZO ( mat4.create(), Math.PI / 2, 1, 1, 20 ) ) as IMatrix44;
			const frustum = new ViewFrustum ( projection );
			frustum.toLocal ( view );

			expect ( frustum.containsPoint ( [ 0, 0, 0 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, 15 ] ) ).to.be.false;
			expect ( frustum.containsPoint ( [ 0, 0, -11 ] ) ).to.be.false;
			expect ( frustum.classifySphere ( new Sphere ( [ 0, 0, 0 ], 1 ) ) ).to.equal ( "inside" );
			expect ( frustum.classifySphere ( new Sphere ( [ 30, 0, 0 ], 1 ) ) ).to.equal ( "outside" );
		} );

		it ( "Should clone as a view frustum, without sharing the planes", function ()
		{
			const m = Array.from ( mat4.perspectiveZO ( mat4.create(), Math.PI / 2, 1, 1, 10 ) ) as IMatrix44;
			const frustum = new ViewFrustum ( m );
			const copy = frustum.clone();
			expect ( copy ).to.be.instanceOf ( ViewFrustum );
			expectClose ( copy.near.coefficients, frustum.near.coefficients );
			copy.transform ( translate ( [ 0, 0, -100 ] ) );
			expect ( frustum.containsPoint ( [ 0, 0, -5 ] ) ).to.be.true;
			expect ( copy.containsPoint ( [ 0, 0, -5 ] ) ).to.be.false;
		} );

		it ( "Should set the planes from another matrix", function ()
		{
			const frustum = new ViewFrustum();
			const m = Array.from ( mat4.orthoZO ( mat4.create(), -2, 2, -1, 1, 1, 10 ) ) as IMatrix44;
			frustum.setFromMatrix ( m );
			expect ( frustum.containsPoint ( [ 1.99, 0, -5 ] ) ).to.be.true;
			expect ( frustum.containsPoint ( [ 0, 0, 0.5 ] ) ).to.be.false;
		} );
	} );
}
