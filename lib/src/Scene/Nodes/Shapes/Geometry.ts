
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

import { Box } from "../../../Math";
import { Shape } from "./Shape";
import { State } from "../../State";
import { Visitor } from "../../../Visitors";
import { Node } from "../Node";
import { Array3 } from "../../../Arrays";
import { Primitives } from "../../Primitives";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type PointArray    = Float32Array;
export type NormalArray   = Float32Array;
export type ColorArray    = Float32Array;
export type TexCoordArray = Float32Array;


///////////////////////////////////////////////////////////////////////////////
/**
 * Geometry class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Geometry extends Shape
{
	#points:     ( PointArray    | null ) = null;
	#normals:    ( NormalArray   | null ) = null;
	#colors:     ( ColorArray    | null ) = null;
	#texCoords:  ( TexCoordArray | null ) = null;
	#primitives: ( Primitives[]  | null ) = null;
	#bounds: Box = new Box();

	/**
	 * Construct the class.
	 * @class
	 * @param {State | null} state - Optional state for this geometry.
	 */
	constructor ( state?: ( State | null ) )
	{
		super ( state );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Scene.Nodes.Shapes.Geometry";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public accept ( visitor: Visitor ): void
	{
		visitor.visitGeometry ( this );
	}

	/**
	 * Get the bounds of this node.
	 * @returns {Box} The bounds of this node.
	 */
	protected getBounds() : Box
	{
		// Return the bounding box if it is valid.
		if ( true === this.#bounds.valid )
		{
			return this.#bounds;
		}

		// Make a new bounds.
		const answer = new Box();

		// Are there any points?
		if ( this.#points )
		{
			// Make the helper array wrapper.
			const points = new Array3 ( this.#points );

			// Shortcuts.
			// TODO: Why is the "as" needed here?
			const x = ( points.x0 as PointArray );
			const y = ( points.x1 as PointArray );
			const z = ( points.x2 as PointArray );
			const numVectors = points.numVectors;

			// Grow the box by all the points.
			answer.growByPoints ( numVectors, x, y, z );
		}

		// Save the answer for next time.
		this.#bounds = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Set the bounds of this node.
	 * @param {Box | null} bounds - The new bounds of this node.
	 */
	protected setBounds ( bounds: Box | null ): void
	{
		// If we were given a box then clone it.
		// Otherwise, make a new default box.
		// Note: We can clone an invalid box, but not a null box.
		this.#bounds = ( bounds ? bounds.clone() : new Box() );

		// Let the parents know that their bounds are now invalid.
		this.forEachParent ( ( parent: Node ) =>
		{
			parent.bounds = null;
		} );
	}

	/**
	 * Get the points.
	 * @returns {PointArray | null} Points for this geometry.
	 */
	public get points() : ( PointArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#points;
	}

	/**
	 * Set the points.
	 * @param {PointArray | null} points - Points for this geometry.
	 */
	public set points ( points: ( PointArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#points = points;
	}

	/**
	 * Get the normal vectors.
	 * @returns {NormalArray | null} Normal vectors for this geometry.
	 */
	public get normals() : ( NormalArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#normals;
	}

	/**
	 * Set the normals.
	 * @param {NormalArray | null} normals - Normal vectors for this geometry.
	 */
	public set normals ( normals: ( NormalArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#normals = normals;
	}

	/**
	 * Get the colors.
	 * @returns {ColorArray | null} Colors for this geometry.
	 */
	public get colors() : ( ColorArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#colors;
	}

	/**
	 * Set the colors.
	 * @param {ColorArray | null} colors - Colors for this geometry.
	 */
	public set colors ( colors: ( ColorArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#colors = colors;
	}

	/**
	 * Get the texture coordinates.
	 * @returns {TexCoordArray | null} Texture coordinates for this geometry.
	 */
	public get texCoords() : ( TexCoordArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#texCoords;
	}

	/**
	 * Set the texture coordinates.
	 * @param {TexCoordArray | null} texCoords - Texture coordinates for this geometry.
	 */
	public set texCoords ( texCoords: ( TexCoordArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#texCoords = texCoords;
	}

	/**
	 * Get the primitives.
	 * @returns {Primitives[] | null} The primitives for this geometry.
	 */
	public get primitives() : ( Primitives[] | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#primitives;
	}

	/**
	 * Set the primitives.
	 * @param {Primitives[] | null} primitives - The primitives for this geometry.
	 */
	public set primitives ( primitives: ( Primitives[] | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#primitives = primitives;
	}

	/**
	 * Draw the shape.
	 */
	public draw() : void
	{
		console.log ( `Drawing ${this.type} ${this.id}` );
	}
}
