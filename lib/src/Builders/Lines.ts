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

import { Geometry, Indexed } from "../Scene";
import { IVector4 } from "../Types";
import { Line } from "../Math";
import { makeSolidColorState } from "./State";
import { makeTriangleEdges } from "../Algorithms";


///////////////////////////////////////////////////////////////////////////////
/**
 * Build the scene for a line segment.
 * @param {object} params The parameters.
 * @param {Line} params.line The line segment.
 * @param {IVector4} [params.color] The color of the line.
 * @returns {Geometry} The geometry representing the line.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildLine = ( { line, color }: { line: Readonly<Line>, color?: IVector4 } ) : ( Geometry | null ) =>
{
	// Handle invalid line.
	if ( !line.valid )
	{
		return null;
	}

	// Get the end points from the line.
	const { start, end } = line;

	// Make the points.
	const points = [
		start[0], start[1], start[2],
		end[0], end[1], end[2],
	];

	// Make the indices.
	const indices = new Uint16Array ( [
		0, 1, // Just one segment.
	] );

	// The topology is a line-list.
	const topology = "line-list";

	// Make the primitives.
	const primitives = new Indexed ( { topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( color )
	{
		geom.state = makeSolidColorState ( { color, topology } );
	}

	// Return the new geometry.
	return geom;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Given a geometry with one indexed triangle-list, return a geometry with
 * an indexed line-list for the triangle edges.
 * @param {Geometry} geom The input geometry.
 * @returns {(Geometry | null)} The new geometry or null on failure.
 */
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
	if ( "triangle-list" !== prim.topology )
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
		topology: "line-list"
	} );

	// Make a geometry using the same points and the new indices.
	const answer = new Geometry ( { points, primitives: [ lineList ] } );

	// Return the new geometry.
	return answer;
}
