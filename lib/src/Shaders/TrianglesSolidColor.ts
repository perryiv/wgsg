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
import code from "./TrianglesSolidColor.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class TrianglesSolidColor extends BaseClass
{
	static #instance: ( TrianglesSolidColor | null ) = null;
	#color: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ];
	#buffer: ( GPUBuffer | null ) = null;
	#bindGroup: ( GPUBindGroup | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor()
	{
		super ( { code: ( code as string ) } );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		if ( this.#buffer )
		{
			this.#buffer.destroy();
			this.#buffer = null;
		}
		this.#bindGroup = null;
		super.destroy();
	}

	/**
	 * Get the singleton instance.
	 * @returns {TrianglesSolidColor} The singleton instance.
	 */
	public static get instance () : TrianglesSolidColor
	{
		if ( !TrianglesSolidColor.#instance )
		{
			TrianglesSolidColor.#instance = new TrianglesSolidColor();
		}
		return TrianglesSolidColor.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( TrianglesSolidColor.#instance )
		{
			TrianglesSolidColor.#instance.destroy();
			TrianglesSolidColor.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.TrianglesSolidColor";
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
		this.#buffer = null;
		this.#bindGroup = null;
	}

	/**
	 * Return the uniform buffer.
	 * @returns {GPUBuffer | null} The uniform buffer.
	 */
	protected get uniforms () : GPUBuffer
	{
		// Shortcut
		let buffer = this.#buffer;

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
			this.#buffer = buffer;
		}

		// Return what we have.
		return buffer;
	}

	/**
	 * Make the render pipeline.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline() : GPURenderPipeline
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
				topology: "triangle-list"
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
	 * @returns {GPUBindGroup} The bind group.
	 */
	protected get bindGroup () : GPUBindGroup
	{
		// Shortcut
		let bindGroup = this.#bindGroup;

		// Make it if we have to.
		if ( !bindGroup )
		{
			// Shortcuts.
			const { pipeline } = this;
			const device = Device.instance.device;

			// Make the bind group.
			bindGroup = device.createBindGroup ( {
				label: `Bind group for shader ${this.type}`,
				layout: pipeline.getBindGroupLayout ( 0 ),
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
	 */
	public configureRenderPass ( pass: GPURenderPassEncoder ) : void
	{
		// Note: The render-pass' pipeline should already be set.

		// Set the color buffer.
		pass.setBindGroup ( 0, this.bindGroup );
	}
}
