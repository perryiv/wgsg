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

import { clampNumber } from "../../../Tools";
import { Indexed } from "../../../Scene/Primitives";
import { PhongShading } from "../../../Shaders";
import { Reader as BaseClass } from "../../Reader";
import type { IVector4 } from "../../../Types";
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
	public static allocateArrays ( numTriangles: number ) : { points: Float32Array, normals: Float32Array, indices: Uint32Array }
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
			const color: IVector4 = [
				clampNumber ( Math.random(), 0.2, 0.8 ),
				clampNumber ( Math.random(), 0.2, 0.8 ),
				clampNumber ( Math.random(), 0.2, 0.8 ),
				1.0
			];

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
}
