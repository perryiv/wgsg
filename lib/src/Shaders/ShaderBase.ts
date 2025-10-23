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
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IShaderBaseInput
{
	code: string;
	topology: GPUPrimitiveTopology;
}

interface IPipelineTopologyPair
{
	pipeline: ( GPURenderPipeline | null );
	topology: ( GPUPrimitiveTopology | null );
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
	#data: IPipelineTopologyPair = { pipeline: null, topology: null };
	#device = 0;

	/**
	 * Construct the class.
	 * @class
	 * @param {IShaderBaseInput} input - The input for the constructor.
	 */
	protected constructor ( { code }: Readonly<IShaderBaseInput> )
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
	public override destroy() : void
	{
		this.#module = null;
		this.#data = { pipeline: null, topology: null };
		this.#device = 0;
		super.destroy();
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
		// Did the device change?
		const device = Device.instance.id;
		if ( this.#device !== device )
		{
			this.#device = device;
			this.#module = null;
			this.#data = { pipeline: null, topology: null };
		}

		// Make it if we have to.
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
	 * Get the pipeline. Make it if we have to.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	public getPipeline ( topology: Readonly<GPUPrimitiveTopology> ) : GPURenderPipeline
	{
		// Get the existing pipeline, if any, and the current topology.
		let { pipeline } = this.#data;
		const { topology: currentTopology } = this.#data;

		// If there is no pipeline, or the topology has changed, make a new one.
		if ( !pipeline || ( topology !== currentTopology ) )
		{
			pipeline = this.makePipeline ( topology );
			this.#data = { pipeline, topology };
		}

		// Return the pipeline.
		return pipeline;
	}

	/**
	 * Set the projection matrix. Overload if needed.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public abstract set projMatrix ( matrix: Readonly<IMatrix44> );

	/**
	 * Set the model matrix. Overload if needed.
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	public abstract set modelMatrix ( matrix: Readonly<IMatrix44> );

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	public abstract get name() : string;

	/**
	 * Make the render pipeline.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected abstract makePipeline ( topology: Readonly<GPUPrimitiveTopology> ) : GPURenderPipeline;

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 */
	public abstract configureRenderPass ( pass: Readonly<GPURenderPassEncoder>, topology: GPUPrimitiveTopology ) : void;
}
