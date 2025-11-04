///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for lines.
//
///////////////////////////////////////////////////////////////////////////////

import { makeTriangleEdges } from "../Algorithms";
import { mat4 } from "gl-matrix";
import type { IVector3 } from "../Types";
import {
	Geometry,
	Indexed
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Given a geometry with one indexed triangle-list, return a geometry with
//	an indexed line-list for the triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

export const buildTriangleEdges = ( geom: Geometry ) : ( Geometry | null ) =>
{
	// Get the points.
	const points = geom.points?.values;

	// Make sure.
	if ( !points )
	{
		return null;
	}

	// Shortcut.
	const arrayLength = points.length;

	// Make sure.
	if ( arrayLength <= 0 )
	{
		return null;
	}

	// The array of points is [ x0, y0, z0, x1, y1, z1, ... ],
	// so the length should be evenly divisible by 3.
	if ( 0 !== ( arrayLength % 3 ) )
	{
		return null;
	}

	// Now we know this will be an integer.
	const numPoints = arrayLength / 3;

	// Shortcut.
	const prims = geom.primitives;

	// Make sure.
	if ( !prims )
	{
		return null;
	}

	// Make sure.
	if ( 1 !== prims.length )
	{
		return null;
	}

	// Shortcut.
	const prim = prims[0];

	// TODO: For now we only handle triangle-lists.
	if ( "triangle-list" !== prim.mode )
	{
		return null;
	}

	// TODO: For now we only handle indexed triangles.
	if ( false === ( prim instanceof Indexed ) )
	{
		return null;
	}

	// The indices that select the points that make the triangles.
	const triIndices = prim.indices?.values;

	// Make sure.
	if ( !triIndices )
	{
		return null;
	}

	// Make sure.
	if ( triIndices.length <= 0 )
	{
		return null;
	}

	// This should be true because it's a list of triangles, not a strip.
	if ( 0 !== ( triIndices.length % 3 ) )
	{
		return null;
	}

	// Now we know this will be an integer.
	const numTriangles = triIndices.length / 3;

	// Given what we did above, this should always be true.
	if ( numTriangles < 1 )
	{
		throw new Error ( "Internal logic error when making triangle edges" );
	}

	// Make the indices for the lines that are the edges.
	const lineIndices = makeTriangleEdges ( points, triIndices );

	// Make the line-list primitive.
	const lineList = new Indexed ( {
		indices: new Uint32Array ( lineIndices ),
		mode: "line-list"
	} );

	// Make a geometry using the same points and the new indices.
	const answer = new Geometry ( { points, primitives: [ lineList ] } );

	// Return the new geometry.
	return answer;
}
