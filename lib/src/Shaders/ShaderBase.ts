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
import type { Geometry, IIndexArray } from "../Scene";
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

// The settings that a render pipeline is made with, besides the shader.
// More can be added, like stencil and blending. The state decides most of
// them, but whether there are vertex colors depends on the geometry, so the
// state leaves that out, which means there are none.
export interface IPipelineOptions
{
	topology: GPUPrimitiveTopology;
	cullMode: GPUCullMode;
	depthWrite: boolean;
	vertexColors?: boolean;
}

/**
 * Make a key for the pipeline options, to tell pipelines apart.
 * @param {IPipelineOptions} options - The pipeline options.
 * @returns {string} The key.
 */
export const makePipelineKey = ( options: Readonly<IPipelineOptions> ) : string =>
{
	const key = `${options.topology} ${options.cullMode} ${options.depthWrite ? "depth-write" : "no-depth-write"}`;
	return ( ( true === options.vertexColors ) ? `${key} vertex-colors` : key );
};

// The geometry's arrays that a shader can read as vertex buffers. Each one
// has its own location in the shader code, whichever buffers come before it.
export type IVertexArrayName = ( "points" | "normals" | "colors" );

// How each array is read, in the shader code and from the buffer.
const VERTEX_ARRAY_FORMATS: Readonly<Record<IVertexArrayName, { shaderLocation: number, format: GPUVertexFormat, arrayStride: number }>> = {
	points:  { shaderLocation: 0, format: "float32x3", arrayStride: 12 }, // 3 floats * 4 bytes each.
	normals: { shaderLocation: 1, format: "float32x3", arrayStride: 12 }, // 3 floats * 4 bytes each.
	colors:  { shaderLocation: 2, format: "float32x4", arrayStride: 16 }, // 4 floats * 4 bytes each.
};

/**
 * Make the layouts of the vertex buffers, one for each array, in order.
 * @param {IVertexArrayName[]} names - The arrays, in the order of the buffers.
 * @returns {GPUVertexBufferLayout[]} The layouts.
 */
export const makeVertexBufferLayouts = ( names: readonly IVertexArrayName[] ) : GPUVertexBufferLayout[] =>
{
	return names.map ( ( name ) =>
	{
		const { shaderLocation, format, arrayStride } = VERTEX_ARRAY_FORMATS[name];
		return { attributes: [ { shaderLocation, offset: 0, format } ], arrayStride, stepMode: "vertex" };
	} );
};

export type IShaderFactory = ( ( this: void ) => ShaderBase );

export interface IPulledVerticesInput
{
	geometry: Geometry;
	indices: ( IIndexArray | null );
	key: object;
}


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
	#pipelines = new Map < string, GPURenderPipeline > ();
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
		this.releaseGpuObjects();
		super.destroy();
	}

	/**
	 * Release the GPU objects. They are made again when needed.
	 */
	public releaseGpuObjects() : void
	{
		this.#module = null;
		this.#pipelines.clear();
		this.#device = 0;
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
	 * Release the GPU objects if the device changed since the shader was last
	 * used. This also handles shaders that were not in the scene when the
	 * device was lost.
	 */
	protected checkDevice() : void
	{
		const device = Device.instance.id;
		if ( this.#device !== device )
		{
			this.releaseGpuObjects();
			this.#device = device;
		}
	}

	/**
	 * Get the shader module.
	 * @returns {GPUShaderModule} The shader module.
	 */
	public get module() : GPUShaderModule
	{
		// Reset if the device changed.
		this.checkDevice();

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
	 * Get the pipeline for the options. Make it if we have to. There is one
	 * for each set of options used.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	public getPipeline ( options: Readonly<IPipelineOptions> ) : GPURenderPipeline
	{
		// Reset if the device changed. Do this before using anything that
		// was made with the old device.
		this.checkDevice();

		// Make it if we have to.
		const key = makePipelineKey ( options );
		let pipeline = this.#pipelines.get ( key );
		if ( !pipeline )
		{
			pipeline = this.makePipeline ( options );
			this.#pipelines.set ( key, pipeline );
		}

		// Return the pipeline.
		return pipeline;
	}

	/**
	 * Get the geometry's arrays that the pipeline reads as vertex buffers,
	 * in the order of the buffers.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {IVertexArrayName[]} The arrays.
	 */
	public abstract getVertexArrays ( options: Readonly<IPipelineOptions> ) : IVertexArrayName[];

	// Does this shader read the vertices from storage buffers in the vertex
	// shader (vertex pulling) instead of from vertex and index buffers?
	// Derived classes that do set this to true.
	public readonly pullsVertices: boolean = false;

	/**
	 * Set the bind group with the buffers that the vertex shader pulls the
	 * vertices from. Only called when pullsVertices is true. Overload if needed.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {IPulledVerticesInput} input - The geometry, its indices if any,
	 * and an object that identifies the primitives, for caching.
	 * @returns {number | null} The value to pass as the first instance when
	 * drawing, which tells the vertex shader how to read the indices, or null
	 * if the vertices cannot be drawn, which is always the case here.
	 */
	public setPulledVertices ( pass: Readonly<GPURenderPassEncoder>, input: Readonly<IPulledVerticesInput> ) : ( number | null )
	{
		void pass;
		void input;
		return null;
	}

	/**
	 * Get the projection matrix. Overload if needed.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public abstract get projMatrix () : Readonly<IMatrix44>;

	/**
	 * Set the projection matrix. Overload if needed.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public abstract set projMatrix ( matrix: Readonly<IMatrix44> );

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	// public abstract get name() : string;

	/**
	 * Make the render pipeline.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected abstract makePipeline ( options: Readonly<IPipelineOptions> ) : GPURenderPipeline;

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public abstract configureRenderPass ( pass: Readonly<GPURenderPassEncoder>, frame: number ) : void;

	/**
	 * Put back the default values of what state attributes set (e.g., the
	 * color). States call this when they reset, so that a state does not get
	 * the values of the one drawn before it. This one does nothing.
	 */
	public reset () : void
	{
		// Nothing to do here.
	}
}
