
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../../Base";

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

export class Shaders extends Base
{
	#v: ( string | null ) = null;
	#f: ( string | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {string | null} [vertex] - Vertex shader string.
	 * @param {string | null} [fragment] - Fragment shader string.
	 */
	constructor ( vertex?: ( string | null ), fragment?: ( string | null ) )
	{
		super();
		this.#v = ( vertex ?? null );
		this.#f = ( fragment ?? null );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Render.Shaders";
	}

	/**
	 * Get the vertex shader.
	 * @returns {string | null} Vertex shader string, or null.
	 */
	public get vertex() : ( string | null )
	{
		return this.#v;
	}

	/**
	 * Set the vertex shader.
	 * @param {string | null} v - Vertex shader string, or null.
	 */
	public set vertex ( v: ( string | null ) )
	{
		this.#v = v;
	}

	/**
	 * Get the fragment shader.
	 * @returns {string | null} Fragment shader string, or null.
	 */
	public get fragment() : ( string | null )
	{
		return this.#f;
	}

	/**
	 * Set the fragment shader.
	 * @param {string | null} f - Fragment shader string, or null.
	 */
	public set fragment ( f: ( string | null ) )
	{
		this.#f = f;
	}
}
