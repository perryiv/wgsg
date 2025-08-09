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
		// Return the pipeline if we already made it
		if ( this.#pipeline )
		{
			return this.#pipeline;
		}

		// Make the pipeline.
		this.#pipeline = Device.instance.device.createRenderPipeline ( {
			label: `Pipeline for shader ${this.type}`,
			vertex: {
				module: this.module,
				buffers: [
				{
					attributes: [
					{
						shaderLocation: 0,
						offset: 0,
						format: "float32x3", // Position
					} ],
					arrayStride: 12, // 3 floats * 4 bytes each
					// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
					stepMode: "vertex",
				} ]
			},
			fragment: {
				module: this.module,
				targets: [ {
					format: Device.instance.preferredFormat
				} ]
			},
			primitive: {
				topology: "triangle-list"
			},
			layout: "auto",
		} );

		// Return what we have.
		return this.#pipeline;
	}
}
