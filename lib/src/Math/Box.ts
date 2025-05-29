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
	 * @param {Box} box - The other box.
	 * @returns {boolean} True if the boxes intersect, otherwise false.
	 */
	public intersectsBox ( box: Readonly < Box > ): boolean
	{
		// Shortcuts to the min and max corners of the boxes.
		const amn = this.min;
		const amx = this.max;
		const bmn = box.min;
		const bmx = box.max;

		// See if the boxes intersect.
		return (
			( amn[0] <= bmx[0] ) &&
			( amn[1] <= bmx[1] ) &&
			( amn[2] <= bmx[2] ) &&
			( amx[0] >= bmn[0] ) &&
			( amx[1] >= bmn[1] ) &&
			( amx[2] >= bmn[2] )
		);
	}

	/**
	 * See if the box contains the given box.
	 * @param {Box} box - The box to check.
	 * @returns {boolean} True if this box contains the given box, otherwise false.
	 */
	public containsBox ( box: Readonly < Box > ): boolean
	{
		// Shortcuts to the min and max corners of the boxes.
		const amn = this.min;
		const amx = this.max;
		const bmn = box.min;
		const bmx = box.max;

		// See if this box contains the other box.
		return (
			( amn[0] <= bmn[0] ) &&
			( amn[1] <= bmn[1] ) &&
			( amn[2] <= bmn[2] ) &&
			( amx[0] >= bmx[0] ) &&
			( amx[1] >= bmx[1] ) &&
			( amx[2] >= bmx[2] )
		);
	}

	/**
	 * See if the box intersects the given sphere.
	 * @param {IVector3} center - The center of the sphere.
	 * @param {number} radius - The radius of the sphere.
	 * @returns {boolean} True if the box intersects the sphere, otherwise false.
	 */
	public intersectsSphere ( center: Readonly < IVector3 >, radius: number ): boolean
	{
		// Shortcuts to the min and max corners of the box.
		const mn = this.min;
		const mx = this.max;
		const [ cx, cy, cz ] = center;

		// See if the box intersects the sphere.
		return (
			( ( cx - radius ) <= mx[0] ) &&
			( ( cy - radius ) <= mx[1] ) &&
			( ( cz - radius ) <= mx[2] ) &&
			( ( cx + radius ) >= mn[0] ) &&
			( ( cy + radius ) >= mn[1] ) &&
			( ( cz + radius ) >= mn[2] )
		);
	}

	/**
	 * See if the box contains the given sphere.
	 * @param {IVector3} center - The center of the sphere.
	 * @param {number} radius - The radius of the sphere.
	 * @returns {boolean} True if this box contains the sphere, otherwise false.
	 */
	public containsSphere ( center: Readonly < IVector3 >, radius: number ): boolean
	{
		// Shortcuts to the min and max corners of the box.
		const mn = this.min;
		const mx = this.max;
		const [ cx, cy, cz ] = center;

		// See if this box contains the sphere.
		return (
			( ( cx - radius ) >= mn[0] ) &&
			( ( cy - radius ) >= mn[1] ) &&
			( ( cz - radius ) >= mn[2] ) &&
			( ( cx + radius ) <= mx[0] ) &&
			( ( cy + radius ) <= mx[1] ) &&
			( ( cz + radius ) <= mx[2] )
		);
	}

	/**
	 * See if the box intersects the given infinite line (i.e., not a line-segment or ray).
	 * @param {IVector3} p0 - The first point of the line.
	 * @param {IVector3} p1 - The second point of the line.
	 * @returns {boolean} True if the box intersects the line, otherwise false.
	 */
	public intersectsLine ( p0: Readonly < IVector3 >, p1: Readonly < IVector3 > ): boolean
	{
		// Shortcuts.
		const min = this.min;
		const max = this.max;

		// Get the direction of the line.
		const dx = p1[0] - p0[0];
		const dy = p1[1] - p0[1];
		const dz = p1[2] - p0[2];

		//
		// TODO: No idea how this works or if it's correct.
		// Copilot wrote it. The small number of tests pass.
		//

		let txmin = ( min[0] - p0[0] ) / dx;
		let txmax = ( max[0] - p0[0] ) / dx;

		if ( txmin > txmax )
		{
			const temp = txmin;
			txmin = txmax;
			txmax = temp;
		}

		let tymin = ( min[1] - p0[1] ) / dy;
		let tymax = ( max[1] - p0[1] ) / dy;

		if ( tymin > tymax )
		{
			const temp = tymin;
			tymin = tymax;
			tymax = temp;
		}

		if ( ( txmin > tymax ) || ( tymin > txmax ) )
		{
			return false;
		}

		if ( tymin > txmin )
		{
			txmin = tymin;
		}

		if ( tymax < txmax )
		{
			txmax = tymax;
		}

		let tzmin = ( min[2] - p0[2] ) / dz;
		let tzmax = ( max[2] - p0[2] ) / dz;

		if ( tzmin > tzmax )
		{
			const temp = tzmin;
			tzmin = tzmax;
			tzmax = temp;
		}

		return !( ( txmin > tzmax ) || ( tzmin > txmax ) );
	}

	/**
	 * See if the box contains the given point.
	 * @param {IVector3} point - The point to check.
	 * @returns {boolean} True if the box contains the point, otherwise false.
	 */
	public containsPoint ( point: Readonly < IVector3 > ): boolean
	{
		const mn = this.min;
		const mx = this.max;

		return (
			( point[0] >= mn[0] ) &&
			( point[1] >= mn[1] ) &&
			( point[2] >= mn[2] ) &&
			( point[0] <= mx[0] ) &&
			( point[1] <= mx[1] ) &&
			( point[2] <= mx[2] )
		);
	}

	/**
	 * Get the corners of the box.
	 * @returns {IBoxCorners} The corners of the box.
	 */
	public get corners(): IBoxCorners
	{
		const mn = this.min;
		const mx = this.max;

		return {
			llb: [ mn[0], mn[1], mn[2] ],
			lrb: [ mx[0], mn[1], mn[2] ],
			ulb: [ mn[0], mx[1], mn[2] ],
			urb: [ mx[0], mx[1], mn[2] ],
			llf: [ mn[0], mn[1], mx[2] ],
			lrf: [ mx[0], mn[1], mx[2] ],
			ulf: [ mn[0], mx[1], mx[2] ],
			urf: [ mx[0], mx[1], mx[2] ],
		};
	}
}
