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
//	https://github.com/perryiv/usul/blob/master/source/Usul/Math/Box.h
//
///////////////////////////////////////////////////////////////////////////////

import { vec3 } from "gl-matrix";
import { IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IBoxInput
{
	min: Readonly < IVector3 >;
	max: Readonly < IVector3 >;
};

interface IBoxCorners
{
	llb: Readonly < IVector3 >; // Lower left back
	lrb: Readonly < IVector3 >; // Lower right back
	ulb: Readonly < IVector3 >; // Upper left back
	urb: Readonly < IVector3 >; // Upper right back
	llf: Readonly < IVector3 >; // Lower left front
	lrf: Readonly < IVector3 >; // Lower right front
	ulf: Readonly < IVector3 >; // Upper left front
	urf: Readonly < IVector3 >; // Upper right front
};

///////////////////////////////////////////////////////////////////////////////
/**
 * A 3D bounding box.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Box
{
	#min: IVector3 = [ Number.MAX_VALUE,  Number.MAX_VALUE,  Number.MAX_VALUE ];
	#max: IVector3 = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ];

	/**
	 * Construct the class.
	 * @param {IBoxInput} [input] - The input object containing min and max vectors.
	 * @class
	 */
	constructor ( input?: Readonly < IBoxInput > )
	{
		if ( input )
		{
			const { min, max } = input;
			vec3.copy ( this.#min, min );
			vec3.copy ( this.#max, max );
		}
	}

	/**
	 * Clone our box, even if it is not valid.
	 * @returns {Box} A new box that is a copy of this one.
	 */
	public clone (): Box
	{
		return ( new Box ( {
			min: this.#min,
			max: this.#max,
		} ) );
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
	 * Invalidate this box.
	 */
	public invalidate(): void
	{
		this.#min = [  Number.MAX_VALUE,  Number.MAX_VALUE,  Number.MAX_VALUE ];
		this.#max = [ -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ];
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
	public set min ( v: Readonly < IVector3 > )
	{
		vec3.copy ( this.#min, v );
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
	public set max ( v: Readonly < IVector3 > )
	{
		vec3.copy ( this.#max, v );
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
	 * @returns {number} The radius of the box, or 0 if the box is invalid.
	 */
	public get radius(): number
	{
		// Get the size.
		const [ dx, dy, dz ] = this.size;

		// The user should first check if the box is valid.
		// If this happens then the box is invalid.
		if ( ( dx < 0 ) || ( dy < 0 ) || ( dz < 0 ) )
		{
			return 0;
		}

		// Calculate the diagonal distance, which is also the diameter of the
		// sphere that contains the box.
		const dist = Math.sqrt ( ( dx * dx ) + ( dy * dy ) + ( dz * dz ) );

		// Return the radius of the sphere.
		return ( 0.5 * dist );
	}

	/**
	 * Grow this box so that it contains the given box.
	 * @param {Box} box - The box to grow our box by.
	 */
	public growByBox ( box: Readonly < Box > ): void
	{
		this.growByPoint ( box.min );
		this.growByPoint ( box.max );
	}

	/**
	 * Grow this box so that it contains the given point.
	 * @param {IVector3} point - The point to grow our box by.
	 */
	public growByPoint ( point: Readonly < IVector3 > ): void
	{
		this.growByDimension ( point[0], 0 );
		this.growByDimension ( point[1], 1 );
		this.growByDimension ( point[2], 2 );
	}

	/**
	 * Grow this box by all the points in the given array.
	 * The point are assumed to be:
	 * [ x0, x1, ..., xn ]
	 * [ y0, y1, ..., yn ]
	 * [ z0, z1, ..., zn ]
	 * @param {number} num - The number of points to grow by.
	 * @param {Float32Array} x - The x coordinates of the points.
	 * @param {Float32Array} y - The y coordinates of the points.
	 * @param {Float32Array} z - The z coordinates of the points.
	 * @private
	 */
	public growByPoints ( num: number, x: Float32Array, y: Float32Array, z: Float32Array ): void
	{
		for ( let i = 0; i < num; ++i )
		{
			this.growByDimension ( x[i], 0 );
			this.growByDimension ( y[i], 1 );
			this.growByDimension ( z[i], 2 );
		}
	}

	/**
	 * Grow the box by the given dimension of a point.
	 * @param {number} value - The dimension value.
	 * @param {number} index - The index of the dimension to grow.
	 * @private
	 */
	private growByDimension ( value: Readonly < number >, index: number ): void
	{
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
	static equal ( a: Readonly < Box >, b: Readonly < Box > ): boolean
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

	/**
	 * See if the two boxes intersect.
	 * @param {Box} a - The first box.
	 * @param {Box} b - The second box.
	 * @static
	 * @returns {boolean} True if the boxes intersect, otherwise false.
	 */
	static intersect ( a: Readonly < Box >, b: Readonly < Box > ): boolean
	{
		return (
			( a.min[0] <= b.max[0] ) &&
			( a.min[1] <= b.max[1] ) &&
			( a.min[2] <= b.max[2] ) &&
			( a.max[0] >= b.min[0] ) &&
			( a.max[1] >= b.min[1] ) &&
			( a.max[2] >= b.min[2] )
		);
	}

	/**
	 * Get the corners of the box.
	 * @returns {IBoxCorners} The corners of the box.
	 */
	public get corners(): IBoxCorners
	{
		const min = this.min;
		const max = this.max;

		return {
			llb: [ min[0], min[1], min[2] ],
			lrb: [ max[0], min[1], min[2] ],
			ulb: [ min[0], max[1], min[2] ],
			urb: [ max[0], max[1], min[2] ],
			llf: [ min[0], min[1], max[2] ],
			lrf: [ max[0], min[1], max[2] ],
			ulf: [ min[0], max[1], max[2] ],
			urf: [ max[0], max[1], max[2] ],
		};
	}
}
