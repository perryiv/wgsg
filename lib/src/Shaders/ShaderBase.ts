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
	code: string;
}

export type IShaderFactory = ( ( this: void ) => ShaderBase );


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all shaders.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class ShaderBase extends Base
{
	#code: string;
	#module: ( GPUShaderModule | null ) = null;
	#pipeline: ( GPURenderPipeline | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IShaderBaseInput} input - The input for the constructor.
	 */
	protected constructor ( { code }: IShaderBaseInput )
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
	}

	/**
	 * Destroy this instance.
	 */
	public destroy() : void
	{
		this.#module = null;
		this.#pipeline = null;
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
	 * Get the shader module.
	 * @returns {GPUShaderModule} The shader module.
	 */
	public get module() : GPUShaderModule
	{
		// The first time we have to make it.
		if ( !this.#module )
		{
			this.#module = Device.instance.device.createShaderModule ( {
				label: this.type,
				code: this.code
			} );
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
		let pipeline = this.#pipeline;

		if ( !pipeline )
		{
			pipeline = this.makePipeline();
			this.#pipeline = pipeline;
		}

		return pipeline;
	}

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	public abstract get name() : string;

	/**
	 * Make the render pipeline.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected abstract makePipeline() : GPURenderPipeline;

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 */
	public abstract configureRenderPass ( pass: GPURenderPassEncoder ) : void;
}
