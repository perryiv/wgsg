
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Primitive list class that uses indices.
//
///////////////////////////////////////////////////////////////////////////////

import { IPrimitivesInput, Primitives } from "./Primitives";
import { Draw as DrawVisitor } from "../../Visitors/Draw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

type IIndexType = ( Uint32Array | Uint16Array );
export interface IIndexedInput extends IPrimitivesInput
{
	indices: IIndexType;
}
export interface IIndexData
{
	data: ( IIndexType | null );
	buffer: ( GPUBuffer | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Primitive indexed class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Indexed extends Primitives
{
	#indices: IIndexData = { data: null, buffer: null };

	/**
	 * Construct the class.
	 * @class
	 * @param {IIndexedInput} [input] - Input for the constructor.
	 * @param {GPUPrimitiveTopology} [input.mode] - The primitive topology mode.
	 * @param {IIndexType} [input.indices] - The
	 */
	constructor ( input ?: IIndexedInput )
	{
		// Call this first.
		super ( input );

		// Is there input?
		if ( input?.indices )
		{
			this.indices = input.indices;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Primitives.Indexed";
	}

	/**
	 * Accept the draw-visitor.
	 * @param {DrawVisitor} visitor - The visitor object.
	 */
	public override accept ( visitor: DrawVisitor ): void
	{
		visitor.visitIndexed ( this );
	}

	/**
	 * Get the indices.
	 * @returns {IIndexType} The indices.
	 */
	get indices (): IIndexType
	{
		let indices = this.#indices.data;
		if ( !indices )
		{
			indices = new Uint32Array ( 0 );
			this.#indices.data = indices;
		}
		return indices;
	}

	/**
	 * Set the indices.
	 * @param {IIndexType} indices The indices.
	 */
	set indices ( indices: IIndexType )
	{
		// Do not copy. These arrays can be shared.
		this.#indices.data = indices;
	}

	/**
	 * Get the number of indices.
	 * @returns {number} The number of indices.
	 */
	get numIndices (): number
	{
		const indices = this.#indices.data;
		return ( indices ? indices.length : 0 );
	}

	/**
	 * Get the index type.
	 * @returns {GPUIndexFormat} The index type.
	 */
	get indexType (): GPUIndexFormat
	{
		// Shortcut.
		const indices = this.#indices.data;

		// Handle no indices.
		if ( !indices )
		{
			throw new Error ( "No indices when getting type" );
		}

		// Return the correct type.
		switch ( indices.BYTES_PER_ELEMENT )
		{
			case 2: return "uint16";
			case 4: return "uint32";
			default: throw new Error ( "Unknown index type" );
		}
	}

	/**
	 * Get the buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The buffer for this indexed primitive list.
	 */
	public getBuffer ( device?: GPUDevice ) : ( GPUBuffer | null )
	{
		// Shortcut.
		const indices = this.#indices;

		// If the buffer already exists then return it.
		if ( indices.buffer )
		{
			return indices.buffer;
		}

		// If we get to here then try to make the buffer.
		if ( indices.data && device )
		{
			// Make the buffer.
			indices.buffer = device.createBuffer ( {
				size: indices.data.byteLength,
				usage: ( GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST )
			} );

			// Write the data to the buffer.
			device.queue.writeBuffer ( indices.buffer, 0, indices.data, 0, indices.data.length );

			// Return the buffer.
			return indices.buffer;
		}

		// If we get to here then there is no buffer.
		return null;
	}

}
