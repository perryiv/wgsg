
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

import { State } from "../../State/State";


///////////////////////////////////////////////////////////////////////////////
/**
 * Shape class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Shape
{
	#state: ( State | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {State | null} state - State for this shape.
	 */
	constructor ( state?: ( State | null ) )
	{
		this.#state = ( state ?? null );
	}

	/**
	 * Get the state.
	 * @return {State | null} State for this shape.
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
		this.#state = ( state ?? null );
	}
}
