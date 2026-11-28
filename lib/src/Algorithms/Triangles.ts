///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Turn triangle strips and fans into lists of triangles, three indices for
//	each triangle, so that everything else (drawing, triangle edges, and
//	intersections) only has to handle lists. WebGPU has no fans, and strips
//	would need more pipeline settings, so lists are also simpler to draw.
//
//	The order of each triangle's corners is glTF's, which keeps the front of
//	every triangle on the same side:
//	- Strip: triangle i is ( v[i], v[i + 1 + i % 2], v[i + 2 - i % 2] ), so
//	  every other one is turned around, as a strip's triangles alternate.
//	- Fan: triangle i is ( v[i + 1], v[i + 2], v[0] ).
//	https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#topology-types
//
//	Triangles with a repeated vertex have no area, and are left out. Strips
//	use them to join pieces.
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ITriangleTopology = ( "triangle-list" | "triangle-strip" | "triangle-fan" );

// The indices of the triangles' vertices, 16 or 32 bits each.
export type ITriangleIndices = ( Uint16Array | Uint32Array );


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the indices 0, 1, 2, and so on, plus the first, for vertices without
 * indices.
 * @param {number} first - The first index.
 * @param {number} count - How many.
 * @returns {ITriangleIndices} The indices, 16 bits each if they fit.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeVertexSequence = ( first: number, count: number ) : ITriangleIndices =>
{
	const answer = ( ( ( first + count ) <= 65536 ) ? new Uint16Array ( count ) : new Uint32Array ( count ) );
	for ( let i = 0; i < count; ++i )
	{
		answer[i] = first + i;
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Put the triangles in an array, 16 bits each if they fit, leaving out
 * those with a repeated vertex.
 * @param {number[]} triangles - Three indices for each triangle.
 * @returns {ITriangleIndices} The indices.
 */
///////////////////////////////////////////////////////////////////////////////

const toArray = ( triangles: readonly number[] ) : ITriangleIndices =>
{
	const kept: number[] = [];
	let largest = 0;
	for ( let i = 0; ( i + 2 ) < triangles.length; i += 3 )
	{
		const a = triangles[i];
		const b = triangles[i + 1];
		const c = triangles[i + 2];
		if ( ( a !== b ) && ( b !== c ) && ( a !== c ) )
		{
			kept.push ( a, b, c );
			largest = Math.max ( largest, a, b, c );
		}
	}
	return ( ( largest <= 65535 ) ? new Uint16Array ( kept ) : new Uint32Array ( kept ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Turn a triangle strip into a list of triangles.
 * @param {ArrayLike<number>} vertices - The strip's vertex indices.
 * @returns {ITriangleIndices} Three indices for each triangle.
 */
///////////////////////////////////////////////////////////////////////////////

export const stripToTriangles = ( vertices: ArrayLike<number> ) : ITriangleIndices =>
{
	const triangles: number[] = [];
	for ( let i = 0; ( i + 2 ) < vertices.length; ++i )
	{
		const odd = ( i % 2 );
		triangles.push ( vertices[i], vertices[i + 1 + odd], vertices[i + 2 - odd] );
	}
	return toArray ( triangles );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Turn a triangle fan into a list of triangles.
 * @param {ArrayLike<number>} vertices - The fan's vertex indices. The first
 * is in every triangle.
 * @returns {ITriangleIndices} Three indices for each triangle.
 */
///////////////////////////////////////////////////////////////////////////////

export const fanToTriangles = ( vertices: ArrayLike<number> ) : ITriangleIndices =>
{
	const triangles: number[] = [];
	for ( let i = 0; ( i + 2 ) < vertices.length; ++i )
	{
		triangles.push ( vertices[i + 1], vertices[i + 2], vertices[0] );
	}
	return toArray ( triangles );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Turn triangles of any topology into a list of triangles. A list stays the
 * same, without the triangles with a repeated vertex, and without the
 * vertices left over after the last whole triangle.
 * @param {ITriangleTopology} topology - How the vertices make triangles.
 * @param {ArrayLike<number>} vertices - The vertex indices. For vertices
 * without indices, use makeVertexSequence().
 * @returns {ITriangleIndices} Three indices for each triangle.
 */
///////////////////////////////////////////////////////////////////////////////

export const toTriangles = ( topology: ITriangleTopology, vertices: ArrayLike<number> ) : ITriangleIndices =>
{
	switch ( topology )
	{
		case "triangle-strip": return stripToTriangles ( vertices );
		case "triangle-fan": return fanToTriangles ( vertices );
		case "triangle-list": return toArray ( Array.from ( vertices ) );
		default:
		{
			throw new Error ( `Unknown triangle topology '${topology as string}'` );
		}
	}
};
