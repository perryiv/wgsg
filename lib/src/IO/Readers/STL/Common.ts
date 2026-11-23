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

import { ColorTool, DEVELOPER_BUILD } from "../../../Tools";
import { FlatShading } from "../../../Shaders";
import { Reader as BaseClass } from "../../Reader";
import { vec4 } from "gl-matrix";
import type { IVector4 } from "../../../Types";
import {
	ColorAttribute as Color,
	Geometry,
	Group,
	Arrays,
	Node as SceneNode,
	TwoSidedLight,
} from "../../../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	The most triangles in one geometry. Bigger files are split into more than
//	one geometry, each with its own arrays.
//
///////////////////////////////////////////////////////////////////////////////

export const STL_MAX_TRIANGLES_PER_GEOMETRY = ( 1024 * 1024 );


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for STL file reader.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Common extends BaseClass
{
	// The default color is random in a developer build and gray in production.
	// If the file has color as described in the "Materialise Magics software"
	// then it will be reset. See: https://en.wikipedia.org/wiki/STL_(file_format)
	#color: IVector4 = ( ( DEVELOPER_BUILD ) ?
		ColorTool.makeRandomColor ( 0.2, 0.8 ) :
		[ 0.5, 0.5, 0.5, 1 ]
	);

	/**
	 * Construct the class.
	 * @abstract
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Get the color.
	 * @returns {IVector4} The color.
	 */
	public get color() : Readonly<IVector4>
	{
		return this.#color;
	}

	/**
	 * Set the color.
	 * @param {IVector4} color The color to set.
	 */
	public set color ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#color, color );
	}

	/**
	 * Allocate the array of points. We make a new one if it gets full, and we
	 * trim it when we are done if it is not full. The number of triangles is
	 * capped at STL_MAX_TRIANGLES_PER_GEOMETRY. There are no normals, because
	 * the triangles are drawn with flat shading, which does not need them.
	 * There are no indices either, because each point is used only once.
	 * @param {number} numTriangles The number of triangles.
	 * @returns {Float32Array} The array of point coordinates.
	 */
	protected static allocatePoints ( numTriangles: number ) : Float32Array
	{
		// Make sure the number makes sense.
		if ( ( false === Number.isInteger ( numTriangles ) ) || ( numTriangles < 0 ) )
		{
			throw new Error ( `Invalid number of triangles to allocate: ${numTriangles}` );
		}

		// Do not allocate more than one geometry can hold.
		numTriangles = Math.min ( numTriangles, STL_MAX_TRIANGLES_PER_GEOMETRY );

		// Three points per triangle, and three numbers per point.
		return new Float32Array ( numTriangles * 9 );
	}

	/**
	 * Build the scene from the array of points.
	 * @param {Float32Array} points The array of point coordinates.
	 * @param {number} pointCount The number of point coordinates used in the array.
	 * @returns {SceneNode} The scene node representing the STL file.
	 */
	protected buildScene ( points: Float32Array, pointCount: number ) : SceneNode
	{
		// Make sure we allocated enough space for the points.
		if ( pointCount > points.length )
		{
			throw new Error ( `Too many point coordinates, ${pointCount}, for allocated array of length ${points.length}` );
		}

		// Trim the array to the actual number of point coordinates. This copies
		// them into a smaller array, and the larger one is freed. A full array
		// is used as it is, which saves copying it.
		if ( pointCount < points.length )
		{
			points = points.slice ( 0, pointCount );
		}

		// The number of points should be evenly divisible by 9.
		if ( 0 !== ( points.length % 9 ) )
		{
			throw new Error ( `Number of point coordinates, ${points.length}, is not evenly divisible by 9` );
		}

		// The group that we return.
		const group = new Group();

		// The geometry for the triangles. It has no normals.
		const tris = new Geometry ( { points } );

		// Add the triangles.
		{
			// Make the primitives. There are no indices, so each point is used
			// once, in order. Every three points make a triangle.
			const topology = "triangle-list";
			const count = ( points.length / 3 );
			tris.primitives = new Arrays ( { topology, count } );

			// The color of the triangles.
			const color = this.color;

			// Add the state. Flat shading calculates the normals in the shader.
			const state = FlatShading.makeState ( { topology } );
			state.addAttribute ( new Color ( color ) );
			state.addAttribute ( new TwoSidedLight ( true ) );
			tris.state = state;

			// To speed things up later, calculate the bounds now.
			void tris.box;

			// Add the triangles to the scene.
			group.addChild ( tris );
		}

		// To speed things up later, calculate the bounds now.
		void group.bounds;

		// Return the group.
		return group;
	}
}
