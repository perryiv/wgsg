///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with Phong shading.
//	https://webgpufundamentals.org/webgpu/lessons/webgpu-lighting-directional.html
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";
import { Lighting as BaseClass } from "./Lighting";
import { State } from "../Scene";
import type { IPipelineOptions } from "./ShaderBase";
import code from "./PhongShading.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IPhongShadingShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class PhongShading extends BaseClass
{
	static #instance: ( PhongShading | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IPhongShadingShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IPhongShadingShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code,
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {PhongShading} The singleton instance.
	 */
	public static get instance () : PhongShading
	{
		if ( !PhongShading.#instance )
		{
			PhongShading.#instance = new PhongShading();
		}
		return PhongShading.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( PhongShading.#instance )
		{
			PhongShading.#instance.destroy();
			PhongShading.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.PhongShading";
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

		// Define the array strides.
		// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
		const positionStride = 12; // 3 floats * 4 bytes each.
		const normalStride   = 12; // 3 floats * 4 bytes each.

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
				}, {
					attributes: [
					{
						// Normal vector
						shaderLocation: 1,
						offset: 0,
						format: "float32x3",
					} ],
					arrayStride: normalStride,
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
		const shader = PhongShading.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}
}
