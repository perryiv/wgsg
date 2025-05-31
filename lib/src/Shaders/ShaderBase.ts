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


///////////////////////////////////////////////////////////////////////////////
//
//	Shader factory function type.
//
///////////////////////////////////////////////////////////////////////////////

export type IShaderFactory = ( ( this: void, device: GPUDevice ) => ShaderBase );


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the base class for all shaders.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class ShaderBase extends Base
{
	#code: string;
	#module: GPUShaderModule;

	/**
	 * Construct the class.
	 * @class
	 * @param {GPUDevice} device The GPU device.
	 * @param {string} code The shader code in WGSL format.
	 */
	protected constructor ( device: GPUDevice, code: string )
	{
		// Do this first.
		super();

		// Make sure the code is a string.
		if ( "string" !== ( typeof code ) )
		{
			throw new Error ( `Shader code type is: ${typeof code}` );
		}

		// Save the code string.
		this.#code = code;

		// Make the shader module.
		const label = this.getClassName();
		this.#module = device.createShaderModule ( { label, code } );
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
		return this.#module;
	}
}
