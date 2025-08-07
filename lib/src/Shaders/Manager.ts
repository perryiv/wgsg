
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
import { ShaderBase, type IShaderFactory } from "./ShaderBase";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IShaderData
{
	factory: IShaderFactory;
	shader: ( ShaderBase | null );
}
type IShaderMap = Map < string, IShaderData >;


///////////////////////////////////////////////////////////////////////////////
//
//	The singleton instance of the shader manager.
//
///////////////////////////////////////////////////////////////////////////////

let manager: ( Manager | null ) = null;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that managed all the shaders.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Manager extends Base
{
	#shaders: IShaderMap = new Map < string, IShaderData > ();

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
	public static get instance123() : Manager
	{
		if ( !manager )
		{
			manager = new Manager();
		}

		return manager;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.Manager";
	}

	/**
	 * Add a shader to the manager.
	 * @param {string} name The name of the shader.
	 * @param {IShaderFactory} factory The factory function that creates the shader.
	 */
	public add ( name: string, factory: IShaderFactory ) : void
	{
		if ( !name )
		{
			throw new Error( "Invalid shader name" );
		}

		if ( !factory )
		{
			throw new Error( "Invalid shader factory function" );
		}

		if ( this.#shaders.has ( name ) )
		{
			throw new Error ( `Shader factory with name '${name}' already exists` );
		}

		this.#shaders.set ( name, { shader: null, factory } );
	}

	/**
	 * Get a shader by name.
	 * @param {string} name The name of the shader.
	 * @returns {ShaderBase} The shader class.
	 */
	public get ( name: string ) : ShaderBase
	{
		// Get the data associated with the given name.
		const sd = this.#shaders.get ( name );

		// There should be data.
		if ( !sd )
		{
			throw new Error ( `Shader with name '${name}' does not exist` );
		}

		// Get the shader.
		let { shader } = sd;

		// Make it if we have to.
		if ( !shader )
		{
			const { factory } = sd;
			shader = factory();
			sd.shader = shader;
		}

		// Return the shader.
		return shader;
	}

	/**
	 * Check if a shader factory exists by name.
	 * @param {string} name The name of the shader.
	 * @returns {boolean} True if the shader exists, otherwise false.
	 */
	public has ( name: string ) : boolean
	{
		return this.#shaders.has ( name );
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
