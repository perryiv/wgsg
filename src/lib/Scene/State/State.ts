
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

import { ShaderPair } from "./ShaderPair";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State
{
	#shaders: ( ShaderPair | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {ShaderPair | null} shaders - Vertex and fragment shaders.
	 */
	constructor ( shaders?: ( ShaderPair | null ) )
	{
		this.#shaders = ( shaders ?? null );
	}

	/**
	 * Get the shaders.
	 * @return {ShaderPair | null} Vertex and fragment shaders.
	 */
	public get shaders() : ( ShaderPair | null )
	{
		return this.#shaders;
	}

	/**
	 * Set the shaders.
	 * @param {ShaderPair | null} shaders - Vertex and fragment shaders.
	 */
	public set shaders ( shaders: ( ShaderPair | null ) )
	{
		this.#shaders = ( shaders ?? null );
	}
}
