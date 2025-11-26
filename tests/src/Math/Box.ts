///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the bounding box class.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Box } from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Box", function ()
	{
		it ( "Default box is not valid", function ()
		{
			const box = new Box();
			expect ( box.valid ).to.be.false;
			expect ( box.min ).to.deep.equal ( [ Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE ] );
			expect ( box.max ).to.deep.equal ( [ -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ] );
			expect ( box.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( box.size ).to.deep.equal ( [ Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ] );
			expect ( box.radius ).to.equal ( 0 );
		} );

		it ( "Can make a valid box with constructor arguments", function ()
		{
			const box = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			expect ( box.valid ).to.be.true;
			expect ( box.min ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( box.max ).to.deep.equal ( [ 4, 5, 6 ] );
			expect ( box.center ).to.deep.equal ( [ 2.5, 3.5, 4.5 ] );
			expect ( box.size ).to.deep.equal ( [ 3, 3, 3 ] );
			expect ( box.radius ).to.equal ( 2.598076211353316 );
		} );

		it ( "Can make a valid box with setters", function ()
		{
			const box = new Box();
			box.min = [ 1, 2, 3 ];
			box.max = [ 4, 5, 6 ];
			expect ( box.valid ).to.be.true;
			expect ( box.min ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( box.max ).to.deep.equal ( [ 4, 5, 6 ] );
			expect ( box.center ).to.deep.equal ( [ 2.5, 3.5, 4.5 ] );
			expect ( box.size ).to.deep.equal ( [ 3, 3, 3 ] );
			expect ( box.radius ).to.equal ( 2.598076211353316 );
		} );

		it ( "Can grow a box by points", function ()
		{
			const box = new Box();
			box.growByPoint ( [ 1, 2, 3 ] );
			box.growByPoint ( [ 4, 5, 6 ] );
			expect ( box.valid ).to.be.true;
			expect ( box.min ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( box.max ).to.deep.equal ( [ 4, 5, 6 ] );
			expect ( box.center ).to.deep.equal ( [ 2.5, 3.5, 4.5 ] );
			expect ( box.size ).to.deep.equal ( [ 3, 3, 3 ] );
			expect ( box.radius ).to.equal ( 2.598076211353316 );
		} );

		it ( "Can grow a box by another box", function ()
		{
			const box1 = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			box1.growByBox ( new Box ( { min: [ 7, 8, 9 ], max: [ 10, 11, 12 ] } ) );
			expect ( box1.valid ).to.be.true;
			expect ( box1.min ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( box1.max ).to.deep.equal ( [ 10, 11, 12 ] );
			expect ( box1.center ).to.deep.equal ( [ 5.5, 6.5, 7.5 ] );
			expect ( box1.size ).to.deep.equal ( [ 9, 9, 9 ] );
			expect ( box1.radius ).to.equal ( 7.794228634059948 );
		} );

		it ( "Can grow a box with an array of points", function ()
		{
			const points = new Float32Array ( [
				 0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
				10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				20, 21, 22, 23, 24, 25, 26, 27, 28, 29
			] );
			const num = points.length / 3;
			expect ( num ).to.equal ( 10 );

			const x = points.subarray ( 0, 10 );
			const y = points.subarray ( 10, 20 );
			const z = points.subarray ( 20, 30 );

			const box = new Box();
			box.growByPoints ( num, x, y, z );
			expect ( box.valid ).to.be.true;
			expect ( box.min ).to.deep.equal ( [ 0, 10, 20 ] );
			expect ( box.max ).to.deep.equal ( [ 9, 19, 29 ] );
			expect ( box.center ).to.deep.equal ( [ 4.5, 14.5, 24.5 ] );
			expect ( box.size ).to.deep.equal ( [ 9, 9, 9 ] );
			expect ( box.radius ).to.equal ( 7.794228634059948 );
		}	);

		it ( "Can clone a box", function ()
		{
			const box1 = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			const box2 = box1.clone();
			expect ( box2.valid ).to.be.true;
			expect ( box2.min ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( box2.max ).to.deep.equal ( [ 4, 5, 6 ] );
			expect ( box2.center ).to.deep.equal ( [ 2.5, 3.5, 4.5 ] );
			expect ( box2.size ).to.deep.equal ( [ 3, 3, 3 ] );
			expect ( box2.radius ).to.equal ( 2.598076211353316 );
		} );

		it ( "Can clone an invalid box", function ()
		{
			const box1 = new Box();
			const box2 = box1.clone();
			expect ( box2.valid ).to.be.false;
			expect ( box2.min ).to.deep.equal ( [ Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE ] );
			expect ( box2.max ).to.deep.equal ( [ -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ] );
			expect ( box2.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( box2.size ).to.deep.equal ( [ Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ] );
			expect ( box2.radius ).to.equal ( 0 );
		} );

		it ( "Can invalidate a box", function ()
		{
			const box = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			expect ( box.valid ).to.be.true;
			box.invalidate();
			expect ( box.valid ).to.be.false;
			expect ( box.min ).to.deep.equal ( [ Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE ] );
			expect ( box.max ).to.deep.equal ( [ -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ] );
			expect ( box.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( box.size ).to.deep.equal ( [ Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ] );
			expect ( box.radius ).to.equal ( 0 );
		} );

		it ( "Can see if two boxes are equal", function ()
		{
			const box1 = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			const box2 = new Box ( { min: [ 1, 2, 3 ], max: [ 4, 5, 6 ] } );
			expect ( Box.equal ( box1, box2 ) ).to.be.true;

			box2.min[0] = 0;
			expect ( Box.equal ( box1, box2 ) ).to.be.false;

			box2.min[0] = 1;
			expect ( Box.equal ( box1, box2 ) ).to.be.true;

			box2.max[0] = 5;
			expect ( Box.equal ( box1, box2 ) ).to.be.false;

			box2.max[0] = 4;
			expect ( Box.equal ( box1, box2 ) ).to.be.true;
		} );

		it ( "Can see if two boxes intersect", function ()
		{
			{
				const a = new Box ( { min: [ 1, 1, 1 ], max: [ 11, 11, 11 ] } );
				const b = new Box ( { min: [ 8, 8, 8 ], max: [ 12, 12, 12 ] } )
				expect ( a.intersectsBox ( b ) ).to.be.true;
			}
			{
				const a = new Box ( { min: [ 1, 1, 1 ], max: [ 2, 2, 2 ] } );
				const b = new Box ( { min: [ 3, 3, 3 ], max: [ 4, 4, 4 ] } )
				expect ( a.intersectsBox ( b ) ).to.be.false;
			}
			{
				const a = new Box ( { min: [ 1, 1, 1 ], max: [ 4, 4, 4 ] } );
				const b = new Box ( { min: [ 2, 1, 1 ], max: [ 3, 4, 4 ] } )
				expect ( a.intersectsBox ( b ) ).to.be.true;
			}
		} );

		it ( "Can get the box corners", function ()
		{
			const box = new Box ( { min: [ 1, 1, 1 ], max: [ 2, 2, 2 ] } );
			const { llb, lrb, ulb, urb, llf, lrf, ulf, urf } = box.corners;
			expect ( llb ).to.deep.equal ( [ 1, 1, 1 ] );
			expect ( lrb ).to.deep.equal ( [ 2, 1, 1 ] );
			expect ( ulb ).to.deep.equal ( [ 1, 2, 1 ] );
			expect ( urb ).to.deep.equal ( [ 2, 2, 1 ] );
			expect ( llf ).to.deep.equal ( [ 1, 1, 2 ] );
			expect ( lrf ).to.deep.equal ( [ 2, 1, 2 ] );
			expect ( ulf ).to.deep.equal ( [ 1, 2, 2 ] );
			expect ( urf ).to.deep.equal ( [ 2, 2, 2 ] );
		} );

		it ( "Can see if the box contains a sphere", function ()
		{
			const box = new Box ( { min: [ 1, 1, 1 ], max: [ 2, 2, 2 ] } );
			expect ( box.containsSphere ( [ 1.5, 1.5, 1.5 ], 0.5 ) ).to.be.true;
			expect ( box.containsSphere ( [ 0.5, 1.5, 1.5 ], 0.5 ) ).to.be.false;
			expect ( box.containsSphere ( [ 1.5, 0.5, 1.5 ], 0.5 ) ).to.be.false;
			expect ( box.containsSphere ( [ 1.5, 1.5, 0.5 ], 0.5 ) ).to.be.false;
		} );

		it ( "Can see if the box contains a point", function ()
		{
			const box = new Box ( { min: [ 1, 1, 1 ], max: [ 2, 2, 2 ] } );
			expect ( box.containsPoint ( [ 1.5, 1.5, 1.5 ] ) ).to.be.true;
			expect ( box.containsPoint ( [ 0.5, 1.5, 1.5 ] ) ).to.be.false;
			expect ( box.containsPoint ( [ 1.5, 0.5, 1.5 ] ) ).to.be.false;
			expect ( box.containsPoint ( [ 1.5, 1.5, 0.5 ] ) ).to.be.false;
		} );

		it ( "Can see if the box contains another box", function ()
		{
			const box1 = new Box ( { min: [ 1, 1, 1 ], max: [ 2, 2, 2 ] } );
			const box2 = new Box ( { min: [ 1.5, 1.5, 1.5 ], max: [ 1.75, 1.75, 1.75 ] } );
			expect ( box1.containsBox ( box2 ) ).to.be.true;
			box2.min[0] = 0;
			expect ( box1.containsBox ( box2 ) ).to.be.false;
		} );

		it ( "Can see if the box intersects a line", function ()
		{
			const box = new Box ( { min: [ 0, 0, 0 ], max: [ 2, 2, 2 ] } );
			expect ( box.intersectsLine ( [  1,  1, -1 ], [  1,  1,  3 ] ) ).to.be.true;
			expect ( box.intersectsLine ( [  1,  1,  5 ], [  1,  1,  6 ] ) ).to.be.true;
			expect ( box.intersectsLine ( [  3,  3, -1 ], [  4,  4,  3 ] ) ).to.be.false;
			expect ( box.intersectsLine ( [ -1, -1, -1 ], [  3,  3,  3 ] ) ).to.be.true;
		} );

		it ( "Can get a sphere that contains the box", function ()
		{
			const box = new Box ( { min: [ 0, 0, 0 ], max: [ 2, 2, 2 ] } );
			expect ( box.center ).to.deep.equal ( [ 1, 1, 1 ] );
			expect ( box.radius ).to.equal ( Math.sqrt ( 3 ) );
		} );
	} );
};
