///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The primitive class for when there are arrays but no indices.
//	The name is plural because, while it refers to only one array of points,
//	there are likely also normals, and maybe colors and texture coordinates.
//
///////////////////////////////////////////////////////////////////////////////

import { Draw as DrawVisitor } from "../../Visitors/Draw";
import {
	Base as BaseClass,
	type IPrimitivesInput,
} from "./Base";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IArrayPrimitivesInput extends IPrimitivesInput
{
	first: number;
	count: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Primitive arrays class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Arrays extends BaseClass
{
	#first = 0;
	#count = 0;

	/**
	 * Construct the class.
	 * @class
	 * @param {IPrimitivesInput} [input] - Input for the primitives.
	 * @param {GPUPrimitiveTopology} [input.mode] - The primitive topology mode.
	 * @param {number} [input.first] - The first index to draw.
	 * @param {number} [input.count] - The number of vertices to draw.
	 */
	constructor ( input?: IArrayPrimitivesInput )
	{
		super ( input );

		const { first = 0, count = 0 } = input || {};

		this.#first = first;
		this.#count = count;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Primitives.Arrays";
	}

	/**
	 * Accept the draw-visitor.
	 * @param {DrawVisitor} visitor - The visitor object.
	 */
	public override accept ( visitor: DrawVisitor ): void
	{
		visitor.visitArrays ( this );
	}

	/**
	 * Get the first index to draw.
	 * @returns {number} The first index.
	 */
	get first (): number
	{
		return this.#first;
	}

	/**
	 * Set the first index to draw.
	 * @param {number} first The first index.
	 */
	set first ( first: number )
	{
		if ( first < 0 )
		{
			throw new RangeError ( "The first index must be >= 0" );
		}
		this.#first = first;
	}

	/**
	 * Get the number of vertices to draw.
	 * @returns {number} The number of vertices.
	 */
	get count (): number
	{
		return this.#count;
	}

	/**
	 * Set the number of vertices to draw.
	 * @param {number} count The number of vertices.
	 */
	set count ( count: number )
	{
		if ( count < 0 )
		{
			throw new RangeError ( "The count must be >= 0" );
		}
		this.#count = count;
	}
}
