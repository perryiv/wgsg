///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that handles the projection and view matrices.
//
///////////////////////////////////////////////////////////////////////////////

import { Device, IDENTITY_MATRIX } from "../Tools";
import { mat4 } from "gl-matrix";
import { ShaderBase as BaseClass, type IShaderBaseInput } from "./ShaderBase";
import { UniformPool } from "./UniformPool";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IWithMatricesInput = IShaderBaseInput;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for shaders whose uniforms start with the projection and view
 * matrices. It keeps the uniform buffers in a pool that is reused every frame.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class WithMatrices extends BaseClass
{
	#projMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#viewMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#pool: ( UniformPool | null ) = null;
	#bindGroupLayout: ( GPUBindGroupLayout | null ) = null;
	#pipelineLayout: ( GPUPipelineLayout | null ) = null;
	#uniformsChanged = true;

	/**
	 * Construct the class.
	 * @class
	 * @param {IWithMatricesInput} [input] - The input for the shader.
	 */
	protected constructor ( input: Readonly<IWithMatricesInput> )
	{
		super ( input );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		super.destroy();
	}

	/**
	 * Release the GPU objects. Destroy the uniform buffers. They, and the
	 * layouts, are made again when needed.
	 */
	public override releaseGpuObjects() : void
	{
		this.#pool?.destroy();
		this.#pool = null;
		this.#bindGroupLayout = null;
		this.#pipelineLayout = null;
		this.#uniformsChanged = true;
		super.releaseGpuObjects();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.WithMatrices";
	}

	/**
	 * Get the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public override get projMatrix () : Readonly<IMatrix44>
	{
		return this.#projMatrix;
	}

	/**
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public override set projMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#projMatrix, matrix );
		this.uniformsChanged();
	}

	/**
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public override get viewMatrix () : Readonly<IMatrix44>
	{
		return this.#viewMatrix;
	}

	/**
	 * Set the view matrix.
	 * @param {IMatrix44} matrix - The view matrix.
	 */
	public override set viewMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#viewMatrix, matrix );
		this.uniformsChanged();
	}

	/**
	 * Call this when any of the uniform values change.
	 */
	protected uniformsChanged () : void
	{
		this.#uniformsChanged = true;
	}

	/**
	 * Return the uniform values, in the same order as the "Uniforms" struct
	 * in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected abstract makeUniforms () : ArrayBuffer;

	/**
	 * Get the layout of the bind group that holds the uniform buffer.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	protected get bindGroupLayout () : GPUBindGroupLayout
	{
		if ( !this.#bindGroupLayout )
		{
			this.#bindGroupLayout = Device.instance.device.createBindGroupLayout ( {
				label: `Bind group layout for shader ${this.type}`,
				entries: [ {
					binding: 0,
					visibility: ( GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT ),
					buffer: { type: "uniform" },
				} ],
			} );
		}
		return this.#bindGroupLayout;
	}

	/**
	 * Get the pipeline layout. Use this when making the pipeline so that the
	 * bind groups in the pool work with all of this shader's pipelines.
	 * @returns {GPUPipelineLayout} The pipeline layout.
	 */
	protected get pipelineLayout () : GPUPipelineLayout
	{
		if ( !this.#pipelineLayout )
		{
			this.#pipelineLayout = Device.instance.device.createPipelineLayout ( {
				label: `Pipeline layout for shader ${this.type}`,
				bindGroupLayouts: [ this.bindGroupLayout ],
			} );
		}
		return this.#pipelineLayout;
	}

	/**
	 * Get the number of uniform buffers in the pool.
	 * @returns {number} The number of uniform buffers.
	 */
	public get numUniformBuffers () : number
	{
		return ( this.#pool?.length ?? 0 );
	}

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public configureRenderPass ( pass: Readonly<GPURenderPassEncoder>, frame: number ) : void
	{
		// Note: The render-pass' pipeline should already be set.

		// Get the uniform values.
		const values = this.makeUniforms();

		// Make the pool if we have to.
		if ( !this.#pool )
		{
			this.#pool = new UniformPool ( {
				label: `shader ${this.type}`,
				layout: this.bindGroupLayout,
				size: values.byteLength,
			} );
		}

		// Get the bind group with the values, and use it.
		const bindGroup = this.#pool.use ( frame, this.#uniformsChanged, values );
		this.#uniformsChanged = false;
		pass.setBindGroup ( 0, bindGroup );
	}
}
