///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Algorithms for lines.
//
///////////////////////////////////////////////////////////////////////////////

import type { IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a key for the given points.
//
///////////////////////////////////////////////////////////////////////////////

const makeKey = ( p0: IVector3, p1: IVector3 ) : string =>
{
	const answer = [
		p0.toString(),
		p1.toString(),
	];

	answer.sort();

	return answer.join ( "," );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Given a sequence of points as [ x0, x1, x2, ... ] and indices for a
//	triangle-list, make the line-list indices that are the triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

export const makeTriangleEdges = ( points: Float32Array, indices: ( Uint32Array | Uint16Array ) ) : Uint32Array =>
{
	// Check input.
	if ( points.length <= 0 )
	{
		throw new Error ( "Invalid points array when making triangle edges" );
	}

	// Check input.
	if ( 0 !== ( points.length % 3 ) ) // x, y, z, x, y, z, ...
	{
		throw new Error ( `Number of points ${points.length} not evenly divisible by 3 when making triangle edges` );
	}

	// Check input.
	if ( indices.length <= 0 )
	{
		throw new Error ( "No indices when making triangle edges" );
	}

	// Shortcut.
	const numIndices = indices.length;

	// Check input.
	if ( 0 !== ( numIndices % 3 ) ) // triangle-list, not strips.
	{
		throw new Error ( `Number of indices ${numIndices} not evenly divisible by 3 when making triangle edges` );
	}

	// No repeated edges.
	const repeats = new Set < string > ();

	// These will be the indices for the lines.
	// TODO: Is there a way to predict the number and allocate a Uint32Array?
	const lines = new Array < number > ();

	// For speed.
	let i0 = 0; let i1 = 0; let i2 = 0;
	let o0 = 0; let o1 = 0; let o2 = 0;
	let x0 = 0; let y0 = 0; let z0 = 0;
	let x1 = 0; let y1 = 0; let z1 = 0;
	let x2 = 0; let y2 = 0; let z2 = 0;

	// For speed, the keys in the set.
	let l01 = "";	let l12 = "";	let l20 = "";

	// For speed, temporary points.
	const p0: IVector3 = [ 0, 0, 0 ];
	const p1: IVector3 = [ 0, 0, 0 ];
	const p2: IVector3 = [ 0, 0, 0 ];

	// For each triangle ...
	for ( let i = 0; i < numIndices; i += 3 )
	{
		i0 = indices[ i + 0 ]; // Index of point 0.
		i1 = indices[ i + 1 ]; // Index of point 1.
		i2 = indices[ i + 2 ]; // Index of point 2.

		o0 = i0 * 3; // Array offset for point 0.
		o1 = i1 * 3; // Array offset for point 1.
		o2 = i2 * 3; // Array offset for point 2.

		x0 = points[ o0 + 0 ];
		y0 = points[ o0 + 1 ];
		z0 = points[ o0 + 2 ];

		x1 = points[ o1 + 0 ];
		y1 = points[ o1 + 1 ];
		z1 = points[ o1 + 2 ];

		x2 = points[ o2 + 0 ];
		y2 = points[ o2 + 1 ];
		z2 = points[ o2 + 2 ];

		p0[0] = x0; p0[1] = y0; p0[2] = z0;
		p1[0] = x1; p1[1] = y1; p1[2] = z1;
		p2[0] = x2; p2[1] = y2; p2[2] = z2;

		// Make the keys so we can check repeats.
		l01 = makeKey ( p0, p1 );
		l12 = makeKey ( p1, p2 );
		l20 = makeKey ( p2, p0 );

		// Add the lines that we have not seen it before.
		if ( false === repeats.has ( l01 ) )
		{
			repeats.add ( l01 );
			lines.push ( i0, i1 );
		}
		if ( false === repeats.has ( l12 ) )
		{
			repeats.add ( l12 );
			lines.push ( i1, i2 );
		}
		if ( false === repeats.has ( l20 ) )
		{
			repeats.add ( l20 );
			lines.push ( i2, i0 );
		}
	}

	// Help with memory use. We're done with this.
	repeats.clear();

	// This is the array of indices we wanted.
	const answer = new Uint32Array ( lines );

	// Help delete memory. We're done with this.
	lines.length = 0;

	// Return the answer.
	return answer;
}
