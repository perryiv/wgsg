///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for shaders that use a color and a directional light.
//	The uniforms are the same for all of them, so the shader code for each
//	must start with the same "Uniforms" struct and binding.
//
///////////////////////////////////////////////////////////////////////////////

import { ColorTool as Color, Device } from "../Tools";
import { vec4 } from "gl-matrix";
import { WithMatrices as BaseClass, type IWithMatricesInput } from "./WithMatrices";
import type { IMatrix44, IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ILightingInput = IWithMatricesInput;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for shaders that use a color and a directional light.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Lighting extends BaseClass
{
	#color: IVector4 = [ ...Color.gray ];
	#twoSidedLight = false;
	#lightDir: IVector4 = [ 0.0, 0.0, -1.0, 0.0 ];
	#uniforms: ( GPUBuffer | null ) = null;
	#bindGroup: ( GPUBindGroup | null ) = null;

	/**
	 * Construct the class.
	 * @abstract
	 * @param {ILightingInput} input - The input.
	 */
	protected constructor ( input: Readonly<ILightingInput> )
	{
		super ( input );
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
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.Lighting";
	}

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	// public get name() : string
	// {
	// 	const color = this.color.join ( ", " );
	// 	const lightDir = this.lightDir.join ( ", " );
	// 	return `${this.type} with color: [${color}], two-sided lighting: ${this.twoSidedLight}, and light direction: [${lightDir}]`;
	// }

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
	public get twoSidedLight () : boolean
	{
		return this.#twoSidedLight;
	}

	/**
	 * Set whether to use two-sided lighting.
	 * @param {boolean} twoSidedLight - Whether to use two-sided lighting.
	 */
	public set twoSidedLight ( twoSidedLight: boolean )
	{
		this.#twoSidedLight = twoSidedLight;
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
				// Two 4x4 matrices + 4D color + 3D light + 1D twoSidedLight, padded to 16-byte alignment.
				size: 160,
				usage: ( GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST )
			} );

			// Write the values to a typed array.
			const pm = new Float32Array ( this.projMatrix );
			const vm = new Float32Array ( this.viewMatrix );
			const color = new Float32Array ( this.#color );
			const lightDir = new Float32Array ( [ this.#lightDir[0], this.#lightDir[1], this.#lightDir[2] ] );
			const twoSidedLight = new Uint32Array ( [ this.#twoSidedLight ? 1 : 0 ] );

			// Write the typed array to the buffer.
			let offset = 0;
			device.queue.writeBuffer ( buffer, offset, pm       ); offset += pm.byteLength;
			device.queue.writeBuffer ( buffer, offset, vm       ); offset += vm.byteLength;
			device.queue.writeBuffer ( buffer, offset, color    ); offset += color.byteLength;
			device.queue.writeBuffer ( buffer, offset, lightDir ); offset += lightDir.byteLength;
			device.queue.writeBuffer ( buffer, offset, twoSidedLight ); offset += twoSidedLight.byteLength;

			// Set this for next time.
			this.#uniforms = buffer;
		}

		// Return what we have.
		return buffer;
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
}
