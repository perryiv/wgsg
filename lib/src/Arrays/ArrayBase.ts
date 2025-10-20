///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for arrays of 2D, 3D, and 4D vectors stored as a 1D TypedArray.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ArrayType1D = (
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
 * ArrayBase class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class ArrayBase
{
	#values: ArrayType1D;

	/**
	 * Construct the class.
	 * @class
	 * @param {ArrayType1D} values - Optional values for this array.
	 */
	constructor ( values: ArrayType1D )
	{
		this.check ( values );
		this.#values = values;
	}

	/**
	 * Check the values. It will throw if there is a problem
	 * @param {ArrayType1D} values - Values for this array.
	 */
	protected abstract check ( values: Readonly<ArrayType1D> ): void;

	/**
	 * Get the values.
	 * @returns {ArrayType1D} The values of this array.
	 */
	public get values() : ArrayType1D
	{
		return this.#values;
	}

	/**
	 * Set the values.
	 * @param {ArrayType1D} values - Values for this array.
	 */
	public set values ( values: ArrayType1D )
	{
		this.check ( values );
		this.#values = values;
	}
}
