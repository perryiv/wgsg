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
//	A pool can also bind textures and their samplers, after the buffer. Then
//	each buffer has a bind group for each set of texture views and samplers
//	it's used with, kept with the views and samplers as weak keys, so a
//	texture that's made again gets a new bind group by itself.
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
	numTextures?: number; // How many textures, each a view and then a sampler, after the buffer.
}

// A texture view and sampler to bind after the buffer.
export interface IUniformPoolTexture
{
	view: GPUTextureView;
	sampler: GPUSampler;
}

interface IUniformPoolItem
{
	buffer: GPUBuffer;
	bindGroup: ( GPUBindGroup | null ); // Without a texture.
	textured: WeakMap < object, unknown >; // Nested by the views and samplers, then the bind group.
	values: ( Uint8Array | null ); // What was last written to the buffer.
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
	#numTextures: number;
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
	 * @param {number} [input.numTextures] - How many textures there are after
	 * the buffer, each a view (binding 1, 3, and so on) and a sampler (binding
	 * 2, 4, and so on).
	 */
	constructor ( { label, layout, size, numTextures }: Readonly<IUniformPoolInput> )
	{
		this.#label = label;
		this.#layout = layout;
		this.#size = size;
		this.#numTextures = ( numTextures ?? 0 );
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
	 * written to a buffer if they changed, unless that buffer already has them.
	 * @param {number} frame - The number of the frame being drawn.
	 * @param {boolean} changed - Whether the values changed since the last call.
	 * @param {ArrayBuffer} values - The uniform values.
	 * @param {IUniformPoolTexture[]} [textures] - The texture views and
	 * samplers, as many as the pool has.
	 * @returns {GPUBindGroup} The bind group.
	 */
	public use ( frame: number, changed: boolean, values: ArrayBuffer, textures?: readonly IUniformPoolTexture[] ) : GPUBindGroup
	{
		// Is this a new frame?
		if ( frame !== this.#frame )
		{
			this.startFrame ( frame );
		}

		// If the values did not change then the current buffer has them.
		else if ( false === changed )
		{
			return this.getBindGroup ( this.#items[this.#index], textures );
		}

		// The values changed, but maybe back to what the current buffer has.
		else if ( true === this.hasValues ( this.#items[this.#index], values ) )
		{
			return this.getBindGroup ( this.#items[this.#index], textures );
		}

		// The values changed and the current buffer is used by draw calls in
		// this frame, so use the next buffer.
		else
		{
			++this.#index;
		}

		// Get the buffer, making it if we have to. Write the values to it,
		// unless it already has them from an earlier frame.
		const item = this.getItem ( this.#index );
		if ( false === this.hasValues ( item, values ) )
		{
			Device.instance.device.queue.writeBuffer ( item.buffer, 0, values );
			item.values = new Uint8Array ( values.slice ( 0 ) );
		}
		return this.getBindGroup ( item, textures );
	}

	/**
	 * Get the item's bind group, with the textures if this pool has them.
	 * @param {IUniformPoolItem} item - The item.
	 * @param {IUniformPoolTexture[]} [textures] - The texture views and samplers.
	 * @returns {GPUBindGroup} The bind group.
	 */
	protected getBindGroup ( item: IUniformPoolItem, textures?: readonly IUniformPoolTexture[] ) : GPUBindGroup
	{
		// Without textures there is one bind group.
		const numTextures = this.#numTextures;
		if ( 0 === numTextures )
		{
			return item.bindGroup!;
		}
		if ( textures?.length !== numTextures )
		{
			throw new Error ( `Uniform pool ${this.#label} needs ${numTextures} textures` );
		}

		// Find it by its views and samplers, in order, making the maps along
		// the way. The last map has the bind group.
		const keys = textures.flatMap ( ( { view, sampler } ) => [ view, sampler ] );
		let map = item.textured;
		for ( const key of keys.slice ( 0, -1 ) )
		{
			let next = map.get ( key ) as ( WeakMap < object, unknown > | undefined );
			if ( !next )
			{
				next = new WeakMap();
				map.set ( key, next );
			}
			map = next;
		}
		const last = keys[keys.length - 1];
		let bindGroup = map.get ( last ) as ( GPUBindGroup | undefined );
		if ( !bindGroup )
		{
			const entries: GPUBindGroupEntry[] = [ { binding: 0, resource: { buffer: item.buffer } } ];
			textures.forEach ( ( { view, sampler }, i ) =>
			{
				entries.push ( { binding: ( 1 + ( 2 * i ) ), resource: view }, { binding: ( 2 + ( 2 * i ) ), resource: sampler } );
			} );
			bindGroup = Device.instance.device.createBindGroup ( {
				label: `Bind group for ${this.#label} with ${numTextures} textures`,
				layout: this.#layout,
				entries,
			} );
			map.set ( last, bindGroup );
		}
		return bindGroup;
	}

	/**
	 * See if the buffer already has the values.
	 * @param {IUniformPoolItem | undefined} item - The item, if there is one.
	 * @param {ArrayBuffer} values - The values.
	 * @returns {boolean} True if the buffer has the values.
	 */
	protected hasValues ( item: ( IUniformPoolItem | undefined ), values: ArrayBuffer ) : boolean
	{
		const old = item?.values;
		if ( old?.length !== values.byteLength )
		{
			return false;
		}
		const bytes = new Uint8Array ( values );
		for ( let i = 0; i < bytes.length; ++i )
		{
			if ( old[i] !== bytes[i] )
			{
				return false;
			}
		}
		return true;
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

			// Without textures, the bind group is made here. With textures, it's
			// made for each texture when needed.
			const bindGroup = ( ( this.#numTextures > 0 ) ? null : device.createBindGroup ( {
				label: `Bind group for ${label}`,
				layout: this.#layout,
				entries: [ {
					binding: 0,
					resource: { buffer }
				} ],
			} ) );

			this.#items.push ( { buffer, bindGroup, textured: new WeakMap(), values: null } );
		}

		return this.#items[index];
	}
}
