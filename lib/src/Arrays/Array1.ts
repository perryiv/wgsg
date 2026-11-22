///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Generic 1D combination of TypedArray and WebGPU buffer.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base/Base";
import { Device } from "../Tools/Device";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type PossibleArrayType = (
	Float64Array |
	Float32Array |
	Uint32Array |
	Uint16Array |
	Uint8Array |
	Int32Array |
	Int16Array |
	Int8Array
);


///////////////////////////////////////////////////////////////////////////////
/**
 * Array1 class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Array1 < InternalArrayType extends PossibleArrayType > extends BaseClass
{
	#values: ( InternalArrayType | null ) = null;
	#buffer: ( GPUBuffer | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {InternalArrayType} values - The values for this array.
	 */
	constructor ( values: InternalArrayType )
	{
		super();
		this.#values = values;
		this.#buffer = null;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Arrays.Array1";
	}

	/**
	 * Destroy this instance and its GPU buffer.
	 */
	public override destroy() : void
	{
		this.reset();
		super.destroy();
	}

	/**
	 * Get the values.
	 * @returns {InternalArrayType | null} The values of this array.
	 */
	public get values() : ( InternalArrayType | null )
	{
		return this.#values;
	}

	/**
	 * Set the values. If the array already has a GPU buffer of the right size
	 * and kind then the new values are written into it. Otherwise the old
	 * buffer is destroyed, and a new one is made when needed. Set the values
	 * between frames, not during the draw stage, because the draw calls that
	 * were already recorded still use the old buffer.
	 * @param {InternalArrayType | null} values - Values for this array.
	 */
	public set values ( values: ( InternalArrayType | null ) )
	{
		this.#values = values;

		// Can we write the new values into the buffer we have?
		const buffer = this.#buffer;
		if ( ( buffer ) && ( values ) &&
			( buffer.size === Array1.getBufferSize ( values ) ) &&
			( buffer.usage === Array1.getBufferUsage ( values ) ) )
		{
			Array1.writeValues ( buffer, values );
			return;
		}

		// Otherwise, destroy the buffer we have.
		this.reset();
	}

	/**
	 * Destroy the buffer. A new one is made when needed.
	 */
	public reset() : void
	{
		this.#buffer?.destroy();
		this.#buffer = null;
	}

	/**
	 * Called when nothing uses this array anymore. Destroy its GPU buffer.
	 * The values are kept, so a new buffer is made if it is used again.
	 */
	protected override onLastUnref() : void
	{
		this.reset();
	}

	/**
	 * Get the length of the array.
	 * @returns {number} The length of the array.
	 */
	public get length() : number
	{
		const values = this.values;
		return ( values ? values.length : 0 );
	}

	/**
	 * Get or try to make the WebGPU buffer.
	 * @returns {GPUBuffer | null} The WebGPU buffer.
	 */
	public get buffer() : ( GPUBuffer | null )
	{
		// Shortcuts.
		const values = this.#values;
		const buffer = this.#buffer;

		// If we have values and the buffer is dirty...
		if ( ( values ) && ( !buffer ) )
		{
			// Shortcuts.
			const device = Device.instance.device;

			// This should never happen.
			if ( !device )
			{
				throw new Error ( "No device when making buffer" );
			}

			// Make the new buffer and fill it with the values.
			const buffer = device.createBuffer ( {
				label: "Array1 buffer",
				size: Array1.getBufferSize ( values ),
				usage: Array1.getBufferUsage ( values ),
			} );
			Array1.writeValues ( buffer, values );

			// Set our member.
			this.#buffer = buffer;
		}

		// Return what we have.
		return this.#buffer;
	}

	/**
	 * Get the size of the GPU buffer for the values. WebGPU only writes whole
	 * groups of 4 bytes, so round the size up. This matters for arrays like a
	 * Uint16Array with an odd length.
	 * @param {PossibleArrayType} values - The values.
	 * @returns {number} The size in bytes.
	 */
	protected static getBufferSize ( values: Readonly<PossibleArrayType> ) : number
	{
		return ( Math.ceil ( values.byteLength / 4 ) * 4 );
	}

	/**
	 * Get the usage of the GPU buffer for the values.
	 * @param {PossibleArrayType} values - The values.
	 * @returns {number} The usage flags.
	 */
	protected static getBufferUsage ( values: Readonly<PossibleArrayType> ) : number
	{
		const usage = ( GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE );
		if (
			( values instanceof Float64Array ) ||
			( values instanceof Float32Array ) )
		{
			return ( usage | GPUBufferUsage.VERTEX );
		}
		if (
			( values instanceof Uint32Array ) ||
			( values instanceof Uint16Array ) ||
			( values instanceof Uint8Array ) )
		{
			return ( usage | GPUBufferUsage.INDEX );
		}
		throw new Error ( `Unknown array type: ${typeof values}` );
	}

	/**
	 * Write the values to the GPU buffer, which must be the right size.
	 * @param {GPUBuffer} buffer - The buffer.
	 * @param {PossibleArrayType} values - The values.
	 */
	protected static writeValues ( buffer: GPUBuffer, values: Readonly<PossibleArrayType> ) : void
	{
		// Pass the byte offset and length because the array may be a view into
		// part of a larger ArrayBuffer. If the size was rounded up then copy the
		// values into an array of the rounded size.
		const queue = Device.instance.device.queue;
		const size = Array1.getBufferSize ( values );
		if ( size === values.byteLength )
		{
			queue.writeBuffer ( buffer, 0, values.buffer, values.byteOffset, values.byteLength );
		}
		else
		{
			const padded = new Uint8Array ( size );
			padded.set ( new Uint8Array ( values.buffer, values.byteOffset, values.byteLength ) );
			queue.writeBuffer ( buffer, 0, padded );
		}
	}
}
