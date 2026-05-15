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

import { Color, Device } from "../Tools";
import { State } from "../Scene";
import { vec4 } from "gl-matrix";
import { WithMatrices as BaseClass } from "./WithMatrices";
import type { IMatrix44, IVector4 } from "../Types";

// @ts-expect-error TypeScript does not recognize WGSL files.
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
	#color: IVector4 = [ ...Color.gray ];
	#twoSided = false;
	#lightDir: IVector4 = [ 0.0, 0.0, -1.0, 0.0 ];
	#uniforms: ( GPUBuffer | null ) = null;
	#bindGroup: ( GPUBindGroup | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IPhongShadingShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IPhongShadingShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code: ( code as string ),
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		this.reset();
		super.destroy();
	}

	/**
	 * Reset the shader.
	 */
	public override reset() : void
	{
		if ( this.#uniforms )
		{
			this.#uniforms.destroy();
			this.#uniforms = null;
		}
		this.#bindGroup = null;
		super.reset();
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
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	public get name() : string
	{
		const color = this.color.join ( ", " );
		const lightDir = this.lightDir.join ( ", " );
		return `${this.type} with color: [${color}], two-sided lighting: ${this.twoSided}, and light direction: [${lightDir}]`;
	}

	/**
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public override get viewMatrix () : Readonly<IMatrix44>
	{
		return super.viewMatrix;
	}

	/**
	 * Set the view matrix. Overload if needed.
	 * @param {IMatrix44} matrix - The view matrix.
	 */
	public override set viewMatrix ( matrix: Readonly<IMatrix44> )
	{
		super.viewMatrix = matrix;
		this.#uniforms = null;
		this.#bindGroup = null;
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
	public set color ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#color, color );
		this.#uniforms = null;
		this.#bindGroup = null;
	}

	/**
	 * Return whether to use two-sided lighting.
	 * @returns {boolean} Whether to use two-sided lighting.
	 */
	public get twoSided () : boolean
	{
		return this.#twoSided;
	}

	/**
	 * Set whether to use two-sided lighting.
	 * @param {boolean} twoSided - Whether to use two-sided lighting.
	 */
	public set twoSided ( twoSided: boolean )
	{
		this.#twoSided = twoSided;
		this.#uniforms = null;
		this.#bindGroup = null;
	}

	/**
	 * Return the light direction.
	 * @returns {IVector4} The light direction.
	 */
	public get lightDir () : IVector4
	{
		return [ ...this.#lightDir ];
	}

	/**
	 * Set the light direction.
	 * @param {IVector4} lightDir - The light direction.
	 */
	public set lightDir ( lightDir: Readonly<IVector4> )
	{
		vec4.copy ( this.#lightDir, lightDir );
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
				label: `Uniform buffer for shader ${this.type} ${this.id}`,
				// Two 4x4 matrices + 4D color + 3D light + 1D twoSided, padded to 16-byte alignment.
				size: 160,
				usage: ( GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST )
			} );

			// Write the values to a typed array.
			const pm = new Float32Array ( this.projMatrix );
			const vm = new Float32Array ( this.viewMatrix );
			const color = new Float32Array ( this.#color );
			const lightDir = new Float32Array ( [ this.#lightDir[0], this.#lightDir[1], this.#lightDir[2] ] );
			const twoSided = new Uint32Array ( [ this.#twoSided ? 1 : 0 ] );

			// Write the typed array to the buffer.
			let offset = 0;
			device.queue.writeBuffer ( buffer, offset, pm       ); offset += pm.byteLength;
			device.queue.writeBuffer ( buffer, offset, vm       ); offset += vm.byteLength;
			device.queue.writeBuffer ( buffer, offset, color    ); offset += color.byteLength;
			device.queue.writeBuffer ( buffer, offset, lightDir ); offset += lightDir.byteLength;
			device.queue.writeBuffer ( buffer, offset, twoSided ); offset += twoSided.byteLength;

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
	protected makePipeline ( topology: Readonly<GPUPrimitiveTopology> ) : GPURenderPipeline
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
	 * Get the bind group.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @returns {GPUBindGroup} The bind group.
	 */
	protected getBindGroup ( topology: Readonly<GPUPrimitiveTopology> ) : GPUBindGroup
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
	public configureRenderPass ( pass: Readonly<GPURenderPassEncoder>, topology: Readonly<GPUPrimitiveTopology> ) : void
	{
		// Note: The render-pass' pipeline should already be set.

		// Set the color buffer.
		pass.setBindGroup ( 0, this.getBindGroup ( topology ) );
	}

	/**
	 * Make and return a state object that uses this shader.
	 * @param {object} input - The input object.
	 * @param {IVector4} input.color - The color to use in the state.
	 * @param {boolean} input.twoSided - Whether to use two-sided lighting.
	 * @param {GPUPrimitiveTopology} input.topology - The primitive topology.
	 * @returns {State} The state object.
	 */
	public static makeState = ( { color, twoSided = false, topology } :
	{ color: Readonly<IVector4>, twoSided: boolean, topology: GPUPrimitiveTopology } ) : State =>
	{
		// Make a copy of the color because we capture it below.
		color = [ color[0], color[1], color[2], color[3] ];

		// Shortcut.
		const shader = PhongShading.instance;

		// Make the state.
		return new State ( {
			name: `${shader.type} state with color: ${color.join(", ")}, twoSided: ${twoSided}, topology: ${topology}`,
			shader,
			topology,
			apply: ( () =>
			{
				shader.color = color;
				shader.twoSided = twoSided;
			} )
		} );
	}
}
