
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Primitive list class that uses indices.
//
///////////////////////////////////////////////////////////////////////////////

import { IPrimitivesInput, Primitives } from "./Primitives";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IElementsInput extends IPrimitivesInput
{
	indices: ( Uint32Array | Uint16Array );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Primitive elements class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Elements extends Primitives
{
	#indices: ( Uint32Array | Uint16Array | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IElementsInput} [input] - Input for the elements.
	 * @param {GPUPrimitiveTopology} [input.mode] - The primitive topology mode.
	 * @param {Uint32Array | Uint16Array} [input.indices] - The
	 */
	constructor ( input ?: IElementsInput )
	{
		// Call this first.
		super ( input );

		// Is there input?
		if ( input?.indices )
		{
			this.indices = input.indices;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Primitives.Elements";
	}

	/**
	 * Get the indices.
	 * @returns {Uint32Array | Uint16Array} The indices.
	 */
	get indices (): Uint32Array | Uint16Array
	{
		let indices = this.#indices;
		if ( !indices )
		{
			indices = new Uint32Array ( 0 );
			this.#indices = indices;
		}
		return indices;
	}

	/**
	 * Set the indices.
	 * @param {Uint32Array | Uint16Array} indices The indices.
	 */
	set indices ( indices: Uint32Array | Uint16Array )
	{
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
}
