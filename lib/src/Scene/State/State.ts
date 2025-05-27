
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

import { Base } from "../../Base";
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
	layer?: number;
	renderBin?: number;
}
export interface IApplyInput
{
	projMatrix: IMatrix44;
	modelMatrix: IMatrix44;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State extends Base
{
	#name: string = DEFAULT_STATE_NAME;
	#shaders: Shaders = new Shaders();
	#layer = 0;
	#renderBin = 0;

	/**
	 * Construct the class.
	 * @class
	 * @param {IStateInput | null | undefined} input - The constructor input object.
	 */
	constructor ( input?: IStateInput )
	{
		super();

		const { name, shaders, layer, renderBin } = ( input ?? {} );

		this.#name = ( name ?? DEFAULT_STATE_NAME );

		if ( shaders )
		{
			this.#shaders.vertex = shaders.vertex;
			this.#shaders.fragment = shaders.fragment;
		}

		if ( ( typeof layer ) === "number" )
		{
			// TODO: Why is the "!" needed when we explicitly check above?
			this.#layer = layer!;
		}

		if ( ( typeof renderBin ) === "number" )
		{
			// TODO: Why is the "!" needed when we explicitly check above?
			this.#renderBin = renderBin!;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "State";
	}

	/**
	 * Apply the state.
	 * @param {IApplyInput} input - The input for applying the state.
	 */
	public apply ( input: IApplyInput )
	{
		console.log ( `Applied state: ${this.name}, input: ${JSON.stringify ( input )}` );
	}

	/**
	 * Reset the state.
	 */
	public reset()
	{
		console.log ( `Reset state: ${this.name}` );
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
	 * @returns {number} The layer for this node.
	 */
	public get layer() : number
	{
		return this.#layer;
	}

	/**
	 * Set the layer.
	 * @param {number} layer - The new layer for this node.
	 */
	public set layer ( layer: number )
	{
		// Set the layer.
		this.#layer = layer;
	}

	/**
	 * Get the renderBin.
	 * @returns {number} The renderBin for this node.
	 */
	public get renderBin() : number
	{
		return this.#renderBin;
	}

	/**
	 * Set the renderBin.
	 * @param {number} renderBin - The new renderBin for this node.
	 */
	public set renderBin ( renderBin: number )
	{
		// Set the renderBin.
		this.#renderBin = renderBin;
	}
}
