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
	type IForEachIndexCallback,
	type IPrimitivesInput,
} from "./Base";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IArrayPrimitivesInput extends IPrimitivesInput
{
	first?: number;
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
	 * @param {IArrayPrimitivesInput} [input] - Input for the primitives.
	 * @param {GPUPrimitiveTopology} [input.topology] - The primitive topology.
	 * @param {number} [input.first] - The first vertex to draw.
	 * @param {number} [input.count] - The number of vertices to draw.
	 */
	constructor ( input?: IArrayPrimitivesInput )
	{
		super ( input );

		// Use the setters so that the values are checked.
		const { first = 0, count = 0 } = ( input ?? {} );
		this.first = first;
		this.count = count;
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
	 * Reset the indexed primitive list.
	 */
	public override reset() : void
	{
		super.reset();
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
	 * Get the first vertex to draw.
	 * @returns {number} The first vertex.
	 */
	get first (): number
	{
		return this.#first;
	}

	/**
	 * Set the first vertex to draw.
	 * These primitives do not know which geometries use them, so call their
	 * dirtyBounds() afterwards.
	 * @param {number} first The first vertex.
	 */
	set first ( first: number )
	{
		if ( ( false === Number.isInteger ( first ) ) || ( first < 0 ) )
		{
			throw new RangeError ( `The first vertex must be an integer >= 0, not ${first}` );
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
	 * These primitives do not know which geometries use them, so call their
	 * dirtyBounds() afterwards.
	 * @param {number} count The number of vertices.
	 */
	set count ( count: number )
	{
		if ( ( false === Number.isInteger ( count ) ) || ( count < 0 ) )
		{
			throw new RangeError ( `The count must be an integer >= 0, not ${count}` );
		}
		this.#count = count;
	}

	/**
	 * Loop through all the indices.
	 * @param {IForEachIndexCallback} func - The function to call for each index.
	 */
	public override forEachIndex ( func: IForEachIndexCallback ) : void
	{
		const first = this.#first;
		const count = this.#count;

		for ( let i = 0; i < count; ++i )
		{
			func ( first + i, i );
		}
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		// Get the base class's JSON.
		const base = super.toJSON();

		// Return the object that represents this class.
		return {
			...base,
			first: this.#first,
			count: this.#count
		};
	}
}
