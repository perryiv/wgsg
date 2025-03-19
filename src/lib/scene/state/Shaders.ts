
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	A pair of shaders.
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
/**
 * A pair of shaders.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Shaders
{
	#vertex: string;
	#fragment: string;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {string} vertex - Vertex shader string.
	 * @param {string} fragment - Fragment shader string.
	 */
	constructor ( vertex: string, fragment: string )
	{
		this.#vertex = vertex;
		this.#fragment = fragment;
	}

	/**
	 * Get the vertex shader.
	 * @return {string | null} Vertex shader string.
	 */
	public get vertexShader() : ( string | null )
	{
		return this.#vertex;
	}

	/**
	 * Get the fragment shader.
	 * @return {string | null} Fragment shader string.
	 */
	public get fragmentShader() : ( string | null )
	{
		return this.#fragment;
	}
}
