///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders a solid color.
//	https://stackoverflow.com/questions/71535213/a-way-to-load-wglsl-files-in-typescript-files-using-esbuild
//
///////////////////////////////////////////////////////////////////////////////

import { ColorTool as Color, Device } from "../Tools";
import { State } from "../Scene";
import { vec4 } from "gl-matrix";
import { WithMatrices as BaseClass } from "./WithMatrices";
import code from "./SolidColor.wgsl?raw";
import type { IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface ISolidColorShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class SolidColor extends BaseClass
{
	static #instance: ( SolidColor | null ) = null;
	#color: IVector4 = [ ...Color.gray ];

	// The uniform values. Two 4x4 matrices and the color.
	#uniforms = new ArrayBuffer ( ( 16 + 16 + 4 ) * 4 );

	/**
	 * Construct the class.
	 * @class
	 * @param {ISolidColorShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<ISolidColorShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code,
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {SolidColor} The singleton instance.
	 */
	public static get instance () : SolidColor
	{
		if ( !SolidColor.#instance )
		{
			SolidColor.#instance = new SolidColor();
		}
		return SolidColor.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( SolidColor.#instance )
		{
			SolidColor.#instance.destroy();
			SolidColor.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.SolidColor";
	}

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	// public get name() : string
	// {
	// 	const color = this.color.join ( ", " );
	// 	return `${this.type} with color [${color}]`;
	// }

	/**
	 * Return the color.
	 * @returns {IVector4} The color.
	 */
	public get color () : IVector4
	{
		return [ ...this.#color ];
	}

	/**
	 * Set the color.
	 * @param {IVector4} color - The color.
	 */
	public set color ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#color, color );
		this.uniformsChanged();
	}

	/**
	 * Return the uniform values, in the same order as the "Uniforms" struct
	 * in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected makeUniforms () : ArrayBuffer
	{
		const uniforms = this.#uniforms;
		const floats = new Float32Array ( uniforms );
		floats.set ( this.projMatrix, 0 );
		floats.set ( this.viewMatrix, 16 );
		floats.set ( this.#color, 32 );
		return uniforms;
	}

	/**
	 * Make the render pipeline.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline ( topology: Readonly<GPUPrimitiveTopology> ) : GPURenderPipeline
	{
		// Shortcuts
		const { device, preferredFormat } = Device.instance;

		// Define the array stride.
		// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
		const arrayStride = 12; // 3 floats * 4 bytes each.

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
					arrayStride,
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
				topology
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
		const shader = SolidColor.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}
}
