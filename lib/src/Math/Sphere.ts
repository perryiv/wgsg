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

import { IMatrix44, IVector3 } from "../Types";
import { vec3 } from "gl-matrix";


///////////////////////////////////////////////////////////////////////////////
/**
 * Sphere class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Sphere
{
	#c: IVector3 = [ 0, 0, 0 ];
	#r = 1;

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
	 * Return a string representation.
	 * @returns {string} The string representation.
	 */
	public toString(): string
	{
		const c = this.center;
		return `center: [ ${c[0]}, ${c[1]}, ${c[2]} ], radius: ${this.radius}`;
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
}
