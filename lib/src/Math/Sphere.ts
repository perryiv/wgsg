///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Sphere class.
//
//	Original code is:
//	https://github.com/perryiv/usul/blob/master/source/Usul/Math/Sphere.h
//
///////////////////////////////////////////////////////////////////////////////

import { intersectLineSphere } from "./Intersect";
import { isFiniteNumber } from "./Validate";
import { midPoint } from "../Tools";
import { vec3 } from "gl-matrix";
import type { IMatrix44, IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Sphere class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Sphere
{
	#c: IVector3 = [ 0, 0, 0 ];
	#r = -1; // Invalid by default.

	/**
	 * Construct the class.
	 * @param {IVector3} center - The center.
	 * @param {number} radius - The radius.
	 * @class
	 */
	constructor ( center?: Readonly<IVector3>, radius?: number )
	{
		if ( center )
		{
			vec3.copy ( this.#c, center );
		}
		if ( radius !== undefined )
		{
			this.#r = radius;
		}
	}

	/**
	 * Clone the sphere.
	 * @returns {Sphere} The cloned sphere.
	 */
	public clone(): Sphere
	{
		return new Sphere ( this.center, this.radius );
	}

	/**
	 * Get the center.
	 * @returns {IVector3} The center.
	 */
	public get center(): Readonly<IVector3>
	{
		return this.#c;
	}

	/**
	 * Set the center.
	 * @param {IVector3} c - The center.
	 */
	public set center ( c: Readonly<IVector3> )
	{
		vec3.copy ( this.#c, c );
	}

	/**
	 * Get the radius.
	 * @returns {number} The radius.
	 */
	public get radius(): number
	{
		return this.#r;
	}

	/**
	 * Set the radius.
	 * @param {number} r - The radius.
	 */
	public set radius ( r: number )
	{
		this.#r = r;
	}

	/**
	 * Is the sphere valid?
	 * @returns {boolean} True if the sphere is valid.
	 */
	public get valid(): boolean
	{
		return ( this.#r >= 0 );
	}

	/**
	 * Invalidate the sphere.
	 */
	public invalidate(): void
	{
		this.#r = -1;
	}

	/**
	 * Return a string representation.
	 * @returns {string} The string representation.
	 */
	public toString(): string
	{
		const c = this.center;
		return `{ center: [ ${c[0]}, ${c[1]}, ${c[2]} ], radius: ${this.radius} }`;
	}

	/**
	 * See if the spheres are equal.
	 * @param {Sphere} a - The first sphere.
	 * @param {Sphere} b - The second sphere.
	 * @returns {boolean} True if the spheres are equal.
	 */
	public static equal ( a: Readonly<Sphere>, b: Readonly<Sphere> ): boolean
	{
		return (
			vec3.equals ( a.center, b.center ) &&
			( a.radius === b.radius )
		);
	}

	/**
	 * See if this sphere intersects another sphere.
	 * @param {Sphere} sphere - The other sphere.
	 * @returns {boolean} True if the spheres intersect.
	 */
	public intersectsSphere ( sphere: Readonly<Sphere> ): boolean
	{
		// If either sphere is invalid then they do not intersect.
		if ( false === this.valid || false === sphere.valid )
		{
			return false;
		}

		// Shortcuts.
		const c1 = this.center;
		const r1 = this.radius;
		const c2 = sphere.center;
		const r2 = sphere.radius;

		// Get the vector between the two centers, and its length squared.
		const d12: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( d12, c2, c1 );
		const dist2 = vec3.squaredLength ( d12 );

		// Get the sum of the radii squared.
		const rSum = r1 + r2;
		const rSum2 = rSum * rSum;

		// Do they intersect?
		return ( dist2 <= rSum2 );
	}

	/**
	 * See if the sphere intersects a line.
	 * @param {IVector3} start - The start of the line.
	 * @param {IVector3} end - The end of the line.
	 * @returns {boolean} True if the sphere intersects the line.
	 */
	public intersectsLine ( start: Readonly<IVector3>, end: Readonly<IVector3> ): boolean
	{
		// If the sphere is invalid then it does not intersect the line.
		if ( false === this.valid )
		{
			return false;
		}

		// Get the intersection.
		const answer = intersectLineSphere ( { line: { start, end }, sphere: this } );

		// The line intersects the sphere if there is at least one hit.
		return ( isFiniteNumber ( answer.u1 ) || isFiniteNumber ( answer.u2 ) );
	}

	/**
	 * See if the sphere contains another sphere.
	 * @param {Sphere} sphere - The other sphere.
	 * @returns {boolean} True if the sphere contains the other sphere.
	 */
	public containsSphere ( sphere: Readonly<Sphere> ): boolean
	{
		// If either sphere is invalid then we do not contain it.
		if ( false === this.valid || false === sphere.valid )
		{
			return false;
		}

		// Shortcuts.
		const c1 = this.center;
		const r1 = this.radius;
		const c2 = sphere.center;
		const r2 = sphere.radius;

		// Get the vector between the two centers, and its length.
		const d12: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( d12, c2, c1 );
		const dist = vec3.length ( d12 );

		// Do we contain the other sphere?
		return ( r1 >= ( dist + r2 ) );
	}

	/**
	 * See if the sphere contains a point.
	 * @param {IVector3} point - The point.
	 * @returns {boolean} True if the sphere contains the point.
	 */
	public containsPoint ( point: Readonly<IVector3> ): boolean
	{
		// If the sphere is invalid then it does not contain the point.
		if ( false === this.valid )
		{
			return false;
		}

		// Shortcuts.
		const c = this.center;
		const r = this.radius;

		// Get the vector from the center to the point, and its length squared.
		const d: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( d, point, c );
		const dist2 = vec3.squaredLength ( d );

		// Does the sphere contain the point?
		const r2 = r * r;
		return ( dist2 <= r2 );
	}

	/**
	 * Transform the sphere by a matrix.
	 * @param {Sphere} out - The output sphere.
	 * @param {IMatrix44} m - The transformation matrix.
	 * @param {Sphere} a - The input sphere.
	 * @returns {Sphere} The transformed sphere.
	 */
	public static transform ( out: Sphere, m: Readonly<IMatrix44>, a: Readonly<Sphere> ): Sphere
	{
		const center: IVector3 = [ ...out.center ];
		vec3.transformMat4 ( center, a.center, m );
		out.center = center;
		out.radius = a.radius;
		return out;
	}

  /**
   * Transform the sphere by a matrix in place.
   * @param {IMatrix44} m - The transformation matrix.
   */
  public transform ( m: Readonly<IMatrix44> ): void
  {
    Sphere.transform ( this, m, this );
  }

	/**
	 * Grow the sphere to include a point.
	 * @param {IVector3} point - The point.
	 */
	public growByPoint ( point: Readonly<IVector3> ): void
	{
		// If we are invalid then just set our center to the point and radius to zero.
		if ( false === this.valid )
		{
			this.center = point;
			this.radius = 0;
			return;
		}

		// Shortcuts.
		const c = this.center;
		const r = this.radius;

		// Get the vector from our center to the point, and its length.
		const dir: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( dir, point, c );
		const dist = vec3.length ( dir );

		// Do we already include the point?
		if ( dist <= r )
		{
			return;
		}

		// Normalize the direction from our center to the point.
		vec3.normalize ( dir, dir );

		// Get the farthest point on our sphere in the opposite direction.
		const p1: IVector3 = [ 0, 0, 0 ];
		vec3.scaleAndAdd ( p1, c, dir, -r );

		// The new center is halfway between those points.
		const c2: IVector3 = [ 0, 0, 0 ];
		midPoint ( c2, point, p1 );
		this.center = c2;

		// The new radius.
		this.radius = ( dist + r ) * 0.5;
	}

	/**
	 * Grow the sphere to include an array of points.
	 * @param {Float32Array | number[]} points - The array of points.
	 */
	public growByPoints ( points: Float32Array | number[] ): void
	{
		if ( 0 !== ( points.length % 3 ) )
		{
			throw new Error ( "Number of point not evenly divisible by 3" );
		}

		// Get the average point.
		let x = points[0];
		let y = points[1];
		let z = points[2];

		const length = points.length;
		for ( let i = 3; i < length; i += 3 )
		{
			x += points[ i     ];
			y += points[ i + 1 ];
			z += points[ i + 2 ];
		}

		const numPoints = length / 3;
		x /= numPoints;
		y /= numPoints;
		z /= numPoints;

		// Get the max radius squared from the average to the points.
		let r2 = 0;
		for ( let i = 0; i < length; i += 3 )
		{
			const dx = points[ i     ] - x;
			const dy = points[ i + 1 ] - y;
			const dz = points[ i + 2 ] - z;
			const d2 = ( dx * dx ) + ( dy * dy ) + ( dz * dz );
			if ( d2 > r2 )
			{
				r2 = d2;
			}
		}

		// Grow by a new sphere that includes the points.
		const sphere = new Sphere ( [ x, y, z ], Math.sqrt ( r2 ) );
		this.growBySphere ( sphere );
	}

	/**
	 * Grow the sphere to include another sphere.
	 * @param {Sphere} sphere - The other sphere.
	 */
	public growBySphere ( sphere: Readonly<Sphere> ): void
	{
		// If the given sphere is invalid then do nothing.
		if ( false === sphere.valid )
		{
			return;
		}

		// If we are invalid then assign our members from the given sphere.
		if ( false === this.valid )
		{
			this.center = sphere.center;
			this.radius = sphere.radius;
			return;
		}

		// Shortcuts.
		const c1 = this.center;
		const r1 = this.radius;
		const c2 = sphere.center;
		const r2 = sphere.radius;

		// Get the vector between the two centers, and its length.
		const d12: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( d12, c2, c1 );
		const dist = vec3.length ( d12 );

		// Do we already include the other sphere?
		if ( r1 >= ( dist + r2 ) )
		{
			return;
		}

		// Does the given sphere include us?
		if ( r2 >= ( dist + r1 ) )
		{
			this.center = c2;
			this.radius = r2;
			return;
		}

		// If we get to here then compute the new sphere.

		// Normalize the direction from our center to the other sphere's center.
		vec3.normalize ( d12, d12 );

		// Get the two farthest points.
		const p1: IVector3 = [ 0, 0, 0 ];
		const p2: IVector3 = [ 0, 0, 0 ];
		vec3.scaleAndAdd ( p1, c1, d12, -r1 );
		vec3.scaleAndAdd ( p2, c2, d12, r2 );

		// The new center is halfway between those points.
		const c3: IVector3 = [ 0, 0, 0 ];
		midPoint ( c3, p2, p1 );
		this.center = c3;

		// The new sphere's radius.
		this.radius = ( dist + r1 + r2 ) * 0.5;
	}
}
