///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	3D line class.
//
//	Original code is:
//	https://github.com/perryiv/usul/blob/master/source/Usul/Math/Line.h
//
///////////////////////////////////////////////////////////////////////////////

import { vec3 } from "gl-matrix";
import { IMatrix44, IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	3D line class.
//
///////////////////////////////////////////////////////////////////////////////

export class Line
{
	#p0: IVector3 = [ 0, 0, 0 ];
	#p1: IVector3 = [ 0, 0, 1 ];

	/**
	 * Construct the class.
	 * @param {IVector3} start - The start point.
	 * @param {IVector3} end - The end point.
	 * @class
	 */
	constructor ( start?: Readonly<IVector3>, end?: Readonly<IVector3> )
	{
		if ( start )
		{
			vec3.copy ( this.#p0, start );
		}
		if ( end )
		{
			vec3.copy ( this.#p1, end );
		}
	}

	/**
	 * Clone the line.
	 * @returns {Line} - The cloned line.
	 */
	public clone(): Line
	{
		const line = new Line();
		line.setFromLine ( this );
		return line;
	}

	/**
	 * Get the start point.
	 * @returns {IVector3} - The start point.
	 */
	public get start(): IVector3
	{
		return this.#p0;
	}

	/**
	 * Set the start point.
	 * @param {IVector3} value - The new start point.
	 */
	public set start ( value: Readonly<IVector3> )
	{
		vec3.copy ( this.#p0, value );
	}

	/**
	 * Get the end point.
	 * @returns {IVector3} - The end point.
	 */
	public get end(): IVector3
	{
		return this.#p1;
	}

	/**
	 * Set the end point.
	 * @param {IVector3} value - The new end point.
	 */
	public set end ( value: Readonly<IVector3> )
	{
		vec3.copy ( this.#p1, value );
	}

	/**
	 * See if the line is valid.
	 * @returns {boolean} - True if the line is valid.
	 */
	public get valid(): boolean
	{
		return ( false === vec3.exactEquals ( this.#p0, this.#p1 ) );
	}

	/**
	 * Get the direction vector.
	 * @returns {IVector3} - The direction vector.
	 */
	public get direction(): IVector3
	{
		const dir: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( dir, this.#p1, this.#p0 );
		return dir;
	}

	/**
	 * Set the direction vector.
	 * @param {IVector3} dir - The new direction vector.
	 */
	public set direction ( dir: Readonly<IVector3> )
	{
		vec3.add ( this.#p1, this.#p0, dir );
	}

	/**
	 * Get the unit direction vector.
	 * @returns {IVector3} - The unit direction vector.
	 */
	public get unitDirection(): IVector3
	{
		let dir: IVector3 = this.direction;
		dir = [ dir[0], dir[1], dir[2] ];
		vec3.normalize ( dir, dir );
		return dir;
	}

	/**
	 * Set this line from another line.
	 * @param {Line} line - The line to copy from.
	 */
	public setFromLine ( line: Readonly<Line> ): void
	{
		const p0 = line.start;
		const p1 = line.end;

		vec3.copy ( this.#p0, p0 );
		vec3.copy ( this.#p1, p1 );
	}

	/**
	 * Set this line from two points.
	 * @param {IVector3} p0 - The start point.
	 * @param {IVector3} p1 - The end point.
	 */
	public setFromPoints ( p0: Readonly<IVector3>, p1: Readonly<IVector3> ): void
	{
		vec3.copy ( this.#p0, p0 );
		vec3.copy ( this.#p1, p1 );
	}

	/**
	 * Set this line from a point and a direction.
	 * @param {IVector3} pt - The start point.
	 * @param {IVector3} dir - The direction vector.
	 */
	public setFromPointAndDirection ( pt: Readonly<IVector3>, dir: Readonly<IVector3> ): void
	{
		vec3.copy ( this.#p0, pt );
		vec3.add ( this.#p1, pt, dir );
	}

	/**
	 * Normalize the line by making the length one.
	 */
	public normalize(): void
	{
		const dir = this.unitDirection;
		vec3.add ( this.#p1, this.#p0, dir );
	}

	/**
	 * Get the length of the line segment.
	 * @returns {number} - The length of the line segment.
	 */
	public get length(): number
	{
		return vec3.distance ( this.start, this.end );
	}

	/**
	 * Get the squared length of the line segment.
	 * @returns {number} - The squared length of the line segment.
	 */
	public get lengthSquared(): number
	{
		return vec3.squaredDistance ( this.start, this.end );
	}

	/**
	 * Get the point on the line at the given parameter.
	 * @param {number} u - The parameter.
	 * @returns {IVector3} - The point on the line.
	 */
	public getPoint ( u: number ): IVector3
	{
		const point: IVector3 = [ 0, 0, 0 ];
		vec3.lerp ( point, this.start, this.end, u );
		return point;
	}

	/**
	 * See if the two lines are equal.
	 * @param {Line} a - First line.
	 * @param {Line} b - Second line.
	 * @returns {boolean} - True if the lines are equal.
	 */
	public static equal ( a: Readonly<Line>, b: Readonly<Line> ): boolean
	{
		return (
			vec3.exactEquals ( a.start, b.start ) &&
			vec3.exactEquals ( a.end, b.end )
		);
	}

	/**
	 * Transform the line by a matrix.
	 * @param {Line} out - The output line.
	 * @param {IMatrix44} m - The transformation matrix.
	 * @param {Line} a - The input line.
	 * @returns {Line} The transformed line.
	 */
	public static transform ( out: Line, m: Readonly<IMatrix44>, a: Readonly<Line> ): Line
	{
		vec3.transformMat4 ( out.start, a.start, m );
		vec3.transformMat4 ( out.end, a.end, m );
		return out;
	}

	/**
	 * Transform the line by a matrix in place.
	 * @param {IMatrix44} m - The transformation matrix.
	 */
	public transform ( m: Readonly<IMatrix44> ): void
	{
		Line.transform ( this, m, this );
	}
}
