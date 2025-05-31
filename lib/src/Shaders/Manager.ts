
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader manager class.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IShaderMap = Map < string, GPUShaderModule >;


///////////////////////////////////////////////////////////////////////////////
//
//	The singleton instance of the shader manager.
//
///////////////////////////////////////////////////////////////////////////////

let sm: ( Manager | null ) = null;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that managed all the shaders.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Manager extends Base
{
	#shaders: IShaderMap = new Map < string, GPUShaderModule >();

	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Static method to return the singleton instance of the shader manager.
	 * @returns {Manager} The shader manager instance.
	 */
	public static get instance() : Manager
	{
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if ( !sm )
		{
			sm = new Manager();
		}

		return sm;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Shaders.Manager";
	}

	/**
	 * Add a shader to the manager.
	 * @param {string} name The name of the shader.
	 * @param {GPUShaderModule} shader The shader module.
	 */
	public add ( name: string, shader: GPUShaderModule ) : void
	{
		if ( !name )
		{
			throw new Error( "Invalid shader name" );
		}

		if ( !shader )
		{
			throw new Error( "Invalid shader module" );
		}

		if ( this.#shaders.has ( name ) )
		{
			throw new Error ( `Shader with name '${name}' already exists` );
		}

		this.#shaders.set ( name, shader );
	}

	/**
	 * Get a shader by name.
	 * @param {string} name The name of the shader.
	 * @returns {GPUShaderModule | null} The shader module, or null.
	 */
	public get ( name: string ) : ( GPUShaderModule | null )
	{
		const shader = this.#shaders.get ( name );
		return ( shader ?? null );
	}

	/**
	 * Remove a shader by name.
	 * @param {string} name The name of the shader.
	 * @returns {boolean} True if the shader was removed, otherwise false.
	 */
	public remove ( name: string ) : boolean
	{
		return this.#shaders.delete ( name );
	}
}
