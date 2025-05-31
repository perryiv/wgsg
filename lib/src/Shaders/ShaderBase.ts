///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for shaders.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base";
import { Manager } from "./Manager";


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
	constructor ( device: GPUDevice, code: string )
	{
		// Do this first.
		super();

		// Save the code string.
		this.#code = code;

		// Make the shader module.
		const label = this.getClassName();
		this.#module = device.createShaderModule ( { label, code } );

		// Register this shader with the manager.
		Manager.instance.add ( label, this.#module );
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
