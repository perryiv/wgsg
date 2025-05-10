
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
 * The input for the constructor.
 */
///////////////////////////////////////////////////////////////////////////////

export interface IShaders
{
	vertex: ( string | null );
	fragment: ( string | null );
}

export interface IStateInput
{
	name?: ( string | null );
	shaders?: ( IShaders | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State
{
	#name: ( string | null ) = null;
	#shaders: Shaders = new Shaders();

	/**
	 * Construct the class.
	 * @constructor
	 * @param {IStateInput | null | undefined} input - The constructor input object.
	 */
	constructor ( input?: IStateInput )
	{
		if ( !input )
		{
			return;
		}

		const { name, shaders } = input;

		this.#name = ( name ?? null );

		if ( shaders )
		{
			this.#shaders.vertex = shaders.vertex;
			this.#shaders.fragment = shaders.fragment;
		}
	}

	/**
	 * Get the shader pair.
	 * @return {Shaders} Shader pair.
	 */
	public get shaders() : Shaders
	{
		return this.#shaders;
	}

	/**
	 * Get the name.
	 * @return {string | null} Unique name of this state object, or null.
	 */
	public get name() : ( string | null )
	{
		return this.#name;
	}

	/**
	 * Set the name.
	 *
	 * @param {string | null} name - Unique name of this state object, or null.
	 */
	public set name ( name: ( string | null ) )
	{
		this.#name = name;
	}
}
