///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with flat shading. The geometry does not need
//	normal vectors, because the shader calculates them for each triangle.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";
import { Lighting as BaseClass } from "./Lighting";
import { State } from "../Scene";
import type { IPipelineOptions } from "./ShaderBase";
import code from "./FlatShading.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IFlatShadingShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class FlatShading extends BaseClass
{
	static #instance: ( FlatShading | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IFlatShadingShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IFlatShadingShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code,
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {FlatShading} The singleton instance.
	 */
	public static get instance () : FlatShading
	{
		if ( !FlatShading.#instance )
		{
			FlatShading.#instance = new FlatShading();
		}
		return FlatShading.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( FlatShading.#instance )
		{
			FlatShading.#instance.destroy();
			FlatShading.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.FlatShading";
	}

	/**
	 * Make the render pipeline.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline ( { topology, cullMode }: Readonly<IPipelineOptions> ) : GPURenderPipeline
	{
		// Shortcuts
		const { device, preferredFormat } = Device.instance;

		// Define the array stride. There is only the position buffer.
		// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
		const positionStride = 12; // 3 floats * 4 bytes each.

		// Make the pipeline.
		const pipeline = device.createRenderPipeline ( {
			label: `Render pipeline for shader ${this.type}`,
			layout: this.pipelineLayout,
			vertex: {
				module: this.module,
				entryPoint: "vs",
				buffers: [
				{
					attributes: [
					{
						// Position
						shaderLocation: 0,
						offset: 0,
						format: "float32x3",
					} ],
					arrayStride: positionStride,
					stepMode: "vertex",
				} ]
			},
			fragment: {
				module: this.module,
				entryPoint: "fs",
				targets: [ {
					format: preferredFormat,
					blend: {
						color: {
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha"
						},
						alpha: {
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha"
						},
					},
				} ]
			},
			primitive: {
				topology,
				cullMode,
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: "less",
				format: "depth24plus",
			},
		} );

		// Do not return an invalid pipeline.
		if ( !pipeline )
		{
			throw new Error ( "Failed to create pipeline" );
		}

		// Return the new pipeline.
		return pipeline;
	}

	/**
	 * Make and return a state object that uses this shader.
	 * @param {object} input - The input object.
	 * @param {GPUPrimitiveTopology} input.topology - The primitive topology.
	 * @returns {State} The state object.
	 */
	public static makeState = ( { topology } : { topology: GPUPrimitiveTopology } ) : State =>
	{
		// Shortcut.
		const shader = FlatShading.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}
}
