///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the bounding sphere class.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { IVector3, Sphere } from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Sphere", function ()
	{
		it ( "Default sphere is not valid", function ()
		{
			const sphere = new Sphere();
			expect ( sphere.valid ).to.be.false;
			expect ( sphere.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( -1 );
		} );

		it ( "Can make a valid sphere with constructor arguments", function ()
		{
			const sphere = new Sphere ( [ 1, 2, 3 ], 4 );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( sphere.radius ).to.equal ( 4 );
		} );

		it ( "Can make a valid sphere with setters", function ()
		{
			const sphere = new Sphere();
			sphere.center = [ 1, 2, 3 ];
			sphere.radius = 4;
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( sphere.radius ).to.equal ( 4 );
		} );

		it ( "Can grow a sphere by points", function ()
		{
			const sphere = new Sphere();
			expect ( sphere.valid ).to.be.false;

			sphere.growByPoint ( [ 1, 0, 0 ] );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 1, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 0 );

			sphere.growByPoint ( [ 3, 0, 0 ] );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 1 );

			sphere.growByPoint ( [ 2, 1, 0 ] );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 1 );

			sphere.growByPoint ( [ 2, 3, 0 ] );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 1, 0 ] );
			expect ( sphere.radius ).to.equal ( 2 );
		} );

		it ( "Can grow a sphere by another sphere", function ()
		{
			const sphere = new Sphere();
			expect ( sphere.valid ).to.be.false;

			sphere.growBySphere ( new Sphere ( [ 1, 0, 0 ], 1 ) );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 1, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 1 );

			sphere.growBySphere ( new Sphere ( [ 3, 0, 0 ], 1 ) );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 2 );

			sphere.growBySphere ( new Sphere ( [ 2, 0, 0 ], 1 ) );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 2 );

			sphere.growBySphere ( new Sphere ( [ 2, 3, 0 ], 1 ) );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 2, 1, 0 ] );
			expect ( sphere.radius ).to.equal ( 3 );
		} );

		it ( "Can grow a sphere with an array of points", function ()
		{
			const points = new Float32Array ( [
				 0, 0, 0,
				 1, 0, 0,
				 1, 1, 0,
				 0, 1, 0,
				 0, 0, 1,
				 1, 0, 1,
				 1, 1, 1,
				 0, 1, 1,
			] );
			expect ( points.length ).to.equal ( 24 );

			const sphere = new Sphere();
			expect ( sphere.valid ).to.be.false;

			sphere.growByPoints ( points );
			expect ( sphere.valid ).to.be.true;
			expect ( sphere.center ).to.deep.equal ( [ 0.5, 0.5, 0.5 ] );
			expect ( sphere.radius ).to.equal ( ( Math.sqrt ( 3 ) / 2 ) );
		}	);

		it ( "Can clone a sphere", function ()
		{
			const sphere1 = new Sphere ( [ 1, 2, 3 ], 4 );
			const sphere2 = sphere1.clone();
			expect ( sphere2.valid ).to.be.true;
			expect ( sphere2.center ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( sphere2.radius ).to.equal ( 4 );
		} );

		it ( "Can clone an invalid sphere", function ()
		{
			const sphere1 = new Sphere();
			const sphere2 = sphere1.clone();
			expect ( sphere2.valid ).to.be.false;
			expect ( sphere2.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( sphere2.radius ).to.equal ( -1 );
		} );

		it ( "Can invalidate a sphere", function ()
		{
			const center: IVector3 = [ 1, 2, 3 ];
			const sphere = new Sphere ( center, 4 );
			expect ( sphere.valid ).to.be.true;
			sphere.invalidate();
			expect ( sphere.valid ).to.be.false;
			expect ( sphere.center ).to.deep.equal ( center );
			expect ( sphere.radius ).to.equal ( -1 );
		} );

		it ( "Can see if two spheres are equal", function ()
		{
			const sphere1 = new Sphere ( [ 1, 2, 3 ], 4 );
			const sphere2 = new Sphere ( [ 1, 2, 3 ], 4 );
			expect ( Sphere.equal ( sphere1, sphere2 ) ).to.be.true;

			sphere2.center = [ 0, 2, 3 ];
			expect ( Sphere.equal ( sphere1, sphere2 ) ).to.be.false;

			sphere2.center = [ 1, 2, 3 ];
			expect ( Sphere.equal ( sphere1, sphere2 ) ).to.be.true;

			sphere2.radius = 5;
			expect ( Sphere.equal ( sphere1, sphere2 ) ).to.be.false;

			sphere2.radius = 4;
			expect ( Sphere.equal ( sphere1, sphere2 ) ).to.be.true;
		} );

		it ( "Can see if two spheres intersect", function ()
		{
			const a = new Sphere ( [ 0, 0, 0 ], 1 );
			expect ( a.intersectsSphere ( new Sphere ( [ 1, 0, 0 ], 1 ) ) ).to.be.true;
			expect ( a.intersectsSphere ( new Sphere ( [ 2, 0, 0 ], 1 ) ) ).to.be.true;
			expect ( a.intersectsSphere ( new Sphere ( [ 3, 0, 0 ], 1 ) ) ).to.be.false;
			expect ( a.intersectsSphere ( new Sphere ( [ 3, 0, 0 ], 2 ) ) ).to.be.true;
		} );

		it ( "Can see if the sphere contains a point", function ()
		{
			let sphere = new Sphere ( [ 0, 0, 0 ], 1 );
			expect ( sphere.containsPoint ( [ 0.5, 0.5, 0.5 ] ) ).to.be.true;
			expect ( sphere.containsPoint ( [ 1.0, 0.0, 0.0 ] ) ).to.be.true;
			expect ( sphere.containsPoint ( [ 1.5, 0.0, 0.0 ] ) ).to.be.false;
			expect ( sphere.containsPoint ( [ 0.0, 1.0, 0.0 ] ) ).to.be.true;

			sphere = new Sphere ( [ 10, 0, 0 ], 1 );
			expect ( sphere.containsPoint ( [ 10.5, 0.5, 0.5 ] ) ).to.be.true;
			expect ( sphere.containsPoint ( [ 11.0, 0.0, 0.0 ] ) ).to.be.true;
			expect ( sphere.containsPoint ( [ 11.5, 0.0, 0.0 ] ) ).to.be.false;
			expect ( sphere.containsPoint ( [ 10.0, 1.0, 0.0 ] ) ).to.be.true;
		} );

		it ( "Can see if the sphere contains another sphere", function ()
		{
			const sphere = new Sphere ( [ 0, 0, 0 ], 10 );
			expect ( sphere.containsSphere ( new Sphere ( [ 1, 0, 0 ], 1 ) ) ).to.be.true;
			expect ( sphere.containsSphere ( new Sphere ( [ 8, 0, 0 ], 2 ) ) ).to.be.true;
			expect ( sphere.containsSphere ( new Sphere ( [ 9, 0, 0 ], 1 ) ) ).to.be.true;
			expect ( sphere.containsSphere ( new Sphere ( [ 9, 0, 0 ], 2 ) ) ).to.be.false;
		} );

		it ( "Can see if the sphere intersects a line", function ()
		{
			const sphere = new Sphere ( [ 10, 0, 0 ], 2 );
			expect ( sphere.intersectsLine ( [ 0, 0, 0 ], [ 1, 0, 0 ] ) ).to.be.true;
			expect ( sphere.intersectsLine ( [ 0, 1, 0 ], [ 1, 1, 0 ] ) ).to.be.true;
			expect ( sphere.intersectsLine ( [ 0, 2, 0 ], [ 1, 2, 0 ] ) ).to.be.true;
			expect ( sphere.intersectsLine ( [ 0, 3, 0 ], [ 1, 3, 0 ] ) ).to.be.false;
		} );
	} );
};
