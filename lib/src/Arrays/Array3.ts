///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Generic 3D array stored as a 1D TypedArray.
//
///////////////////////////////////////////////////////////////////////////////

import { ArrayBase, type ArrayType1D } from "./ArrayBase";
import { IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IArray3Callback = ( vector: IVector3, index: number ) => void;


///////////////////////////////////////////////////////////////////////////////
/**
 * Array3 class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Array3 extends ArrayBase
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
		if ( 0 !== ( values.length % 3 ) )
		{
			throw new Error ( `Given length ${values.length} is not a multiple of 3` );
		}
	}

	/**
	 * Get the number of 3D vectors in this array.
	 * @returns {number} The number of 3D vectors in this array.
	 */
	public get numVectors() : number
	{
		return ( this.values.length / 3 );
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
	 * Get the 3D vector at the given index.
	 * @param {number} index - The index of the vector.
	 * @returns {IVector3} The 3D vector at the given index.
	 */
	public getVector ( index: number ) : IVector3
	{
		return [
			this.x0[index],
			this.x1[index],
			this.x2[index],
		];
	}

	/**
	 * Set the 3D vector at the given index.
	 * @param {number} index - The index of the vector.
	 * @param {IVector3} vector - The 3D vector to set.
	 */
	public setVector ( index: number, vector: IVector3 ) : void
	{
		this.x0[index] = vector[0];
		this.x1[index] = vector[1];
		this.x2[index] = vector[2];
	}

	/**
	 * Call the given function for each vector in this array.
	 * @param {IArray3Callback} cb - The function to call.
	 */
	public forEach ( cb: ( vector: IVector3, index: number ) => void ) : void
	{
		const num = this.numVectors;
		for ( let i = 0; i < num; ++i )
		{
			cb ( this.getVector ( i ), i );
		}
	}
}
