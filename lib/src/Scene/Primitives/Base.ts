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

import { Base as BaseClass } from "../../Base/Base";
import { Draw as DrawVisitor } from "../../Visitors/Draw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPrimitivesInput
{
	topology: GPUPrimitiveTopology;
}
export type IForEachIndexCallback = ( index: number, i: number ) => void;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base primitive list class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Base extends BaseClass
{
	#topology: GPUPrimitiveTopology = "point-list";

	/**
	 * Construct the class.
	 * @class
	 * @param {IPrimitivesInput} [input] - Input for the primitives.
	 * @param {GPUPrimitiveTopology} [input.topology] - The primitive topology mode.
	 */
	constructor ( input?: IPrimitivesInput )
	{
		// Call this first.
		super();

		// Is there input?
		if ( input?.topology )
		{
			this.#topology = input.topology;
		}
	}

	/**
	 * Reset the primitive list.
	 */
	public reset() : void
	{
		// Do nothing here.
	}

	/**
	 * Get the topology.
	 * @returns {GPUPrimitiveTopology} The topology.
	 */
	get topology(): GPUPrimitiveTopology
	{
		return this.#topology;
	}

	/**
	 * Set the topology.
	 * @param {GPUPrimitiveTopology} topology The topology.
	 */
	set topology ( topology: GPUPrimitiveTopology )
	{
		this.#topology = topology;
	}

	/**
	 * Accept the draw-visitor.
	 * @param {DrawVisitor} visitor - The visitor object.
	 */
	public abstract accept ( _: DrawVisitor ): void;

	/**
	 * Loop through all the indices.
	 * @param {IForEachIndexCallback} func - The function to call for each index.
	 */
	public abstract forEachIndex ( func: IForEachIndexCallback ) : void;
}
