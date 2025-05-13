
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

import { IMatrix44 } from "../../Types";
import { Shaders } from "./Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants used below.
//
///////////////////////////////////////////////////////////////////////////////

const DEFAULT_STATE_NAME = "default_state";


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
	#name: string = DEFAULT_STATE_NAME;
	#shaders: Shaders = new Shaders();
	#layer = 0;
	#clipped = true;

	/**
	 * Construct the class.
	 * @class
	 * @param {IStateInput | null | undefined} input - The constructor input object.
	 */
	constructor ( input?: IStateInput )
	{
		if ( !input )
		{
			return;
		}

		const { name, shaders } = input;

		this.#name = ( name ?? DEFAULT_STATE_NAME );

		if ( shaders )
		{
			this.#shaders.vertex = shaders.vertex;
			this.#shaders.fragment = shaders.fragment;
		}
	}

	/**
	 * Apply the state.
	 */
	public apply()
	{
		console.log ( `Applied state: ${this.name}` );
	}

	/**
	 * Reset the state.
	 */
	public reset()
	{
		console.log ( `Reset state: ${this.name}` );
	}

	/**
	 * Try to set the projection matrix. It will depend on the shaders.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public set projMatrix ( matrix: IMatrix44 )
	{
		console.log ( "Setting projection matrix:", matrix );
	}

	/**
	 * Try to set the model matrix. It will depend on the shaders.
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	public set modelMatrix ( matrix: IMatrix44 )
	{
		console.log ( "Setting model matrix:", matrix );
	}

	/**
	 * Get the shader pair.
	 * @returns {Shaders} Shader pair.
	 */
	public get shaders() : Shaders
	{
		return this.#shaders;
	}

	/**
	 * Get the name.
	 * @returns {string | null} The name of this state object, or null.
	 */
	public get name() : string
	{
		return this.#name;
	}

	/**
	 * Set the name.
	 * @param {string | null} name - The name of this state object, or null.
	 */
	public set name ( name: ( string | null ) )
	{
		this.#name = ( name ?? DEFAULT_STATE_NAME );
	}

	/**
	 * Get the layer.
	 * @returns {number} layer for this shape.
	 */
	public get layer() : number
	{
		return this.#layer;
	}

	/**
	 * Set the layer.
	 * @param {number} layer - layer for this shape.
	 */
	public set layer ( layer: number )
	{
		this.#layer = layer;
	}

	/**
	 * Get the clipped state.
	 * @returns {boolean} clipped state for this shape.
	 */
	public get clipped() : boolean
	{
		return this.#clipped;
	}

	/**
	 * Set the clipped state.
	 * @param {boolean} clipped - clipped state for this shape.
	 */
	public set clipped ( clipped: boolean )
	{
		this.#clipped = clipped;
	}
}
