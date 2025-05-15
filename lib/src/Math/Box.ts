///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Class representing a 3D bounding box.
//
//	Originally from:
//  https://github.com/perryiv/usul/blob/master/source/Usul/Math/Box.h
//
///////////////////////////////////////////////////////////////////////////////

import { IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Possible input for the box constructor.
//
///////////////////////////////////////////////////////////////////////////////

interface IBoxInput
{
	min: IVector3;
	max: IVector3;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * A 3D bounding box.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Box
{
	#min: IVector3 = [ Number.MAX_VALUE,	Number.MAX_VALUE,	Number.MAX_VALUE ];
	#max: IVector3 = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ];

	/**
	 * Construct the class.
	 * @param {IBoxInput} [input] - The input object containing min and max vectors.
	 * @class
	 */
	constructor ( input?: IBoxInput )
	{
		if ( input )
		{
			const { min, max } = input;
			this.#min = min;
			this.#max = max;
		}
	}

  /**
   * See if the box is valid. A box is valid if the minimum corner is
   * less than or equal to the maximum corner.
   * @returns {boolean} True if the box is valid, otherwise false.
   */
	public get valid(): boolean
  {
		return (
			( this.#min[0] <= this.#max[0] ) &&
			( this.#min[1] <= this.#max[1] ) &&
			( this.#min[2] <= this.#max[2] )
		);
	}

  /**
   * Get the minimum corner of the box.
   * @returns {IVector3} The minimum corner of the box.
   */
	public get min(): IVector3
  {
		return this.#min;
	}

  /**
   * Set the minimum corner of the box.
   * @param {IVector3} v - The new minimum corner of the box.
   */
	public set min ( v: IVector3 )
  {
		this.#min = v;
	}

  /**
   * Get the maximum corner of the box.
   * @returns {IVector3} The maximum corner of the box.
   */
	public get max(): IVector3
  {
		return this.#max;
	}

  /**
   * Set the maximum corner of the box.
   * @param {IVector3} v - The new maximum corner of the box.
   */
	public set max ( v: IVector3 )
  {
		this.#max = v;
	}

  /**
   * Get the size of the box.
   * @returns {IVector3} The size of the box.
   */
	public get size(): IVector3
  {
		return [
			( this.#max[0] - this.#min[0] ),
			( this.#max[1] - this.#min[1] ),
			( this.#max[2] - this.#min[2] ),
		];
	}

  /**
   * Get the center of the box.
   * @returns {IVector3} The center of the box.
   */
	public get center(): IVector3
  {
		return [
			( this.#min[0] + this.#max[0] ) * 0.5,
			( this.#min[1] + this.#max[1] ) * 0.5,
			( this.#min[2] + this.#max[2] ) * 0.5,
		];
	}

  /**
   * Get the radius of the smallest sphere that contains the box.
   * @returns {number} The radius of the box.
   */
	public get radius(): number
  {
    const dx = ( this.#max[0] - this.#min[0] );
    const dy = ( this.#max[1] - this.#min[1] );
    const dz = ( this.#max[2] - this.#min[2] );
    const distance = Math.sqrt ( ( dx * dx ) + ( dy * dy ) + ( dz * dz ) );
    return ( 0.5 * distance );
	}

  /**
   * Grow the box by the given point or box.
   * @param {Box | IVector3} value - The point or box to grow our box by.
   */
	public grow ( value: ( Box | IVector3 ) ): void
  {
    if ( value instanceof Box )
    {
      this.grow ( value.min );
      this.grow ( value.max );
    }
    else
    {
      this._grow ( value, 0 );
      this._grow ( value, 1 );
      this._grow ( value, 2 );
    }
	}

  /**
   * Grow the box by the given point.
   * @param {IVector3} v - The point to grow our box by.
   * @param {number} index - The index of the dimension to grow.
   * @private
   */
  private _grow ( v: IVector3, index: number ): void
  {
		const value = v[index];

    // Do both of these because if the box is invalid and it's grown by a
    // single point, then that point is both the new min and max.
		if ( value < this.#min[index] )
    {
			this.#min[index] = value;
		}
		if ( value > this.#max[index] )
    {
			this.#max[index] = value;
		}
	}

  /**
   * See if the two boxes are equal.
   * @param {Box} a - The first box.
   * @param {Box} b - The second box.
   * @static
   * @returns {boolean} True if the boxes are equal, otherwise false.
   */
	static equal ( a: Box, b: Box ): boolean
  {
		return (
			( a.min[0] === b.min[0] ) &&
      ( a.min[1] === b.min[1] ) &&
      ( a.min[2] === b.min[2] ) &&
      ( a.max[0] === b.max[0] ) &&
      ( a.max[1] === b.max[1] ) &&
      ( a.max[2] === b.max[2] )
		);
	}
}
