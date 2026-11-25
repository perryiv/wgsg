///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Measures how long the GPU takes to draw a frame.
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * How the GPU time is measured.
 * - "timestamps": The GPU writes the time at the start and end of the render
 *   pass. This is accurate, though browsers round it (e.g., to 0.1 ms).
 * - "submitted": The time from submitting the commands until the browser
 *   says they are done. This includes waiting in the queue, so it is larger
 *   than the real GPU time. Used when the device has no timestamp queries.
 */
export type IGpuTimeMethod = ( "timestamps" | "submitted" );

/**
 * Called with the GPU time of a frame, in milliseconds.
 */
export type IGpuTimeCallback = ( time: number, method: IGpuTimeMethod ) => void;


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// Two 64-bit timestamps: the start and end of the render pass.
const NUM_BYTES = 16;

// The most frames that can wait for their times to be read. If the GPU falls
// further behind than this, frames are not timed until it catches up.
const MAX_READ_BUFFERS = 4;


///////////////////////////////////////////////////////////////////////////////
/**
 * Measures how long the GPU takes to draw a frame. For each frame, call
 * timestampWrites() and give the result to beginRenderPass(). When a frame
 * has more than one render pass, give the first pass only the beginning
 * write and the last pass only the end write, so the time covers them all.
 * Then call afterPass() after the last pass, before finishing the command
 * encoder, and afterSubmit() after submitting it. The time arrives later, in
 * the callback.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class GpuTimer
{
	#device: GPUDevice;
	#querySet: ( GPUQuerySet | null ) = null;
	#resolveBuffer: ( GPUBuffer | null ) = null;
	#freeBuffers: GPUBuffer[] = [];
	#numBuffers = 0;
	#current: ( GPUBuffer | null ) = null;
	#destroyed = false;

	/**
	 * Construct the class.
	 * @param {GPUDevice} device - The device to use.
	 * @class
	 */
	constructor ( device: GPUDevice )
	{
		this.#device = device;
	}

	/**
	 * Get how the time is measured with this device.
	 * @returns {IGpuTimeMethod} How the time is measured.
	 */
	public get method () : IGpuTimeMethod
	{
		return ( this.#device.features.has ( "timestamp-query" ) ? "timestamps" : "submitted" );
	}

	/**
	 * Get what to give beginRenderPass() so that the GPU writes the times.
	 * @returns {GPURenderPassTimestampWrites | undefined} The timestamp writes,
	 * or undefined if this frame is not timed with timestamps.
	 */
	public timestampWrites () : ( GPURenderPassTimestampWrites | undefined )
	{
		this.#current = null;

		if ( "timestamps" !== this.method )
		{
			return undefined;
		}

		// Get a buffer to read the times into. If none is free then skip it.
		const buffer = this.getFreeBuffer();
		if ( !buffer )
		{
			return undefined;
		}
		this.#current = buffer;

		// Make the query set if we have to.
		if ( !this.#querySet )
		{
			this.#querySet = this.#device.createQuerySet ( {
				label: "Query set for GPU timer",
				type: "timestamp",
				count: 2,
			} );
		}

		return {
			querySet: this.#querySet,
			beginningOfPassWriteIndex: 0,
			endOfPassWriteIndex: 1,
		};
	}

	/**
	 * Add the commands that copy the times to where we can read them.
	 * Call this after ending the render pass.
	 * @param {GPUCommandEncoder} encoder - The command encoder.
	 */
	public afterPass ( encoder: GPUCommandEncoder ) : void
	{
		const buffer = this.#current;
		const querySet = this.#querySet;
		if ( !buffer || !querySet )
		{
			return;
		}

		// Make the buffer the query set is resolved into, if we have to.
		if ( !this.#resolveBuffer )
		{
			this.#resolveBuffer = this.#device.createBuffer ( {
				label: "Resolve buffer for GPU timer",
				size: NUM_BYTES,
				usage: ( GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC ),
			} );
		}

		encoder.resolveQuerySet ( querySet, 0, 2, this.#resolveBuffer, 0 );
		encoder.copyBufferToBuffer ( this.#resolveBuffer, 0, buffer, 0, NUM_BYTES );
	}

	/**
	 * Get the time when it's ready. Call this after submitting the commands.
	 * @param {IGpuTimeCallback} callback - Called with the time.
	 */
	public afterSubmit ( callback: IGpuTimeCallback ) : void
	{
		// Without timestamps, time how long it takes to finish the work.
		if ( "submitted" === this.method )
		{
			const start = performance.now();
			this.#device.queue.onSubmittedWorkDone().then ( () =>
			{
				if ( false === this.#destroyed )
				{
					callback ( ( performance.now() - start ), "submitted" );
				}
			} ).catch ( () =>
			{
				// The device was lost or destroyed. Ignore it.
			} );
			return;
		}

		// Is this frame timed?
		const buffer = this.#current;
		this.#current = null;
		if ( !buffer )
		{
			return;
		}

		// Read the times when the GPU is done with them.
		buffer.mapAsync ( GPUMapMode.READ ).then ( () =>
		{
			if ( true === this.#destroyed )
			{
				return;
			}

			const [ begin, end ] = new BigUint64Array ( buffer.getMappedRange() );
			buffer.unmap();
			this.#freeBuffers.push ( buffer );

			// Some systems write zeros, or times that go backwards. Skip those.
			// The same time at both ends is fine: the pass took less than one
			// tick of the GPU's clock.
			if ( ( begin > BigInt ( 0 ) ) && ( end >= begin ) )
			{
				callback ( ( Number ( end - begin ) / 1e6 ), "timestamps" );
			}
		} ).catch ( () =>
		{
			// The buffer or device was destroyed. Ignore it.
		} );
	}

	/**
	 * Get a buffer to read the times into, making it if we have to.
	 * @returns {GPUBuffer | null} The buffer, or null if they are all in use.
	 */
	protected getFreeBuffer () : ( GPUBuffer | null )
	{
		const buffer = this.#freeBuffers.pop();
		if ( buffer )
		{
			return buffer;
		}

		if ( this.#numBuffers >= MAX_READ_BUFFERS )
		{
			return null;
		}

		++this.#numBuffers;
		return this.#device.createBuffer ( {
			label: `Read buffer ${this.#numBuffers} for GPU timer`,
			size: NUM_BYTES,
			usage: ( GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST ),
		} );
	}

	/**
	 * Destroy the GPU objects. Times that arrive after this are ignored.
	 */
	public destroy () : void
	{
		this.#destroyed = true;
		this.#querySet?.destroy();
		this.#resolveBuffer?.destroy();
		for ( const buffer of this.#freeBuffers )
		{
			buffer.destroy();
		}
		this.#querySet = null;
		this.#resolveBuffer = null;
		this.#freeBuffers = [];
		this.#current = null;
	}
}
