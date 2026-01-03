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
