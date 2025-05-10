
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Class that contains the vertex and fragment shaders.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the vertex and fragment shaders.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Shaders
{
	#v: ( string | null ) = null;
	#f: ( string | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {string | null} [vertex] - Vertex shader string.
	 * @param {string | null} [fragment] - Fragment shader string.
	 */
	constructor ( vertex?: ( string | null ), fragment?: ( string | null ) )
	{
		this.#v = ( vertex ?? null );
		this.#f = ( fragment ?? null );
	}

	/**
	 * Get the vertex shader.
	 * @return {string | null} Vertex shader string, or null.
	 */
	public get vertex() : ( string | null )
	{
		return this.#v;
	}

	/**
	 * Set the vertex shader.
	 *
	 * @param {string | null} v - Vertex shader string, or null.
	 */
	public set vertex ( v: ( string | null ) )
	{
		this.#v = v;
	}

	/**
	 * Get the fragment shader.
	 * @return {string | null} Fragment shader string, or null.
	 */
	public get fragment() : ( string | null )
	{
		return this.#f;
	}

	/**
	 * Set the fragment shader.
	 *
	 * @param {string | null} f - Fragment shader string, or null.
	 */
	public set fragment ( f: ( string | null ) )
	{
		this.#f = f;
	}
}
