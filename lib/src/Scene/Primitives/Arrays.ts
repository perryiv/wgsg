
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Primitive list class that uses arrays.
//
///////////////////////////////////////////////////////////////////////////////

import { Primitives } from "./Primitives";


///////////////////////////////////////////////////////////////////////////////
/**
 * Primitive arrays class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Arrays extends Primitives
{
	#first = 0;
	#count = 0;

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
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
