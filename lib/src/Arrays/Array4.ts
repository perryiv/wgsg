
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Generic 4D array stored as a 1D TypedArray.
//
///////////////////////////////////////////////////////////////////////////////

import { ArrayBase, type ArrayType1D } from "./ArrayBase";
import { IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IArray4Callback = ( vector: IVector4, index: number ) => void;


///////////////////////////////////////////////////////////////////////////////
/**
 * Array4 class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Array4 extends ArrayBase
{
	/**
	 * Construct the class.
	 * @class
	 * @param {ArrayType1D} values - Optional values for this array.
	 */
	constructor ( values: ArrayType1D )
	{
		super ( values );
	}

	/**
	 * Check the values. It will throw if there is a problem
	 * @param {ArrayType1D} values - Values for this array.
	 */
	protected override check ( values: ArrayType1D ) : void
	{
		if ( 0 !== ( values.length % 4 ) )
		{
			throw new Error ( `Given length ${values.length} is not a multiple of 4` );
		}
	}

	/**
	 * Get the number of 4D vectors in this array.
	 * @returns {number} The number of 4D vectors in this array.
	 */
	public get numVectors() : number
	{
		return ( this.values.length / 4 );
	}

	/**
	 * Get the index where the first coordinate starts.
	 * @readonly
	 */
	public readonly ix0: number = 0;

	/**
	 * Get the index where the second coordinate starts.
	 * @returns {number} The index where the second coordinate starts.
	 */
	public get ix1() : number
	{
		return ( this.ix0 + this.numVectors );
	}

	/**
	 * Get the index where the third coordinate starts.
	 * @returns {number} The index where the third coordinate starts.
	 */
	public get ix2() : number
	{
		return ( this.ix1 + this.numVectors );
	}

	/**
	 * Get the index where the fourth coordinate starts.
	 * @returns {number} The index where the fourth coordinate starts.
	 */
	public get ix3() : number
	{
		return ( this.ix2 + this.numVectors );
	}

	/**
	 * Get the values of the first coordinate.
	 * @returns {ArrayType1D} The values of the first coordinate.
	 */
	public get x0() : ArrayType1D
	{
		return this.values.subarray ( this.ix0, ( this.ix0 + this.numVectors ) );
	}

	/**
	 * Get the values of the second coordinate.
	 * @returns {ArrayType1D} The values of the second coordinate.
	 */
	public get x1() : ArrayType1D
	{
		return this.values.subarray ( this.ix1, ( this.ix1 + this.numVectors ) );
	}

	/**
	 * Get the values of the third coordinate.
	 * @returns {ArrayType1D} The values of the third coordinate.
	 */
	public get x2() : ArrayType1D
	{
		return this.values.subarray ( this.ix2, ( this.ix2 + this.numVectors ) );
	}

	/**
	 * Get the values of the fourth coordinate.
	 * @returns {ArrayType1D} The values of the fourth coordinate.
	 */
	public get x3() : ArrayType1D
	{
		return this.values.subarray ( this.ix3, ( this.ix3 + this.numVectors ) );
	}

	/**
	 * Get the 4D vector at the given index.
	 * @param {number} index - The index of the vector.
	 * @returns {IVector4} The 4D vector at the given index.
	 */
	public getVector ( index: number ) : IVector4
	{
		return [
			this.x0[index],
			this.x1[index],
			this.x2[index],
			this.x3[index],
		];
	}

	/**
	 * Set the 4D vector at the given index.
	 * @param {number} index - The index of the vector.
	 * @param {IVector4} vector - The 4D vector to set.
	 */
	public setVector ( index: number, vector: IVector4 ) : void
	{
		this.x0[index] = vector[0];
		this.x1[index] = vector[1];
		this.x2[index] = vector[2];
		this.x3[index] = vector[3];
	}

	/**
	 * Call the given function for each vector in this array.
	 * @param {IArray4Callback} cb - The function to call.
	 */
	public forEach ( cb: ( vector: IVector4, index: number ) => void ) : void
	{
		const num = this.numVectors;
		for ( let i = 0; i < num; ++i )
		{
			cb ( this.getVector ( i ), i );
		}
	}
}
