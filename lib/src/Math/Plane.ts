///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	3D plane class.
//
///////////////////////////////////////////////////////////////////////////////

import { vec3 } from "gl-matrix";
import type {
	IMatrix44,
	IPlane,
	IVector3,
	IVector4,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * 3D plane class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Plane
{
	#point: IVector3 = [ 0, 0, 0 ];
	#normal: IVector3 = [ 0, 0, 1 ];

	/**
	 * Construct the class.
	 * @param {IPlane} input - The plane definition.
	 * @class
	 */
	constructor ( input?: IPlane )
	{
		if ( input )
		{
			if ( ( "coefficients" in input ) )
			{
				this.coefficients = input.coefficients;
			}
			else if ( ( "point" in input ) && ( "normal" in input ) )
			{
				this.point = input.point;
				this.normal = input.normal;
			}
		}
	}

	/**
	 * Clone the plane.
	 * @returns {Plane} - The cloned plane.
	 */
	public clone(): Plane
	{
		return new Plane ( this );
	}

	/**
	 * Make the coefficients from the point and normal.
	 * @returns {IVector4} - The coefficients.
	 */
	public get coefficients(): IVector4
	{
		const n = this.#normal;
		const p = this.#point;
		const d = - ( n[0] * p[0] + n[1] * p[1] + n[2] * p[2] );
		return [ n[0], n[1], n[2], d ];
	}

	/**
	 * Set this plane from the coefficients.
	 * @param {IVector4} coefficients - The new coefficients.
	 */
	public set coefficients ( coefficients: Readonly<IVector4> )
	{
		const c = coefficients;
		this.setFromCoefficients ( c[0], c[1], c[2], c[3] );
	}

	/**
	 * Get the point.
	 * @returns {IVector3} - The point.
	 */
	public get point(): Readonly<IVector3>
	{
		return this.#point;
	}

	/**
	 * Set the point.
	 * @param {IVector3} point - The new point.
	 */
	public set point ( point: Readonly<IVector3> )
	{
		vec3.copy ( this.#point, point );
	}

	/**
	 * Get the normal vector.
	 * @returns {IVector3} - The normal vector.
	 */
	public get normal(): Readonly<IVector3>
	{
		return this.#normal;
	}

	/**
	 * Set the normal vector.
	 * @param {IVector3} normal - The new normal vector.
	 */
	public set normal ( normal: Readonly<IVector3> )
	{
		vec3.copy ( this.#normal, normal );
	}

	/**
	 * See if the plane is valid.
	 * @returns {boolean} - True if the plane is valid.
	 */
	public get valid(): boolean
	{
		const n = this.#normal;
		return ( false === ( ( n[0] === 0 ) && ( n[1] === 0 ) && ( n[2] === 0 ) ) );
	}

	/**
	 * Set this plane from another plane.
	 * @param {Plane} plane - The plane to copy from.
	 */
	public setFromPlane ( plane: Readonly<Plane> ): void
	{
		this.point = plane.point;
		this.normal = plane.normal;
	}

	/**
	 * Set this plane from coefficients.
	 * @param {number} A - Coefficient A.
	 * @param {number} B - Coefficient B.
	 * @param {number} C - Coefficient C.
	 * @param {number} D - Coefficient D.
	 */
	public setFromCoefficients ( A: number, B: number, C: number, D: number ): void
	{
		const p = this.#point;
		const n = this.#normal;

		n[0] = A;
		n[1] = B;
		n[2] = C;

		if ( ( n[0] === 0 ) && ( n[1] === 0 ) && ( n[2] === 0 ) )
		{
			p[0] = 0;
			p[1] = 0;
			p[2] = 0;
		}

		else
		{
			const t = - D / vec3.squaredLength ( n );
			p[0] = n[0] * t;
			p[1] = n[1] * t;
			p[2] = n[2] * t;
		}
	}

	/**
	 * Make the normal vector unit length.
	 */
	public normalize(): void
	{
		vec3.normalize ( this.#normal, this.#normal );
	}

	/**
	 * See if the two planes are equal.
	 * @param {Plane} a - First plane.
	 * @param {Plane} b - Second plane.
	 * @returns {boolean} - True if the planes are equal.
	 */
	public static equal ( a: Readonly<Plane>, b: Readonly<Plane> ): boolean
	{
		return (
			vec3.exactEquals ( a.point, b.point ) &&
			vec3.exactEquals ( a.normal, b.normal )
		);
	}

	/**
	 * Transform the plane by a matrix.
	 * @param {Plane} out - The output plane.
	 * @param {IMatrix44} m - The transformation matrix.
	 * @param {Plane} a - The input plane.
	 * @returns {Plane} The transformed plane.
	 */
	public static transform ( out: Plane, m: Readonly<IMatrix44>, a: Readonly<Plane> ): Plane
	{
		vec3.transformMat4 ( out.#normal, a.normal, m );
		return out;
	}

	/**
	 * Transform the plane by a matrix in place.
	 * @param {IMatrix44} m - The transformation matrix.
	 */
	public transform ( m: Readonly<IMatrix44> ): void
	{
		Plane.transform ( this, m, this );
	}
}
