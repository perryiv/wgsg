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
//
//	Sphere class.
//
///////////////////////////////////////////////////////////////////////////////

export class Sphere
{
	#c: IVector3 = [ 0, 0, 0 ];
	#r = 1;

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

	public get center(): IVector3
	{
		return this.#c;
	}

	public set center ( c: Readonly<IVector3> )
	{
		vec3.copy ( this.#c, c );
	}

	public get radius(): number
	{
		return this.#r;
	}

	public set radius ( r: number )
	{
		this.#r = r;
	}

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
		vec3.transformMat4 ( out.center, a.center, m );
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
