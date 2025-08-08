///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The primitive class for when there are indices.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../Arrays";
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

export type IIndexArray = Array1 < Uint32Array | Uint16Array >;
export interface IIndexedPrimitivesInput extends IPrimitivesInput
{
	indices: ( IIndexArray | Uint32Array | Uint16Array );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Primitive indexed class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Indexed extends BaseClass
{
	#indices: ( IIndexArray | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IIndexedInput} [input] - Input for the constructor.
	 * @param {GPUPrimitiveTopology} [input.mode] - The primitive topology mode.
	 * @param {IIndexType} [input.indices] - The
	 */
	constructor ( input?: IIndexedPrimitivesInput )
	{
		// Call this first.
		super ( input );

		const { indices } = input || {};

		// Is there input?
		if ( indices )
		{
			this.indices = indices;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Primitives.Indexed";
	}

	/**
	 * Accept the draw-visitor.
	 * @param {DrawVisitor} visitor - The visitor object.
	 */
	public override accept ( visitor: DrawVisitor ): void
	{
		visitor.visitIndexed ( this );
	}

	/**
	 * Get the indices.
	 * @returns {IIndexArray} | null The indices.
	 */
	get indices (): ( IIndexArray | null )
	{
		return this.#indices;
	}

	/**
	 * Set the indices.
	 * @param {IIndexArray | Uint32Array | Uint16Array | null} indices The indices.
	 */
	set indices ( indices: ( IIndexArray | Uint32Array | Uint16Array | null ) )
	{
		// Wrap it if we should.
		if ( indices instanceof Uint32Array || indices instanceof Uint16Array )
		{
			indices = new Array1 ( indices );
		}

		// Do not copy. These arrays can be shared.
		this.#indices = indices;
	}

	/**
	 * Get the number of indices.
	 * @returns {number} The number of indices.
	 */
	get numIndices (): number
	{
		const indices = this.#indices;
		return ( indices ? indices.length : 0 );
	}

	/**
	 * Get the index type.
	 * @returns {GPUIndexFormat} The index type.
	 */
	get indexType (): GPUIndexFormat
	{
		// Shortcut.
		const indices = this.#indices?.values;

		// Handle no indices.
		if ( !indices )
		{
			throw new Error ( "No indices when getting type" );
		}

		// Return the correct type.
		switch ( indices.BYTES_PER_ELEMENT )
		{
			case 2: return "uint16";
			case 4: return "uint32";
			default: throw new Error ( "Unknown index type" );
		}
	}
}
