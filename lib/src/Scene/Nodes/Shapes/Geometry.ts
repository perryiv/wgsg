///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	General geometry class.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1, Array3 } from "../../../Arrays";
import { Arrays, Indexed } from "../../Primitives";
import { Box } from "../../../Math";
import { getNumElements } from "../../../Tools";
import { Shape } from "./Shape";
import { Visitor } from "../../../Visitors";
import type { INodeConstructorInput } from "../Node";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IPointData     = Array1 < Float32Array >;
export type INormalData    = Array1 < Float32Array >;
export type IColorData     = Array1 < Float32Array >;
export type ITexCoordData  = Array1 < Float32Array >;
export type IPrimitiveList = Indexed | Arrays;
export interface IGeometryConstructorInput extends INodeConstructorInput
{
	points?:     ( IPointData     | Float32Array | number[] | null );
	normals?:    ( INormalData    | Float32Array | number[] | null );
	colors?:     ( IColorData     | Float32Array | number[] | null );
	texCoords?:  ( ITexCoordData  | Float32Array | number[] | null );
	primitives?: ( IPrimitiveList | IPrimitiveList[] | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Geometry class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Geometry extends Shape
{
	#points:     ( IPointData       | null ) = null;
	#normals:    ( INormalData      | null ) = null;
	#colors:     ( IColorData       | null ) = null;
	#texCoords:  ( ITexCoordData    | null ) = null;
	#primitives: ( IPrimitiveList[] | null ) = null;
	#bounds:     ( Box              | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IGeometryConstructorInput} [input] - The input for the node.
	 */
	constructor ( input?: IGeometryConstructorInput )
	{
		super ( input );

		const { points, normals, colors, texCoords, primitives } = ( input ?? {} );

		if ( points )
		{
			this.points = points;
		}

		if ( normals )
		{
			this.normals = normals;
		}

		if ( colors )
		{
			this.colors = colors;
		}

		if ( texCoords )
		{
			this.texCoords = texCoords;
		}

		if ( primitives )
		{
			this.primitives = primitives;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Nodes.Shapes.Geometry";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public override accept ( visitor: Visitor ): void
	{
		visitor.visitGeometry ( this );
	}

	/**
	 * Get the bounds of this node.
	 * @returns {Box} The bounds of this node.
	 */
	protected override getBounds() : Box
	{
		// Shortcut.
		const current = this.#bounds;

		// Return the bounding box if it is valid.
		if ( ( current ) && ( true === current.valid ) )
		{
			return current;
		}

		// Make a new bounds.
		const answer = new Box();

		// Are there any points?
		if ( this.#points?.values )
		{
			// Make the helper array wrapper.
			const points = new Array3 ( this.#points.values );

			// Shortcuts.
			// TODO: Why is the "as" needed here?
			const x = ( points.x0 as Float32Array );
			const y = ( points.x1 as Float32Array );
			const z = ( points.x2 as Float32Array );
			const numVectors = points.numVectors;

			// Grow the box by all the points.
			answer.growByPoints ( numVectors, x, y, z );

			// We save the answer for next time here, inside the "if" block,
			// to keep from storing an invalid bounding box.
			this.#bounds = answer;
		}

		// Return the answer.
		return answer;
	}

	/**
	 * Set the bounds of this node.
	 * @param {Box | null} bounds - The new bounds of this node.
	 */
	protected override setBounds ( bounds: Box | null ): void
	{
		// If we were given a box then clone it.
		// Otherwise, make a new default box.
		// Note: We can clone an invalid box, but not a null box.
		this.#bounds = ( bounds ? bounds.clone() : new Box() );

		// Let the parents know that their bounds are now invalid.
		this.forEachParent ( ( parent ) =>
		{
			parent.bounds = null;
		} );
	}

	/**
	 * Get the points.
	 * @returns {IPointData | null} Points for this geometry.
	 */
	public get points() : IPointData | null
	{
		// Do not return a copy. These arrays can be shared.
		return this.#points;
	}

	/**
	 * Set the points.
	 * @param {IPointData | Float32Array | null} points - Points for this geometry.
	 */
	public set points ( points: ( IPointData | Float32Array | number[] | null ) )
	{
		// Convert it if we should.
		if ( Array.isArray ( points ) )
		{
			points = new Float32Array ( points );
		}

		// Wrap it if we should.
		if ( points instanceof Float32Array )
		{
			points = new Array1 ( points );
		}

		// Do not make a copy. These arrays can be shared.
		this.#points = points;
	}

	/**
	 * Get the normal vectors.
	 * @returns {INormalData | null} Normal vectors for this geometry.
	 */
	public get normals() : ( INormalData | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#normals;
	}

	/**
	 * Set the normals.
	 * @param {INormalData | Float32Array | null} normals - Normal vectors for this geometry.
	 */
	public set normals ( normals: ( INormalData | Float32Array | number[] | null ) )
	{
		// Convert it if we should.
		if ( Array.isArray ( normals ) )
		{
			normals = new Float32Array ( normals );
		}

		// Wrap it if we should.
		if ( normals instanceof Float32Array )
		{
			normals = new Array1 ( normals );
		}

		// Do not make a copy. These arrays can be shared.
		this.#normals = normals;
	}

	/**
	 * Get the colors.
	 * @returns {IColorData | null} Colors for this geometry.
	 */
	public get colors() : ( IColorData | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#colors;
	}

	/**
	 * Set the colors.
	 * @param {IColorData | Float32Array | null} colors - Colors for this geometry.
	 */
	public set colors ( colors: ( IColorData | Float32Array | number[] | null ) )
	{
		// Convert it if we should.
		if ( Array.isArray ( colors ) )
		{
			colors = new Float32Array ( colors );
		}

		// Wrap it if we should.
		if ( colors instanceof Float32Array )
		{
			colors = new Array1 ( colors );
		}

		// Do not make a copy. These arrays can be shared.
		this.#colors = colors;
	}

	/**
	 * Get the texture coordinates.
	 * @returns {ITexCoordData | null} Texture coordinates for this geometry.
	 */
	public get texCoords() : ( ITexCoordData | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#texCoords;
	}

	/**
	 * Set the texture coordinates.
	 * @param {ITexCoordData | Float32Array | null} texCoords - Texture coordinates for this geometry.
	 */
	public set texCoords ( texCoords: ( ITexCoordData | Float32Array | number[] | null ) )
	{
		// Convert it if we should.
		if ( Array.isArray ( texCoords ) )
		{
			texCoords = new Float32Array ( texCoords );
		}

		// Wrap it if we should.
		if ( texCoords instanceof Float32Array )
		{
			texCoords = new Array1 ( texCoords );
		}

		// Do not make a copy. These arrays can be shared.
		this.#texCoords = texCoords;
	}

	/**
	 * Get the primitives.
	 * @returns {IPrimitiveList[] | null} The primitives for this geometry.
	 */
	public get primitives() : ( IPrimitiveList[] | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#primitives;
	}

	/**
	 * Set the primitives.
	 * @param {IPrimitiveList | IPrimitiveList[] | null} primitives - The primitives for this geometry.
	 */
	public set primitives ( primitives: ( IPrimitiveList | IPrimitiveList[] | null ) )
	{
		// If we were given a single primitive then make it an array.
		if ( ( primitives instanceof Indexed ) || ( primitives instanceof Arrays ) )
		{
			primitives = [ primitives ];
		}

		// Do not make a copy. These arrays can be shared.
		this.#primitives = primitives;
	}

	/**
	 * Get the number of points.
	 * @returns {number} The number of points in this geometry.
	 */
	public get numPoints() : number
	{
		return getNumElements ( this.points, 3 );
	}

	/**
	 * Get the number of normals.
	 * @returns {number} The number of normals in this geometry.
	 */
	public get numNormals() : number
	{
		return getNumElements ( this.normals, 3 );
	}

	/**
	 * Get the number of colors.
	 * @returns {number} The number of colors in this geometry.
	 */
	public get numColors() : number
	{
		return getNumElements ( this.colors, 4 );
	}

	/**
	 * Get the number of texture coordinates.
	 * @returns {number} The number of texture coordinates in this geometry.
	 */
	public get numTexCoords() : number
	{
		return getNumElements ( this.texCoords, 2 );
	}

	/**
	 * Get the number of primitives.
	 * @returns {number} The number of primitives in this geometry.
	 */
	public get numPrimitives() : number
	{
		const primitives = this.primitives;
		return ( primitives ? primitives.length : 0 );
	}

	/**
	 * Update this node.
	 */
	public override update() : void
	{
		// There is nothing to do here.
	}
}
