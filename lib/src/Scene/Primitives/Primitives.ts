
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all primitive lists.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../../Base/Base";
import { Draw as DrawVisitor } from "../../Visitors/Draw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPrimitivesInput
{
	mode: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Base primitive list class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Primitives extends Base
{
	#mode: GPUPrimitiveTopology = "point-list";

	/**
	 * Construct the class.
	 * @class
	 * @param {IPrimitivesInput} [input] - Input for the primitives.
	 * @param {GPUPrimitiveTopology} [input.mode] - The primitive topology mode.
	 */
	constructor ( input ?: IPrimitivesInput )
	{
		// Call this first.
		super();

		// Is there input?
		if ( input?.mode )
		{
			this.#mode = input.mode;
		}
	}

	/**
	 * Get the mode.
	 * @returns {GPUPrimitiveTopology} The mode.
	 */
	get mode(): GPUPrimitiveTopology
	{
		return this.#mode;
	}

	/**
	 * Set the mode.
	 * @param {GPUPrimitiveTopology} mode The mode.
	 */
	set mode ( mode: GPUPrimitiveTopology )
	{
		this.#mode = mode;
	}

	/**
	 * Accept the draw-visitor.
	 * @param {DrawVisitor} visitor - The visitor object.
	 */
	public abstract accept ( _: DrawVisitor ): void;
}
