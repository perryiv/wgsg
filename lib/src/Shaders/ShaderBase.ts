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
	#pipeline: ( GPURenderPipeline | null ) = null;

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
	 * Get the shader code.
	 * @returns {string} The shader code.
	 */
	public get code() : string
	{
		// Shortcut.
		const code = this.#code;

		// Make sure.
		if ( !code )
		{
			throw new Error ( "Shader code is not set" );
		}
		if ( "string" !== ( typeof code ) )
		{
			throw new Error ( `Shader code type is: ${typeof code}` );
		}
		if ( code.length < 1 )
		{
			throw new Error ( "Shader code is empty" );
		}

		// Return the code.
		return this.#code;
	}

	/**
	 * Get the device.
	 * @returns {Device} The GPU device wrapper.
	 */
	protected get device () : Device
	{
		// Shortcut.
		const device = this.#device;

		// We should always have a valid device.
		if ( !device )
		{
			throw new Error ( "Attempting to get invalid device in shader base" );
		}

		// Return the device.
		return device;
	}

	/**
	 * Get the shader module.
	 * @returns {GPUShaderModule} The shader module.
	 */
	public get module() : GPUShaderModule
	{
		// The first time we have to make it.
		if ( !this.#module )
		{
			const label = this.type;
			const code = this.code;
			const device = this.#device;
			this.#module = device.makeShader ( { label, code } );
		}

		// Return what we have.
		return this.#module;
	}

	/**
	 * Get the pipeline.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	public get pipeline() : GPURenderPipeline
	{
		// The first time we have to make it.
		if ( !this.#pipeline )
		{
			const device = this.device;
			const label = `Pipeline for shader ${this.type}`;
			const module = this.module;
			this.#pipeline = device.makePipeline ( { label, module } );
		}

		// Return what we have.
		return this.#pipeline;
	}
}
