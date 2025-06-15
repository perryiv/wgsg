///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all shaders.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base";
import { Device } from "../Tools";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IShaderBaseInput
{
	device: Device;
	code: string;
}

export type IShaderFactory = ( ( this: void, device: Device ) => ShaderBase );


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all shaders.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class ShaderBase extends Base
{
	#code: string;
	#device: Device;
	#module: ( GPUShaderModule | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IShaderBaseInput} input - The input for the constructor.
	 */
	protected constructor ( { device, code }: IShaderBaseInput )
	{
		// Do this first.
		super();

		// Make sure the code is a string.
		if ( "string" !== ( typeof code ) )
		{
			throw new Error ( `Shader code type is: ${typeof code}` );
		}

		// Save the members.
		this.#code = code;
		this.#device = device;
	}

	/**
	 * Return the shader code.
	 * @returns {string} The shader code.
	 */
	public get code() : string
	{
		return this.#code;
	}

	/**
	 * Return the shader module.
	 * @returns {GPUShaderModule} The shader module.
	 */
	public get module() : GPUShaderModule
	{
		// The first time we have to make it.
		if ( !this.#module )
		{
			const label = this.getClassName();
			const code = this.code;
			const device = this.#device.device;
			this.#module = device.createShaderModule ( { label, code } );
		}

		// Return what we have.
		return this.#module;
	}
}
