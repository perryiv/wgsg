///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	A pool of uniform buffers for one shader.
//
//	A shader is shared by many state groups, and each one can give it
//	different uniform values (e.g., the color). All the draw calls in a frame
//	are submitted together, and all writes to buffers happen before that, so
//	each set of values in a frame needs its own buffer. The pool hands them
//	out in order, starting over at the first one in each new frame, so the
//	same buffers are reused from frame to frame.
//
//	See also how Babylon.js does it in "Materials/uniformBuffer.ts".
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IUniformPoolInput
{
	label: string;
	layout: GPUBindGroupLayout;
	size: number;
}

interface IUniformPoolItem
{
	buffer: GPUBuffer;
	bindGroup: GPUBindGroup;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * A pool of uniform buffers, each with its bind group.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class UniformPool
{
	// Buffers that have not been needed in this many frames are destroyed.
	static #purgeFrames = 120;

	#label: string;
	#layout: GPUBindGroupLayout;
	#size: number;
	#items: IUniformPoolItem[] = [];
	#index = 0;
	#frame: ( number | null ) = null;
	#recent: number[] = [];

	/**
	 * Construct the class.
	 * @class
	 * @param {IUniformPoolInput} input - The input.
	 * @param {string} input.label - The label for the buffers and bind groups.
	 * @param {GPUBindGroupLayout} input.layout - The layout for the bind groups.
	 * @param {number} input.size - The size of each buffer in bytes.
	 */
	constructor ( { label, layout, size }: Readonly<IUniformPoolInput> )
	{
		this.#label = label;
		this.#layout = layout;
		this.#size = size;
	}

	/**
	 * Get the number of frames. Buffers that none of this many recent frames
	 * needed are destroyed.
	 * @returns {number} The number of frames.
	 */
	public static get purgeFrames () : number
	{
		return UniformPool.#purgeFrames;
	}

	/**
	 * Set the number of frames. Buffers that none of this many recent frames
	 * needed are destroyed.
	 * @param {number} frames - The number of frames. It has to be a positive integer.
	 */
	public static set purgeFrames ( frames: number )
	{
		if ( ( false === Number.isInteger ( frames ) ) || ( frames <= 0 ) )
		{
			throw new Error ( `Number of frames for purging uniform buffers has to be a positive integer, not ${frames}` );
		}
		UniformPool.#purgeFrames = frames;
	}

	/**
	 * Get the number of buffers in the pool.
	 * @returns {number} The number of buffers.
	 */
	public get length () : number
	{
		return this.#items.length;
	}

	/**
	 * Return the bind group to use for the next draw calls. The values are
	 * written to a buffer if they changed, or if this is a new frame.
	 * @param {number} frame - The number of the frame being drawn.
	 * @param {boolean} changed - Whether the values changed since the last call.
	 * @param {ArrayBuffer} values - The uniform values.
	 * @returns {GPUBindGroup} The bind group.
	 */
	public use ( frame: number, changed: boolean, values: ArrayBuffer ) : GPUBindGroup
	{
		// Is this a new frame?
		if ( frame !== this.#frame )
		{
			this.startFrame ( frame );
		}

		// If the values did not change then the current buffer has them.
		else if ( false === changed )
		{
			return this.#items[this.#index].bindGroup;
		}

		// The values changed and the current buffer is used by draw calls in
		// this frame, so use the next buffer.
		else
		{
			++this.#index;
		}

		// Get the buffer, making it if we have to, and write the values to it.
		const item = this.getItem ( this.#index );
		Device.instance.device.queue.writeBuffer ( item.buffer, 0, values );
		return item.bindGroup;
	}

	/**
	 * Destroy all the buffers.
	 */
	public destroy () : void
	{
		for ( const { buffer } of this.#items )
		{
			buffer.destroy();
		}
		this.#items = [];
		this.#index = 0;
		this.#frame = null;
		this.#recent = [];
	}

	/**
	 * Start a new frame. Destroy the buffers that have not been needed in the
	 * recent frames. This is safe because those frames have been submitted.
	 * @param {number} frame - The number of the new frame.
	 */
	protected startFrame ( frame: number ) : void
	{
		// If there was a previous frame then remember how many buffers it used.
		if ( null !== this.#frame )
		{
			const recent = this.#recent;
			recent.push ( this.#index + 1 );
			while ( recent.length > UniformPool.#purgeFrames )
			{
				recent.shift();
			}

			// Destroy the buffers that none of the recent frames needed.
			const needed = Math.max ( ...recent );
			while ( this.#items.length > needed )
			{
				this.#items.pop()?.buffer.destroy();
			}
		}

		// Start over at the first buffer.
		this.#frame = frame;
		this.#index = 0;
	}

	/**
	 * Get the item, making it if we have to.
	 * @param {number} index - The index of the item.
	 * @returns {IUniformPoolItem} The item.
	 */
	protected getItem ( index: number ) : IUniformPoolItem
	{
		// Make the item if we have to. The index is never more than one past
		// the end, because it only goes up by one.
		if ( index >= this.#items.length )
		{
			const device = Device.instance.device;
			const label = `${this.#label} ${index}`;

			const buffer = device.createBuffer ( {
				label: `Uniform buffer for ${label}`,
				size: this.#size,
				usage: ( GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST )
			} );

			const bindGroup = device.createBindGroup ( {
				label: `Bind group for ${label}`,
				layout: this.#layout,
				entries: [ {
					binding: 0,
					resource: { buffer }
				} ],
			} );

			this.#items.push ( { buffer, bindGroup } );
		}

		return this.#items[index];
	}
}
