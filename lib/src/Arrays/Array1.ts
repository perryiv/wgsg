
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
	#device: Device;
	#values: InternalArrayType;
	#buffer: ( GPUBuffer | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {Device} device - The WebGPU device.
	 * @param {InternalArrayType} values - The values for this array.
	 */
	constructor ( device: Device, values: InternalArrayType )
	{
		this.#device = device;
		this.#values = values;
		this.#buffer = null;
	}

	/**
	 * Get the values.
	 * @returns {InternalArrayType} The values of this array.
	 */
	public get values() : InternalArrayType
	{
		return this.#values;
	}

	/**
	 * Set the values.
	 * @param {InternalArrayType} values - Values for this array.
	 */
	public set values ( values: InternalArrayType )
	{
		this.#values = values;
		this.#buffer = null;
	}

	/**
	 * Get the length of the array.
	 * @returns {number} The length of the array.
	 */
	public get length() : number
	{
		return this.values.length;
	}

	/**
	 * Get or make the WebGPU buffer.
	 * @returns {GPUBuffer} The WebGPU buffer.
	 */
	public get buffer() : GPUBuffer
	{
		// If the buffer is dirty...
		if ( !( this.#buffer ) )
		{
			// Shortcuts.
			const device = this.#device.device;
			const values = this.values;

			// Make the new buffer.
			const buffer = device.createBuffer ( {
		    label: "Array1 buffer",
    		size: values.byteLength,
    		usage: ( GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST )
  		} );

			// Fill the buffer with the values.
			device.queue.writeBuffer ( buffer, 0, values );

			// Set our member.
			this.#buffer = buffer;
		}

		// Return what we have.
		return this.#buffer;
	}
}
