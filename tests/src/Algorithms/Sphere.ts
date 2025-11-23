///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for algorithms.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	estimateSphereSizes,
	generateUnitSphere,
	type IVector3
} from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Check the point.
//
///////////////////////////////////////////////////////////////////////////////

function checkPoint ( point: IVector3 )
{
	expect ( point[0] ).to.be.a ( "number" );
	expect ( point[1] ).to.be.a ( "number" );
	expect ( point[2] ).to.be.a ( "number" );

	expect ( point[0] ).to.be.within ( -1, 1 );
	expect ( point[1] ).to.be.within ( -1, 1 );
	expect ( point[2] ).to.be.within ( -1, 1 );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Check the index.
//
///////////////////////////////////////////////////////////////////////////////

function checkIndex ( index: number, maxIndex: number )
{
	expect ( index ).to.be.a ( "number" );
	expect ( index ).to.be.within ( 0, maxIndex );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Increment the point count.
//
///////////////////////////////////////////////////////////////////////////////

function incrementPointCount ( points: Map < string, number >, point: IVector3 )
{
	const key = point.join ( "," );
	const count = ( points.get ( key ) ?? 0 );
	points.set ( key, count + 1 );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test a sphere with the given number of subdivisions.
//
///////////////////////////////////////////////////////////////////////////////

function testSphere ( numSubdivisions: number )
{
	const estimated = estimateSphereSizes ( numSubdivisions );

	expect ( estimated.numPoints ).to.be.a ( "number" );
	expect ( estimated.numPoints ).to.be.equal ( 60 * Math.pow ( 4, numSubdivisions ) );
	expect ( estimated.numPoints % 3 ).to.be.equal ( 0 );
	expect ( estimated.numIndices ).to.be.a ( "number" );
	expect ( estimated.numIndices ).to.be.equal ( estimated.numPoints );

	const maxIndex = estimated.numPoints - 1;
	const indices: number[] = [];
	const points: Map < string, number > = new Map < string, number > ();

	generateUnitSphere ( numSubdivisions, ( x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, x3: number, y3: number, z3: number, i1: number, i2: number, i3: number ) =>
	{
		const p1: IVector3 = [ x1, y1, z1 ];
		const p2: IVector3 = [ x2, y2, z2 ];
		const p3: IVector3 = [ x3, y3, z3 ];

		checkPoint ( p1 );
		checkPoint ( p2 );
		checkPoint ( p3 );

		checkIndex ( i1, maxIndex );
		checkIndex ( i2, maxIndex );
		checkIndex ( i3, maxIndex );

		incrementPointCount ( points, p1 );
		incrementPointCount ( points, p2 );
		incrementPointCount ( points, p3 );

		indices.push ( i1, i2, i3 );
	} );

	// Is our estimate correct?
	expect ( indices.length ).to.be.equal ( estimated.numIndices );

	// We expect repeated points.
	for ( const count of points.values() )
	{
		expect ( count ).to.be.greaterThan ( 4 );
	}
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Sphere", function ()
	{
		it ( "Can make spheres using subdivision", function ()
		{
			testSphere ( 0 );
			testSphere ( 1 );
			testSphere ( 2 );
		} );

		it ( "Can not make a sphere with negative subdivision", function ()
		{
			const message = "Number of sphere subdivisions -1 is < 0";
			expect ( () => { estimateSphereSizes ( -1 ); } ).to.throw ( message );
			expect ( () => { testSphere ( -1 ); } ).to.throw ( message );
		} );
	} );
};
