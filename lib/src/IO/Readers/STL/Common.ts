///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for both binary and text STL file readers.
//
///////////////////////////////////////////////////////////////////////////////

import { Color } from "../../../Tools";
import { Indexed } from "../../../Scene/Primitives";
import { PhongShading } from "../../../Shaders";
import { Reader as BaseClass } from "../../Reader";
import { vec3 } from "gl-matrix";
import type { IVector3, IVector4 } from "../../../Types";
import {
	Geometry,
	Group,
	Node as SceneNode,
} from "../../../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for STL file reader.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Common extends BaseClass
{
	// These are allocated once here for speed in case they are needed below.
	#point1: IVector3 = [ 0, 0, 0 ];
	#point2: IVector3 = [ 0, 0, 0 ];
	#point3: IVector3 = [ 0, 0, 0 ];
	#edge1: IVector3 = [ 0, 0, 0 ];
	#edge2: IVector3 = [ 0, 0, 0 ];

	/**
	 * Construct the class.
	 * @abstract
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Return a progress callback function. Make one if needed.
	 * @returns {Function} A function that can be used report progress.
	 */
	protected getProgressCallback()
	{
		const progress = this.progress;

		if ( progress )
		{
			return progress;
		}

		return () : boolean =>
		{
			return true;
		};
	}

	/**
	 * Allocate the arrays. We make new ones if they get full, and we trim
	 * them when we are done if they are not full.
	 * @param {number} numTriangles The number of triangles.
	 * @returns {{ points: Float32Array, normals: Float32Array, indices: Uint32Array }} The allocated arrays.
	 */
	protected static allocateArrays ( numTriangles: number ) : { points: Float32Array, normals: Float32Array, indices: Uint32Array }
	{
		const indices = new Uint32Array ( numTriangles * 3 );
		const points = new Float32Array ( indices.length * 3 );
		const normals = new Float32Array ( points.length );
		return { points, normals, indices };
	}

	/**
	 * Build the scene from the arrays.
	 * @param {Float32Array} points The array of point coordinates.
	 * @param {Float32Array} normals The array of normal coordinates.
	 * @param {Uint32Array} indices The array of indices.
	 * @param {number} pointCount The number of points in the points array.
	 * @param {number} normalCount The number of normals in the normals array.
	 * @param {number} indexCount The number of indices in the indices array.
	 * @returns {SceneNode} The scene node representing the STL file.
	 */
	protected buildScene ( points: Float32Array, normals: Float32Array, indices: Uint32Array, pointCount: number, normalCount: number, indexCount: number ) : SceneNode
	{
		// Make sure we alloacted enough space for the points.
		if ( pointCount > points.length )
		{
			throw new Error ( `Too many point coordinates, ${pointCount}, for allocated array of length ${points.length}` );
		}

		// Make sure we alloacted enough space for the normals.
		if ( normalCount > normals.length )
		{
			throw new Error ( `Too many normal coordinates, ${normalCount}, for allocated array of length ${normals.length}` );
		}

		// Make sure we alloacted enough space for the indices.
		if ( indexCount > indices.length )
		{
			throw new Error ( `Too many indices, ${indexCount}, for allocated array of length ${indices.length}` );
		}

		// Trim the arrays to the actual number of points, normals, and indices.
		points  = points.slice  ( 0, pointCount  );
		normals = normals.slice ( 0, normalCount );
		indices = indices.slice ( 0, indexCount  );

		// The number of points should be evenly divisible by 9.
		if ( 0 !== ( points.length % 9 ) )
		{
			throw new Error ( `Number of point coordinates, ${points.length}, is not evenly divisible by 9` );
		}

		// The number of normals should equal the number of points.
		if ( points.length !== normals.length )
		{
			throw new Error ( `Number of normals, ${normals.length}, is not equal to the number of points, ${points.length}` );
		}

		// The number of indices should be evenly divisible by 3.
		if ( 0 !== ( indices.length % 3 ) )
		{
			throw new Error ( `Number of indices, ${indices.length}, is not evenly divisible by 3` );
		}

		// There should be 3 times as many points as indices.
		if ( ( indices.length * 3 ) !== points.length )
		{
			throw new Error ( `Number of point coordinates, ${points.length}, is not three times the number of indices, ${indices.length}` );
		}

		// The group that we return.
		const group = new Group();

		// The geometry for the triangles.
		const tris = new Geometry ( { points, normals } );

		// Add the triangles.
		{
			// Make the primitives.
			const topology = "triangle-list";
			tris.primitives = new Indexed ( { topology, indices } );

			// The color of the triangles.
			const color: IVector4 = Color.makeRandomColor ( 0.2, 0.8 );

			// Add the state.
			tris.state = PhongShading.makeState ( { color, twoSided: true, topology } );

			// To speed things up later, calculate the bounds now.
			tris.getBoundingBox();

			// Add the triangles to the scene.
			group.addChild ( tris );
		}

		// To speed things up later, calculate the bounds now.
		group.getBoundingBox();

		// Return the group.
		return group;
	}

	/**
	 * Set the normal vector from the cross product of the triangle edges.
	 * @param {IVector3} normal The normal vector to set.
	 * @param {Float32Array} points The array of point coordinates.
	 * @param {number} pointCount The number of points in the points array.
	 */
	protected setNormalFromCrossProduct ( normal: IVector3, points: Readonly<Float32Array>, pointCount: Readonly<number> ) : void
	{
		// Get the end of data in the points array, not points.length!
		const end = pointCount;

		// Make sure.
		if ( ( end < 9 ) || ( 0 !== ( end % 9 ) ) )
		{
			throw new Error ( "Not enough points to calculate normal vector" );
		}

		// Shortcuts.
		const point1 = this.#point1;
		const point2 = this.#point2;
		const point3 = this.#point3;
		const edge1 = this.#edge1;
		const edge2 = this.#edge2;

		// Set the three points of the triangle.
		point1[0] = points[end - 9];
		point1[1] = points[end - 8];
		point1[2] = points[end - 7];
		point2[0] = points[end - 6];
		point2[1] = points[end - 5];
		point2[2] = points[end - 4];
		point3[0] = points[end - 3];
		point3[1] = points[end - 2];
		point3[2] = points[end - 1];

		// Set the edges of the triangle.
		edge1[0] = point2[0] - point1[0];
		edge1[1] = point2[1] - point1[1];
		edge1[2] = point2[2] - point1[2];
		edge2[0] = point3[0] - point1[0];
		edge2[1] = point3[1] - point1[1];
		edge2[2] = point3[2] - point1[2];

		// The normal is cross product of the edges.
		vec3.cross ( normal, edge1, edge2 );
	}
}
