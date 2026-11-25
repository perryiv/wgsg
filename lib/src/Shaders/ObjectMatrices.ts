///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The matrices of the objects drawn in a frame, in one uniform buffer.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// The bind group that the shaders read the object's matrix from.
export const OBJECT_BIND_GROUP = 2;

// The bytes of one matrix.
const MATRIX_BYTES = 64;


///////////////////////////////////////////////////////////////////////////////
//
//	The bind group layout, shared by all the shaders. It's made again when the
//	device changes.
//
///////////////////////////////////////////////////////////////////////////////

let sharedLayout: ( { layout: GPUBindGroupLayout, device: number } | null ) = null;


///////////////////////////////////////////////////////////////////////////////
/**
 * The matrices of the objects drawn in a frame, in one uniform buffer. Each
 * object's matrix is at its own offset, and the shaders read it from bind
 * group 2 with a dynamic offset. All of a frame's matrices are written to
 * the buffer at once, before the frame's commands are submitted.
 *
 * For each frame, call begin() with how many objects there are, add() each
 * object's matrix and bind() the offset you get back before drawing it, then
 * call upload() before submitting the commands.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ObjectMatrices
{
	#buffer: ( GPUBuffer | null ) = null;
	#bindGroup: ( GPUBindGroup | null ) = null;
	#values = new Float32Array ( 0 );
	#capacity = 0;
	#count = 0;
	#stride = 0;
	#device = 0;

	/**
	 * Get the layout of the bind group, shared by all the shaders.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	public static get layout () : GPUBindGroupLayout
	{
		const { device, id } = Device.instance;
		if ( sharedLayout?.device !== id )
		{
			const layout = device.createBindGroupLayout ( {
				label: "Bind group layout for object matrices",
				entries: [ {
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: MATRIX_BYTES },
				} ],
			} );
			sharedLayout = { layout, device: id };
		}
		return sharedLayout.layout;
	}

	/**
	 * Start a frame.
	 * @param {number} count - The most matrices that will be added.
	 */
	public begin ( count: number ) : void
	{
		const { device, id } = Device.instance;

		// Start over if the device changed.
		if ( this.#device !== id )
		{
			this.destroy();
			this.#device = id;
			this.#stride = Math.max ( MATRIX_BYTES, device.limits.minUniformBufferOffsetAlignment );
		}

		// Make a bigger buffer if we have to. Leave room to grow.
		if ( ( count > this.#capacity ) || !this.#buffer )
		{
			this.#buffer?.destroy();
			const capacity = Math.max ( 16, Math.ceil ( count * 1.5 ) );
			const buffer = device.createBuffer ( {
				label: `Uniform buffer for ${capacity} object matrices`,
				size: ( capacity * this.#stride ),
				usage: ( GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST ),
			} );
			this.#bindGroup = device.createBindGroup ( {
				label: "Bind group for object matrices",
				layout: ObjectMatrices.layout,
				entries: [ { binding: 0, resource: { buffer, size: MATRIX_BYTES } } ],
			} );
			this.#values = new Float32Array ( ( capacity * this.#stride ) / 4 );
			this.#buffer = buffer;
			this.#capacity = capacity;
		}

		this.#count = 0;
	}

	/**
	 * Add an object's matrix.
	 * @param {IMatrix44} matrix - The matrix.
	 * @returns {number} The offset to give bind().
	 */
	public add ( matrix: Readonly<IMatrix44> ) : number
	{
		if ( this.#count >= this.#capacity )
		{
			throw new Error ( `More than the ${this.#capacity} object matrices given to begin()` );
		}
		const offset = ( this.#count * this.#stride );
		this.#values.set ( matrix, ( offset / 4 ) );
		++this.#count;
		return offset;
	}

	/**
	 * Use the matrix at the offset for the next draw calls.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} offset - The offset that add() returned.
	 */
	public bind ( pass: GPURenderPassEncoder, offset: number ) : void
	{
		if ( !this.#bindGroup )
		{
			throw new Error ( "Binding object matrices before calling begin()" );
		}
		pass.setBindGroup ( OBJECT_BIND_GROUP, this.#bindGroup, [ offset ] );
	}

	/**
	 * Write the matrices to the buffer. Call this before submitting the
	 * commands that use them.
	 */
	public upload () : void
	{
		if ( this.#buffer && ( this.#count > 0 ) )
		{
			const bytes = ( this.#count * this.#stride );
			Device.instance.device.queue.writeBuffer ( this.#buffer, 0, this.#values, 0, ( bytes / 4 ) );
		}
	}

	/**
	 * Get how many matrices were added in this frame.
	 * @returns {number} The number of matrices.
	 */
	public get count () : number
	{
		return this.#count;
	}

	/**
	 * Destroy the buffer. It's made again by the next begin().
	 */
	public destroy () : void
	{
		this.#buffer?.destroy();
		this.#buffer = null;
		this.#bindGroup = null;
		this.#capacity = 0;
		this.#count = 0;
	}
}
