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

import { Device } from "../Tools";
import { IVector4 } from "../Types";
import { ShaderBase as BaseClass } from "./ShaderBase";
import { vec4 } from "gl-matrix";

// @ts-expect-error TypeScript does not recognize WGSL files.
import code from "./SolidColor.wgsl?raw";


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
	#color: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ];
	#uniforms: ( GPUBuffer | null ) = null;
	#bindGroup: ( GPUBindGroup | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {ISolidColorShaderInput} [input] - The input.
	 */
	protected constructor ( input?: ISolidColorShaderInput )
	{
		const topology = input?.topology;

		super ( {
			code: ( code as string ),
			topology: ( topology ? topology : "triangle-list" )
		} );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		if ( this.#uniforms )
		{
			this.#uniforms.destroy();
			this.#uniforms = null;
		}
		this.#bindGroup = null;
		super.destroy();
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
	public get name() : string
	{
		const color = this.color.join ( ", " );
		return `${this.type} with color [${color}]`;
	}

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
	public set color ( color: IVector4 )
	{
		vec4.copy ( this.#color, color );
		this.#uniforms = null;
		this.#bindGroup = null;
	}

	/**
	 * Return the uniform buffer.
	 * @returns {GPUBuffer | null} The uniform buffer.
	 */
	protected get uniforms () : GPUBuffer
	{
		// Shortcut
		let buffer = this.#uniforms;

		// Make it if we have to.
		if ( !buffer )
		{
			// Shortcut
			const device = Device.instance.device;

			// Create the buffer.
			buffer = device.createBuffer ( {
				label: `Uniform buffer for shader ${this.type}`,
				size: 16, // 4 values, 4 bytes each.
				usage: ( GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST )
			} );

			// Write the color values to a typed array.
			const values = new Float32Array ( this.#color );

			// Write the typed array to the buffer.
			device.queue.writeBuffer ( buffer, 0, values );

			// Set this for next time.
			this.#uniforms = buffer;
		}

		// Return what we have.
		return buffer;
	}

	/**
	 * Make the render pipeline.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline ( topology: GPUPrimitiveTopology ) : GPURenderPipeline
	{
		// Shortcuts
		const { device, preferredFormat } = Device.instance;

		// Define the array stride.
		// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
		const arrayStride = 12; // 3 floats * 4 bytes each.

		// Make the pipeline.
		const pipeline = device.createRenderPipeline ( {
			label: `Render pipeline for shader ${this.type}`,
			layout: "auto",
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
					format: preferredFormat
				} ]
			},
			primitive: {
				topology
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
	 * Get the bind group.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @returns {GPUBindGroup} The bind group.
	 */
	protected getBindGroup ( topology: GPUPrimitiveTopology ) : GPUBindGroup
	{
		// Shortcut
		let bindGroup = this.#bindGroup;

		// Make it if we have to.
		if ( !bindGroup )
		{
			// Shortcuts.
			const pipeline = this.getPipeline ( topology );
			const device = Device.instance.device;

			// Make the layout and give it a name.
			// Note: Giving the layout a name eliminated the following error:
			// [Invalid BindGroupLayout (unlabeled)] is associated with [Device], and cannot be used with [Device].
			const index = 0;
			const layout = pipeline.getBindGroupLayout ( index );
			layout.label = `Bind group layout ${index} for shader ${this.type}`;

			// Make the bind group.
			bindGroup = device.createBindGroup ( {
				label: `Bind group for shader ${this.type}`,
				layout,
				entries: [
				{
					binding: 0,
					resource: { buffer: this.uniforms }
				} ],
			} );

			// Set for next time.
			this.#bindGroup = bindGroup;
		}

		// Return the bind group.
		return bindGroup;
	}

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 */
	public configureRenderPass ( pass: GPURenderPassEncoder, topology: GPUPrimitiveTopology ) : void
	{
		// Note: The render-pass' pipeline should already be set.

		// Set the color buffer.
		pass.setBindGroup ( 0, this.getBindGroup ( topology ) );
	}
}
