
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Class that contains the state of a shape.
//
///////////////////////////////////////////////////////////////////////////////

import { Shaders } from "./Shaders";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State
{
	#shaders: ( Shaders | null ) = null;

	/**
	 * Construct the class.
	 * @param {Shaders | null} shaders - Vertex and fragment shaders.
	 */
	constructor ( shaders?: ( Shaders | null ) )
	{
		this.#shaders = ( shaders ?? null );
	}

	/**
	 * Get the shaders.
	 * @return {Shaders | null} Vertex and fragment shaders.
	 */
	public get shaders() : ( Shaders | null )
	{
		return this.#shaders;
	}

	/**
	 * Set the shaders.
	 * @param {Shaders | null} shaders - Vertex and fragment shaders.
	 */
	public set shaders ( shaders: ( Shaders | null ) )
	{
		this.#shaders = ( shaders ?? null );
	}
}
