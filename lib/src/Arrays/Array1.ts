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

export class Array1 < InternalArrayType extends PossibleArrayType >
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
		this.#values = values;
		this.#buffer = null;
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
	 * Set the values.
	 * @param {InternalArrayType | null} values - Values for this array.
	 */
	public set values ( values: ( InternalArrayType | null ) )
	{
		this.#values = values;
		this.reset();
	}

	/**
	 * Reset the buffer.
	 */
	public reset() : void
	{
		this.#buffer = null;
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

			// Determine the usage.
			let usage = ( GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE );
			if (
				( values instanceof Float64Array ) ||
				( values instanceof Float32Array ) )
			{
				usage |= GPUBufferUsage.VERTEX;
			}
			else if (
				( values instanceof Uint32Array ) ||
				( values instanceof Uint16Array ) ||
				( values instanceof Uint8Array ) )
			{
				usage |= GPUBufferUsage.INDEX;
			}
			else
			{
				throw new Error ( `Unknown array type: ${typeof values}` );
			}

			// WebGPU only writes whole groups of 4 bytes, so round the size up.
			// This matters for arrays like a Uint16Array with an odd length.
			const size = ( Math.ceil ( values.byteLength / 4 ) * 4 );

			// Make the new buffer.
			const buffer = device.createBuffer ( {
				label: "Array1 buffer",
				size,
				usage
			} );

			// Fill the buffer with the values. Pass the byte offset and length
			// because the array may be a view into part of a larger ArrayBuffer.
			// If the size was rounded up then copy the values into an array of
			// the rounded size.
			if ( size === values.byteLength )
			{
				device.queue.writeBuffer ( buffer, 0, values.buffer, values.byteOffset, values.byteLength );
			}
			else
			{
				const padded = new Uint8Array ( size );
				padded.set ( new Uint8Array ( values.buffer, values.byteOffset, values.byteLength ) );
				device.queue.writeBuffer ( buffer, 0, padded );
			}

			// Set our member.
			this.#buffer = buffer;
		}

		// Return what we have.
		return this.#buffer;
	}
}
