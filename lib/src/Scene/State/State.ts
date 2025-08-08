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
import { ShaderBase } from "../../Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants used below.
//
///////////////////////////////////////////////////////////////////////////////

const DEFAULT_STATE_NAME = "default_state";


///////////////////////////////////////////////////////////////////////////////
//
//	The input for the constructor.
//
///////////////////////////////////////////////////////////////////////////////

export interface IStateConstructorInput
{
	name?: string;
	shader?: ShaderBase;
	layer?: number;
	renderBin?: number;
}
export interface IStateApplyInput
{
	state: State;
	projMatrix: IMatrix44;
	modelMatrix: IMatrix44;
}
export type IStateResetInput = IStateApplyInput;
export type IStateApplyFunction = ( ( input: IStateApplyInput ) => void );
export type IStateResetFunction = ( ( input: IStateResetInput ) => void );


///////////////////////////////////////////////////////////////////////////////
/**
 * The function that applies the state.
 * @param {IStateApplyInput} input - The input for applying the state.
 * @returns {void}
 */
///////////////////////////////////////////////////////////////////////////////

export const defaultApplyFunction: IStateApplyFunction = ( input: IStateApplyInput ) =>
{
	console.log ( `Default state apply function called with name: '${input.state.name}', projMatrix: ${JSON.stringify ( input.projMatrix )}, modelMatrix: ${JSON.stringify ( input.modelMatrix )}` );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * The default reset function.
 * @returns {void}
 */
///////////////////////////////////////////////////////////////////////////////

export const defaultResetFunction: IStateResetFunction = () =>
{
	console.log ( "Default state reset function called" );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State extends Base
{
	#name: string = DEFAULT_STATE_NAME;
	#shader: ( ShaderBase | null ) = null;
	#layer = 0;
	#renderBin = 0;
	#apply: IStateApplyFunction = defaultApplyFunction;
	#reset: IStateResetFunction = defaultResetFunction;

	/**
	 * Construct the class.
	 * @class
	 * @param {IStateConstructorInput | null | undefined} input - The constructor input object.
	 */
	constructor ( input?: IStateConstructorInput )
	{
		super();

		const { name, shader, layer, renderBin } = ( input ?? {} );

		if ( name )
		{
			this.#name = name;
		}

		if ( shader )
		{
			this.#shader = shader;
		}

		// This is false when the value is zero, but it's already that.
		if ( layer )
		{
			this.#layer = layer;
		}

		// This is false when the value is zero, but it's already that.
		if ( renderBin )
		{
			this.#renderBin = renderBin;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.State.State";
	}

	/**
	 * Set the apply function.
	 * @param {IStateApplyFunction} apply - The function that applies the state.
	 */
	public set apply ( apply: IStateApplyFunction )
	{
		this.#apply = apply;
	}

	/**
	 * Get the apply function.
	 * @returns {IStateApplyFunction} The function that applies the state.
	 */
	public get apply() : IStateApplyFunction
	{
		return this.#apply;
	}

	/**
	 * Call the apply function.
	 * @param {IStateApplyInput} input - The input for applying the state.
	 */
	public doApply ( input: IStateApplyInput ) : void
	{
		this.#apply ( input );
	}

	/**
	 * Set the reset function.
	 * @param {IStateResetFunction} reset - The function that resets the state.
	 */
	public set reset ( reset: IStateResetFunction )
	{
		this.#reset = reset;
	}

	/**
	 * Get the reset function.
	 * @returns {IStateResetFunction} The function that resets the state.
	 */
	public get reset() : IStateResetFunction
	{
		return this.#reset;
	}

	/**
	 * Call the reset function.
	 * @param {IStateResetInput} input - The input for resetting the state.
	 */
	public doReset ( input: IStateResetInput ) : void
	{
		this.#reset ( input );
	}

	/**
	 * Get the shader.
	 * @returns {ShaderBase | null} The shader object, or null if not set.
	 */
	public get shader() : ( ShaderBase | null )
	{
		return this.#shader;
	}

	/**
	 * Set the shader.
	 * @param {ShaderBase | null} shader - The shader object, or null.
	 */
	public set shader ( shader: ( ShaderBase | null ) )
	{
		this.#shader = shader;
	}

	/**
	 * Get the state name.
	 * @returns {string} The name of this state object.
	 */
	public get name() : string
	{
		return this.#name;
	}

	/**
	 * Set the state name.
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
		this.#renderBin = renderBin;
	}
}
