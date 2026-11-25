///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the plane class.
//
///////////////////////////////////////////////////////////////////////////////

import { Box } from "../../../lib/src/Math/Box";
import { expect } from "chai";
import { mat4, vec3 } from "gl-matrix";
import { Plane } from "../../../lib/src/Math/Plane";
import { Sphere } from "../../../lib/src/Math/Sphere";
import type { IContainment, IMatrix44, IVector3 } from "../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers.
//
///////////////////////////////////////////////////////////////////////////////

// How close is close enough. The matrices made with gl-matrix are
// Float32Arrays, so they only have about seven digits.
export const TOLERANCE = 1e-5;

/**
 * Expect the numbers to be close to the expected ones.
 * @param {ArrayLike<number>} actual - The numbers.
 * @param {number[]} expected - The expected numbers.
 */
export const expectClose = ( actual: ArrayLike<number>, expected: readonly number[], tolerance = TOLERANCE ) : void =>
{
	expect ( actual.length ).to.equal ( expected.length );
	for ( let i = 0; i < expected.length; ++i )
	{
		expect ( actual[i] ).to.be.closeTo ( expected[i], tolerance );
	}
};

/**
 * Make random numbers that are the same every run.
 * @param {number} seed - The seed.
 * @returns {Function} A function that returns a number from -1 to 1.
 */
export const makeRandom = ( seed: number ) : ( () => number ) =>
{
	let state = seed;
	return () =>
	{
		// A simple linear congruential generator.
		state = ( ( state * 1664525 ) + 1013904223 ) % 4294967296;
		return ( ( state / 4294967296 ) * 2 ) - 1;
	};
};

/**
 * Make a matrix that turns around an axis and then moves.
 * @param {number} angle - The angle, in radians.
 * @param {IVector3} axis - The axis.
 * @param {IVector3} move - How far to move.
 * @returns {IMatrix44} The matrix.
 */
const makeRigid = ( angle: number, axis: IVector3, move: IVector3 ) : IMatrix44 =>
{
	const m = mat4.create();
	mat4.translate ( m, m, move );
	mat4.rotate ( m, m, angle, axis );
	return Array.from ( m ) as IMatrix44;
};

/**
 * Move a point by a matrix.
 * @param {IMatrix44} m - The matrix.
 * @param {IVector3} p - The point.
 * @returns {IVector3} The moved point.
 */
const movePoint = ( m: Readonly<IMatrix44>, p: Readonly<IVector3> ) : IVector3 =>
{
	const out: IVector3 = [ 0, 0, 0 ];
	vec3.transformMat4 ( out, p, m );
	return out;
};

/**
 * Get where the box is compared to the plane by looking at all eight corners.
 * @param {Plane} plane - The plane.
 * @param {Box} box - The box.
 * @returns {IContainment} Inside, intersects, or outside.
 */
const classifyBoxByCorners = ( plane: Plane, box: Box ) : IContainment =>
{
	const { min, max } = box;
	let lowest = Infinity;
	let highest = -Infinity;
	for ( const x of [ min[0], max[0] ] )
	{
		for ( const y of [ min[1], max[1] ] )
		{
			for ( const z of [ min[2], max[2] ] )
			{
				const d = plane.distance ( [ x, y, z ] );
				lowest = Math.min ( lowest, d );
				highest = Math.max ( highest, d );
			}
		}
	}
	if ( highest < 0 )
	{
		return "outside";
	}
	if ( lowest >= 0 )
	{
		return "inside";
	}
	return "intersects";
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Plane", function ()
	{
		it ( "Should be the plane z = 0 by default", function ()
		{
			const plane = new Plane();
			expect ( plane.valid ).to.be.true;
			expect ( plane.coefficients ).to.deep.equal ( [ 0, 0, 1, 0 ] );
			expect ( plane.normal ).to.deep.equal ( [ 0, 0, 1 ] );
			expectClose ( plane.point, [ 0, 0, 0 ] );
		} );

		it ( "Should make the normal unit length when given coefficients", function ()
		{
			const plane = new Plane ( { coefficients: [ 0, 0, 2, -4 ] } );
			expect ( plane.coefficients ).to.deep.equal ( [ 0, 0, 1, -2 ] );
			expectClose ( plane.point, [ 0, 0, 2 ] );

			plane.setFromCoefficients ( 3, 4, 0, 10 );
			expectClose ( plane.coefficients, [ 0.6, 0.8, 0, 2 ] );
		} );

		it ( "Should make a plane from a point and a normal", function ()
		{
			const plane = new Plane ( { point: [ 1, 2, 3 ], normal: [ 0, 3, 0 ] } );
			expectClose ( plane.normal, [ 0, 1, 0 ] );
			expectClose ( plane.coefficients, [ 0, 1, 0, -2 ] );

			// The point it gives back is the one closest to the origin.
			expectClose ( plane.point, [ 0, 2, 0 ] );
			expect ( plane.distance ( [ 1, 2, 3 ] ) ).to.be.closeTo ( 0, 1e-12 );
		} );

		it ( "Should keep the normal when the point is set, and the other way around", function ()
		{
			const plane = new Plane ( { point: [ 0, 0, 5 ], normal: [ 0, 0, 1 ] } );

			plane.point = [ 7, 8, 9 ];
			expectClose ( plane.normal, [ 0, 0, 1 ] );
			expect ( plane.distance ( [ 7, 8, 9 ] ) ).to.be.closeTo ( 0, 1e-12 );

			// It turns around the point closest to the origin, ( 0, 0, 9 ).
			plane.normal = [ 1, 0, 0 ];
			expectClose ( plane.normal, [ 1, 0, 0 ] );
			expect ( plane.distance ( [ 0, 0, 9 ] ) ).to.be.closeTo ( 0, 1e-12 );
		} );

		it ( "Should not be valid when the normal is all zeros", function ()
		{
			const plane = new Plane ( { coefficients: [ 0, 0, 0, 5 ] } );
			expect ( plane.valid ).to.be.false;
			expect ( plane.coefficients ).to.deep.equal ( [ 0, 0, 0, 5 ] );
			plane.normalize();
			expect ( plane.coefficients ).to.deep.equal ( [ 0, 0, 0, 5 ] );
		} );

		it ( "Should clone, copy, and compare", function ()
		{
			const a = new Plane ( { coefficients: [ 1, 0, 0, -3 ] } );
			const b = a.clone();
			expect ( Plane.equal ( a, b ) ).to.be.true;

			b.point = [ 4, 0, 0 ];
			expect ( Plane.equal ( a, b ) ).to.be.false;
			expect ( a.coefficients ).to.deep.equal ( [ 1, 0, 0, -3 ] );

			const c = new Plane();
			c.setFromPlane ( b );
			expect ( Plane.equal ( b, c ) ).to.be.true;

			// The coefficients it gives are a copy.
			const coefficients = a.coefficients;
			coefficients[3] = 100;
			expect ( a.coefficients[3] ).to.equal ( -3 );
		} );

		it ( "Should give the signed distance to a point", function ()
		{
			const plane = new Plane ( { point: [ 0, 0, 2 ], normal: [ 0, 0, 1 ] } );
			expect ( plane.distance ( [ 5, 6, 5 ] ) ).to.equal ( 3 );
			expect ( plane.distance ( [ 5, 6, -1 ] ) ).to.equal ( -3 );
			expect ( plane.distance ( [ 5, 6, 2 ] ) ).to.equal ( 0 );
		} );

		it ( "Should find where a sphere is", function ()
		{
			const plane = new Plane ( { point: [ 0, 0, 0 ], normal: [ 1, 0, 0 ] } );
			expect ( plane.classifySphere ( new Sphere ( [ 5, 0, 0 ], 1 ) ) ).to.equal ( "inside" );
			expect ( plane.classifySphere ( new Sphere ( [ 0.5, 0, 0 ], 1 ) ) ).to.equal ( "intersects" );
			expect ( plane.classifySphere ( new Sphere ( [ -0.5, 0, 0 ], 1 ) ) ).to.equal ( "intersects" );
			expect ( plane.classifySphere ( new Sphere ( [ -5, 0, 0 ], 1 ) ) ).to.equal ( "outside" );

			// Touching the plane from the inside is inside, and from the outside
			// it intersects.
			expect ( plane.classifySphere ( new Sphere ( [ 1, 0, 0 ], 1 ) ) ).to.equal ( "inside" );
			expect ( plane.classifySphere ( new Sphere ( [ -1, 0, 0 ], 1 ) ) ).to.equal ( "intersects" );

			// A sphere with no size is a point.
			expect ( plane.classifySphere ( new Sphere ( [ 1, 0, 0 ], 0 ) ) ).to.equal ( "inside" );
			expect ( plane.classifySphere ( new Sphere ( [ -1, 0, 0 ], 0 ) ) ).to.equal ( "outside" );

			// There is nothing in an invalid sphere.
			expect ( plane.classifySphere ( new Sphere() ) ).to.equal ( "outside" );
		} );

		it ( "Should find where a box is", function ()
		{
			const box = ( min: IVector3, max: IVector3 ) => new Box ( { min, max } );

			const plane = new Plane ( { point: [ 0, 0, 0 ], normal: [ 1, 0, 0 ] } );
			expect ( plane.classifyBox ( box ( [ 1, -1, -1 ], [ 2, 1, 1 ] ) ) ).to.equal ( "inside" );
			expect ( plane.classifyBox ( box ( [ -1, -1, -1 ], [ 1, 1, 1 ] ) ) ).to.equal ( "intersects" );
			expect ( plane.classifyBox ( box ( [ -2, -1, -1 ], [ -1, 1, 1 ] ) ) ).to.equal ( "outside" );
			expect ( plane.classifyBox ( box ( [ 0, 0, 0 ], [ 1, 1, 1 ] ) ) ).to.equal ( "inside" );
			expect ( plane.classifyBox ( box ( [ -1, 0, 0 ], [ 0, 1, 1 ] ) ) ).to.equal ( "intersects" );

			// A plane at an angle, so that the corners it picks matter.
			const tilted = new Plane ( { point: [ 0, 0, 0 ], normal: [ 1, 1, 0 ] } );
			expect ( tilted.classifyBox ( box ( [ 1, -0.9, 0 ], [ 2, -0.5, 1 ] ) ) ).to.equal ( "inside" );
			expect ( tilted.classifyBox ( box ( [ 0.5, -1, 0 ], [ 1, -0.6, 1 ] ) ) ).to.equal ( "intersects" );
			expect ( tilted.classifyBox ( box ( [ -2, 0.5, 0 ], [ -1, 0.9, 1 ] ) ) ).to.equal ( "outside" );

			// A normal pointing the negative way.
			const negative = new Plane ( { point: [ 0, 0, 0 ], normal: [ -1, 0, 0 ] } );
			expect ( negative.classifyBox ( box ( [ -2, 0, 0 ], [ -1, 1, 1 ] ) ) ).to.equal ( "inside" );
			expect ( negative.classifyBox ( box ( [ 1, 0, 0 ], [ 2, 1, 1 ] ) ) ).to.equal ( "outside" );

			// There is nothing in an invalid box.
			expect ( plane.classifyBox ( new Box() ) ).to.equal ( "outside" );
		} );

		it ( "Should find the same answers as checking every corner of a box", function ()
		{
			const random = makeRandom ( 1 );
			for ( let i = 0; i < 1000; ++i )
			{
				const plane = new Plane ( {
					point: [ random(), random(), random() ],
					normal: [ random(), random(), random() ],
				} );
				const a: IVector3 = [ random() * 2, random() * 2, random() * 2 ];
				const b: IVector3 = [ random() * 2, random() * 2, random() * 2 ];
				const box = new Box ( {
					min: [ Math.min ( a[0], b[0] ), Math.min ( a[1], b[1] ), Math.min ( a[2], b[2] ) ],
					max: [ Math.max ( a[0], b[0] ), Math.max ( a[1], b[1] ), Math.max ( a[2], b[2] ) ],
				} );
				expect ( plane.classifyBox ( box ) ).to.equal ( classifyBoxByCorners ( plane, box ) );
			}
		} );

		it ( "Should keep the points on the plane on it when it moves", function ()
		{
			const plane = new Plane ( { point: [ 1, 2, 3 ], normal: [ 1, 1, 0 ] } );
			const on: IVector3[] = [ [ 1, 2, 3 ], [ 2, 1, 3 ], [ 1, 2, -7 ], [ 0, 3, 0 ] ];
			const inside: IVector3 = [ 5, 5, 0 ];
			const before = plane.distance ( inside );

			const m = makeRigid ( 0.7, [ 1, 2, 3 ], [ 10, -4, 2 ] );
			const moved = plane.clone();
			moved.transform ( m );

			for ( const p of on )
			{
				expect ( moved.distance ( movePoint ( m, p ) ) ).to.be.closeTo ( 0, TOLERANCE );
			}

			// Turning and moving keep distances.
			expect ( moved.distance ( movePoint ( m, inside ) ) ).to.be.closeTo ( before, TOLERANCE );

			// The normal stays unit length.
			expect ( vec3.length ( moved.normal ) ).to.be.closeTo ( 1, 1e-12 );
		} );

		it ( "Should keep the inside on the inside through a mirror and a scale", function ()
		{
			const plane = new Plane ( { point: [ 1, 0, 0 ], normal: [ 1, 0, 0 ] } );
			const inside: IVector3 = [ 3, 1, 1 ];
			const outside: IVector3 = [ -3, 1, 1 ];

			const m = Array.from ( mat4.fromScaling ( mat4.create(), [ -2, 3, 0.5 ] ) ) as IMatrix44;
			const moved = plane.clone();
			moved.transform ( m );

			expect ( moved.distance ( movePoint ( m, inside ) ) ).to.be.greaterThan ( 0 );
			expect ( moved.distance ( movePoint ( m, outside ) ) ).to.be.lessThan ( 0 );
			expect ( moved.distance ( movePoint ( m, [ 1, 5, 5 ] ) ) ).to.be.closeTo ( 0, TOLERANCE );
		} );

		it ( "Should not transform by a matrix that can't be inverted", function ()
		{
			const flat = Array.from ( mat4.fromScaling ( mat4.create(), [ 1, 1, 0 ] ) ) as IMatrix44;
			expect ( () => new Plane().transform ( flat ) ).to.throw();
		} );

		it ( "Should put the plane in the coordinates under a transform", function ()
		{
			// The plane is in the parent's coordinates. A point p in the child's
			// coordinates is at m * p in the parent's.
			const plane = new Plane ( { point: [ 1, 2, 3 ], normal: [ 1, -2, 0.5 ] } );
			const m = makeRigid ( 1.1, [ 0, 1, 1 ], [ 3, 0, -5 ] );
			const local = plane.clone();
			local.toLocal ( m );

			const random = makeRandom ( 2 );
			for ( let i = 0; i < 100; ++i )
			{
				const p: IVector3 = [ random() * 10, random() * 10, random() * 10 ];
				expect ( local.distance ( p ) ).to.be.closeTo ( plane.distance ( movePoint ( m, p ) ), TOLERANCE );
			}
		} );

		it ( "Should undo a transform by putting it in the coordinates under it", function ()
		{
			const plane = new Plane ( { point: [ 1, 2, 3 ], normal: [ 4, 5, 6 ] } );
			const m = makeRigid ( 2.3, [ 1, 0, 1 ], [ -1, 7, 2 ] );
			const other = plane.clone();
			other.transform ( m );
			other.toLocal ( m );
			expectClose ( other.coefficients, plane.coefficients );
		} );

		it ( "Should keep the side of a point under a transform that flattens", function ()
		{
			// The transform can't be inverted, but toLocal() only needs the transpose.
			const plane = new Plane ( { point: [ 0, 0, 0 ], normal: [ 1, 0, 1 ] } );
			const flat = Array.from ( mat4.fromScaling ( mat4.create(), [ 1, 1, 0 ] ) ) as IMatrix44;
			const local = plane.clone();
			local.toLocal ( flat );
			for ( const p of [ [ 2, 0, 7 ], [ -2, 0, 7 ], [ 2, 3, -9 ] ] as IVector3[] )
			{
				expect ( Math.sign ( local.distance ( p ) ) ).to.equal ( Math.sign ( plane.distance ( movePoint ( flat, p ) ) ) );
			}
		} );

		it ( "Should write the result to the output plane and leave the input alone", function ()
		{
			const a = new Plane ( { coefficients: [ 0, 1, 0, -1 ] } );
			const out = new Plane();
			const m = makeRigid ( 0, [ 0, 0, 1 ], [ 0, 5, 0 ] );

			expect ( Plane.transform ( out, a, m ) ).to.equal ( out );
			expectClose ( out.coefficients, [ 0, 1, 0, -6 ] );
			expect ( a.coefficients ).to.deep.equal ( [ 0, 1, 0, -1 ] );

			expect ( Plane.toLocal ( out, a, m ) ).to.equal ( out );
			expectClose ( out.coefficients, [ 0, 1, 0, 4 ] );
			expect ( a.coefficients ).to.deep.equal ( [ 0, 1, 0, -1 ] );
		} );

		it ( "Should write a string and JSON", function ()
		{
			const plane = new Plane ( { coefficients: [ 0, 0, 1, -2 ] } );
			expect ( plane.toString() ).to.equal ( "{ coefficients: [ 0, 0, 1, -2 ] }" );
			expect ( JSON.parse ( JSON.stringify ( plane ) ) ).to.deep.equal ( { coefficients: [ 0, 0, 1, -2 ] } );
		} );
	} );
}
