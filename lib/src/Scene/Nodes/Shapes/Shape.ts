
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all shapes.
//
///////////////////////////////////////////////////////////////////////////////

import { Node } from "../Node";
import { State } from "../../State";


///////////////////////////////////////////////////////////////////////////////
/**
 * Shape class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Shape extends Node
{
	#state: ( State | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {State | null} state - Optional state for this shape.
	 */
	constructor ( state?: ( State | null ) )
	{
		super();
		this.#state = ( state ?? null );
	}

	/**
	 * Get the state.
	 * @returns {State | null} State for this shape.
	 */
	public get state() : ( State | null )
	{
		return this.#state;
	}

	/**
	 * Set the state.
	 * @param {State | null} state - State for this shape.
	 */
	public set state ( state: ( State | null ) )
	{
		this.#state = state;
	}

	/**
	 * Draw the shape.
	 */
	public abstract draw() : void;
}
