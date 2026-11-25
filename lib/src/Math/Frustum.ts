///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	A frustum, made of any number of planes.
//
///////////////////////////////////////////////////////////////////////////////

import { mat4 } from "gl-matrix";
import { Plane } from "./Plane";
import type { Box } from "./Box";
import type { Sphere } from "./Sphere";
import type { IContainment, IMatrix44, IVector3 } from "../Types";


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
 * A frustum, made of any number of planes. A point is inside when it's on
 * the inside of every plane, the side its normal points to. The usual view
 * frustum has six planes (see ViewFrustum), but this class doesn't assume
 * that: a lasso, for example, makes one plane for each of its edges.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Frustum
{
	#planes: Plane[] = [];

	/**
	 * Construct the class.
	 * @param {Plane[]} [planes] - The planes, which are copied.
	 * @class
	 */
	constructor ( planes?: readonly Readonly<Plane>[] )
	{
		if ( planes )
		{
			this.setPlanes ( planes );
		}
	}

	/**
	 * Clone the frustum.
	 * @returns {Frustum} The cloned frustum.
	 */
	public clone(): Frustum
	{
		return new Frustum ( this.#planes );
	}

	/**
	 * Get the planes.
	 * @returns {Plane[]} The planes. Change them with setPlanes(), transform(),
	 * or toLocal().
	 */
	public get planes(): readonly Readonly<Plane>[]
	{
		return this.#planes;
	}

	/**
	 * Get the number of planes.
	 * @returns {number} The number of planes.
	 */
	public get numPlanes(): number
	{
		return this.#planes.length;
	}

	/**
	 * Get a plane.
	 * @param {number} index - The index of the plane.
	 * @returns {Plane} The plane.
	 */
	public getPlane ( index: number ): Readonly<Plane>
	{
		const plane = this.#planes[index];
		if ( !plane )
		{
			throw new Error ( `Invalid plane index ${index}, there are ${this.#planes.length} planes` );
		}
		return plane;
	}

	/**
	 * Set the planes, which are copied.
	 * @param {Plane[]} planes - The planes.
	 */
	public setPlanes ( planes: readonly Readonly<Plane>[] ): void
	{
		this.#planes = planes.map ( ( plane ) => plane.clone() );
	}

	/**
	 * See if the point is inside, or on the edge.
	 * @param {IVector3} point - The point.
	 * @returns {boolean} True if the point is inside or on the edge.
	 */
	public containsPoint ( point: Readonly<IVector3> ): boolean
	{
		for ( const plane of this.#planes )
		{
			if ( plane.distance ( point ) < 0 )
			{
				return false;
			}
		}
		return true;
	}

	/**
	 * See where the sphere is compared to the frustum. It's outside as soon
	 * as it's outside one plane, and inside when it's inside them all.
	 * Otherwise it intersects. A sphere just past a corner can be outside the
	 * frustum without being outside any one plane, and then it intersects.
	 * That's safe for culling, which only skips what's outside.
	 * @param {Sphere} sphere - The sphere.
	 * @returns {IContainment} Inside, intersects, or outside.
	 */
	public classifySphere ( sphere: Readonly<Sphere> ): IContainment
	{
		let answer: IContainment = "inside";
		for ( const plane of this.#planes )
		{
			const where = plane.classifySphere ( sphere );
			if ( "outside" === where )
			{
				return "outside";
			}
			if ( "intersects" === where )
			{
				answer = "intersects";
			}
		}
		return answer;
	}

	/**
	 * See where the box is compared to the frustum, in the same way as
	 * classifySphere().
	 * @param {Box} box - The box, with its sides along the axes.
	 * @returns {IContainment} Inside, intersects, or outside.
	 */
	public classifyBox ( box: Readonly<Box> ): IContainment
	{
		let answer: IContainment = "inside";
		for ( const plane of this.#planes )
		{
			const where = plane.classifyBox ( box );
			if ( "outside" === where )
			{
				return "outside";
			}
			if ( "intersects" === where )
			{
				answer = "intersects";
			}
		}
		return answer;
	}

	/**
	 * Move the frustum by the matrix. See Plane.transform().
	 * @param {IMatrix44} m - The matrix.
	 * @throws {Error} If the matrix can't be inverted.
	 */
	public transform ( m: Readonly<IMatrix44> ): void
	{
		if ( !mat4.invert ( scratchMatrix, m ) )
		{
			throw new Error ( "Cannot transform a frustum by a matrix that can't be inverted" );
		}
		mat4.transpose ( scratchMatrix, scratchMatrix );
		for ( const plane of this.#planes )
		{
			Plane.multiply ( plane, plane, scratchMatrix );
		}
	}

	/**
	 * Change the frustum to the coordinates under a transform with the
	 * matrix, the coordinates of the transform's children. See
	 * Plane.toLocal().
	 * @param {IMatrix44} m - The matrix of the transform.
	 */
	public toLocal ( m: Readonly<IMatrix44> ): void
	{
		mat4.transpose ( scratchMatrix, m );
		for ( const plane of this.#planes )
		{
			Plane.multiply ( plane, plane, scratchMatrix );
		}
	}

	/**
	 * Return a string representation.
	 * @returns {string} The string representation.
	 */
	public toString(): string
	{
		return `{ planes: [ ${this.#planes.map ( ( plane ) => plane.toString() ).join ( ", " )} ] }`;
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public toJSON() : object
	{
		return {
			planes: this.#planes.map ( ( plane ) => plane.toJSON() )
		};
	}
}
