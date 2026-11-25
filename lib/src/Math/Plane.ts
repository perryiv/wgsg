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

import { mat4, vec4 } from "gl-matrix";
import type { Box } from "./Box";
import type { Sphere } from "./Sphere";
import type {
	IContainment,
	IMatrix44,
	IPlane,
	IVector3,
	IVector4,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Scratch values, so that the functions below don't make new arrays.
//
///////////////////////////////////////////////////////////////////////////////

// A plain array, not mat4.create(), which makes a Float32Array. The math
// stays in double precision.
const scratchMatrix: IMatrix44 = [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   0, 0, 0, 1 ];


///////////////////////////////////////////////////////////////////////////////
/**
 * 3D plane class. The plane is the points ( x, y, z ) where
 * a * x + b * y + c * z + d = 0, and its four coefficients are kept with the
 * normal ( a, b, c ) unit length. Then the signed distance from a point to
 * the plane is the dot product of the normal and the point, plus d. Points
 * on the side the normal points to have positive distances, and are inside.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Plane
{
	#c: IVector4 = [ 0, 0, 1, 0 ];

	/**
	 * Construct the class. With no input, it's the plane z = 0, with the
	 * normal along positive z.
	 * @param {IPlane} input - The plane definition.
	 * @class
	 */
	constructor ( input?: Readonly<IPlane> )
	{
		if ( input )
		{
			if ( ( "coefficients" in input ) )
			{
				this.coefficients = input.coefficients;
			}
			else if ( ( "point" in input ) && ( "normal" in input ) )
			{
				this.setFromPointAndNormal ( input.point, input.normal );
			}
		}
	}

	/**
	 * Clone the plane.
	 * @returns {Plane} - The cloned plane.
	 */
	public clone(): Plane
	{
		return new Plane ( { coefficients: this.#c } );
	}

	/**
	 * Get the coefficients, with the normal unit length.
	 * @returns {IVector4} - The coefficients.
	 */
	public get coefficients(): IVector4
	{
		return [ ...this.#c ];
	}

	/**
	 * Set this plane from the coefficients. They are scaled so that the
	 * normal is unit length.
	 * @param {IVector4} coefficients - The new coefficients.
	 */
	public set coefficients ( coefficients: Readonly<IVector4> )
	{
		const c = coefficients;
		this.setFromCoefficients ( c[0], c[1], c[2], c[3] );
	}

	/**
	 * Get the point on the plane closest to the origin.
	 * @returns {IVector3} - The point.
	 */
	public get point(): IVector3
	{
		const [ a, b, c, d ] = this.#c;
		return [ -a * d, -b * d, -c * d ];
	}

	/**
	 * Move the plane so that it goes through the point, keeping its normal.
	 * @param {IVector3} point - The new point.
	 */
	public set point ( point: Readonly<IVector3> )
	{
		this.setFromPointAndNormal ( point, this.normal );
	}

	/**
	 * Get the unit-length normal vector.
	 * @returns {IVector3} - The normal vector.
	 */
	public get normal(): IVector3
	{
		const c = this.#c;
		return [ c[0], c[1], c[2] ];
	}

	/**
	 * Turn the plane to the new normal, around the point on it closest to
	 * the origin. The normal is made unit length.
	 * @param {IVector3} normal - The new normal vector.
	 */
	public set normal ( normal: Readonly<IVector3> )
	{
		this.setFromPointAndNormal ( this.point, normal );
	}

	/**
	 * See if the plane is valid. It's not when the normal is all zeros.
	 * @returns {boolean} - True if the plane is valid.
	 */
	public get valid(): boolean
	{
		const c = this.#c;
		return ( false === ( ( c[0] === 0 ) && ( c[1] === 0 ) && ( c[2] === 0 ) ) );
	}

	/**
	 * Return a string representation.
	 * @returns {string} The string representation.
	 */
	public toString(): string
	{
		const c = this.#c;
		return `{ coefficients: [ ${c[0]}, ${c[1]}, ${c[2]}, ${c[3]} ] }`;
	}

	/**
	 * Set this plane from another plane.
	 * @param {Plane} plane - The plane to copy from.
	 */
	public setFromPlane ( plane: Plane ): void
	{
		vec4.copy ( this.#c, plane.#c );
	}

	/**
	 * Set this plane from coefficients. They are scaled so that the normal is
	 * unit length. If the normal is all zeros, they are kept as they are, and
	 * the plane is not valid.
	 * @param {number} a - Coefficient a, the normal's x.
	 * @param {number} b - Coefficient b, the normal's y.
	 * @param {number} c - Coefficient c, the normal's z.
	 * @param {number} d - Coefficient d.
	 */
	public setFromCoefficients ( a: number, b: number, c: number, d: number ): void
	{
		vec4.set ( this.#c, a, b, c, d );
		this.normalize();
	}

	/**
	 * Set this plane from a point on it and its normal. The normal is made
	 * unit length.
	 * @param {IVector3} point - A point on the plane.
	 * @param {IVector3} normal - The normal vector.
	 */
	public setFromPointAndNormal ( point: Readonly<IVector3>, normal: Readonly<IVector3> ): void
	{
		const c = this.#c;
		vec4.set ( c, normal[0], normal[1], normal[2], 0 );
		this.normalize();
		c[3] = -( ( c[0] * point[0] ) + ( c[1] * point[1] ) + ( c[2] * point[2] ) );
	}

	/**
	 * Scale the coefficients so that the normal is unit length. The setters
	 * and transforms already do this, so it's rarely needed.
	 */
	public normalize(): void
	{
		const c = this.#c;
		const length = Math.hypot ( c[0], c[1], c[2] );
		if ( length > 0 )
		{
			vec4.scale ( c, c, ( 1 / length ) );
		}
	}

	/**
	 * Get the signed distance from the point to the plane. It's positive on
	 * the side the normal points to.
	 * @param {IVector3} point - The point.
	 * @returns {number} The signed distance.
	 */
	public distance ( point: Readonly<IVector3> ): number
	{
		const c = this.#c;
		return ( ( c[0] * point[0] ) + ( c[1] * point[1] ) + ( c[2] * point[2] ) + c[3] );
	}

	/**
	 * See where the sphere is compared to the plane. It's inside when all of
	 * it is on the side the normal points to, touching the plane or not. An
	 * invalid sphere is outside, because there is nothing in it.
	 * @param {Sphere} sphere - The sphere.
	 * @returns {IContainment} Inside, intersects, or outside.
	 */
	public classifySphere ( sphere: Readonly<Sphere> ): IContainment
	{
		if ( false === sphere.valid )
		{
			return "outside";
		}
		const distance = this.distance ( sphere.center );
		const { radius } = sphere;
		if ( distance < -radius )
		{
			return "outside";
		}
		if ( distance >= radius )
		{
			return "inside";
		}
		return "intersects";
	}

	/**
	 * See where the box is compared to the plane. It looks at the two corners
	 * at the ends of the diagonal that is closest to the normal. If the
	 * corner furthest along the normal is outside, the whole box is. If the
	 * corner furthest against the normal is inside, the whole box is. An
	 * invalid box is outside, because there is nothing in it.
	 * @param {Box} box - The box, with its sides along the axes.
	 * @returns {IContainment} Inside, intersects, or outside.
	 */
	public classifyBox ( box: Readonly<Box> ): IContainment
	{
		if ( false === box.valid )
		{
			return "outside";
		}

		const c = this.#c;
		const { min, max } = box;

		// The corner furthest along the normal, and the one furthest against it.
		const along: IVector3 = [
			( ( c[0] >= 0 ) ? max[0] : min[0] ),
			( ( c[1] >= 0 ) ? max[1] : min[1] ),
			( ( c[2] >= 0 ) ? max[2] : min[2] ),
		];
		const against: IVector3 = [
			( ( c[0] >= 0 ) ? min[0] : max[0] ),
			( ( c[1] >= 0 ) ? min[1] : max[1] ),
			( ( c[2] >= 0 ) ? min[2] : max[2] ),
		];

		if ( this.distance ( along ) < 0 )
		{
			return "outside";
		}
		if ( this.distance ( against ) >= 0 )
		{
			return "inside";
		}
		return "intersects";
	}

	/**
	 * See if the two planes are equal.
	 * @param {Plane} a - First plane.
	 * @param {Plane} b - Second plane.
	 * @returns {boolean} - True if the planes are equal.
	 */
	public static equal ( a: Plane, b: Plane ): boolean
	{
		return vec4.exactEquals ( a.#c, b.#c );
	}

	/**
	 * Multiply the plane's coefficients by the matrix, and make the normal
	 * unit length again. This is the step that transform() and toLocal()
	 * share. Use it directly when the same matrix is used for many planes,
	 * like the planes of a frustum.
	 * @param {Plane} out - The output plane. It can be the input plane.
	 * @param {Plane} a - The input plane.
	 * @param {IMatrix44} m - The matrix that multiplies the coefficients.
	 * @returns {Plane} The output plane.
	 */
	public static multiply ( out: Plane, a: Plane, m: Readonly<IMatrix44> ): Plane
	{
		vec4.transformMat4 ( out.#c, a.#c, m );
		out.normalize();
		return out;
	}

	/**
	 * Move the plane by the matrix: every point on the plane, moved by the
	 * matrix, is on the new plane. This multiplies the coefficients by the
	 * inverse transpose of the matrix.
	 * @param {Plane} out - The output plane. It can be the input plane.
	 * @param {Plane} a - The input plane.
	 * @param {IMatrix44} m - The matrix.
	 * @returns {Plane} The output plane.
	 * @throws {Error} If the matrix can't be inverted.
	 */
	public static transform ( out: Plane, a: Plane, m: Readonly<IMatrix44> ): Plane
	{
		if ( !mat4.invert ( scratchMatrix, m ) )
		{
			throw new Error ( "Cannot transform a plane by a matrix that can't be inverted" );
		}
		mat4.transpose ( scratchMatrix, scratchMatrix );
		return Plane.multiply ( out, a, scratchMatrix );
	}

	/**
	 * Get the same plane in the coordinates under a transform with the
	 * matrix, the coordinates of the transform's children. A point p in those
	 * coordinates is at m * p in the coordinates the plane is in now. It's
	 * the same as moving the plane by the inverse of the matrix, but it only
	 * needs the transpose, so it also works when the matrix can't be
	 * inverted.
	 * @param {Plane} out - The output plane. It can be the input plane.
	 * @param {Plane} a - The input plane.
	 * @param {IMatrix44} m - The matrix of the transform.
	 * @returns {Plane} The output plane.
	 */
	public static toLocal ( out: Plane, a: Plane, m: Readonly<IMatrix44> ): Plane
	{
		mat4.transpose ( scratchMatrix, m );
		return Plane.multiply ( out, a, scratchMatrix );
	}

	/**
	 * Move this plane by the matrix.
	 * @param {IMatrix44} m - The matrix.
	 * @throws {Error} If the matrix can't be inverted.
	 */
	public transform ( m: Readonly<IMatrix44> ): void
	{
		Plane.transform ( this, this, m );
	}

	/**
	 * Change this plane to the coordinates under a transform with the matrix.
	 * @param {IMatrix44} m - The matrix of the transform.
	 */
	public toLocal ( m: Readonly<IMatrix44> ): void
	{
		Plane.toLocal ( this, this, m );
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public toJSON() : object
	{
		return {
			coefficients: [ ...this.#c ]
		};
	}
}
