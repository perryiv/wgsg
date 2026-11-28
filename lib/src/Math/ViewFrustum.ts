///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The view frustum of a projection matrix: six planes.
//
///////////////////////////////////////////////////////////////////////////////

import { Frustum } from "./Frustum";
import { IDENTITY_MATRIX } from "./Constants";
import { Plane } from "./Plane";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	The index of each plane.
//
///////////////////////////////////////////////////////////////////////////////

const LEFT = 0;
const RIGHT = 1;
const BOTTOM = 2;
const TOP = 3;
const NEAR = 4;
const FAR = 5;


///////////////////////////////////////////////////////////////////////////////
/**
 * The view frustum of a projection matrix, in the coordinates the matrix
 * projects from (eye coordinates): the left, right, bottom, top, near, and
 * far planes, in that order, with their normals pointing in. It works for
 * perspective and orthographic projections.
 *
 * The planes are made from the rows of the matrix. A point is drawn when its
 * clip coordinates ( x, y, z, w ) have -w <= x <= w, -w <= y <= w, and
 * 0 <= z <= w. That last one is WebGPU's depth range. OpenGL's is
 * -w <= z <= w, and a matrix made for it draws only the far part of its
 * depth range in WebGPU. These planes are always where WebGPU clips.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ViewFrustum extends Frustum
{
	/**
	 * Construct the class.
	 * @param {IMatrix44} [matrix] - The projection matrix. The default is the
	 * identity, which makes a box from -1 to 1 in x and y, and 0 to 1 in z.
	 * @class
	 */
	constructor ( matrix?: Readonly<IMatrix44> )
	{
		super ( ViewFrustum.makePlanes ( matrix ?? IDENTITY_MATRIX ) );
	}

	/**
	 * Make the six planes of the projection matrix.
	 * @param {IMatrix44} m - The projection matrix.
	 * @returns {Plane[]} The left, right, bottom, top, near, and far planes.
	 */
	public static makePlanes ( m: Readonly<IMatrix44> ) : Plane[]
	{
		// The rows of the matrix, which is stored by columns.
		const r0 = [ m[0], m[4], m[8], m[12] ];
		const r1 = [ m[1], m[5], m[9], m[13] ];
		const r2 = [ m[2], m[6], m[10], m[14] ];
		const r3 = [ m[3], m[7], m[11], m[15] ];

		// Make a plane from a combination of the rows.
		const make = ( a: number[], sign: number, b: ( number[] | null ) ) : Plane =>
		{
			const c = ( b ?
				[ a[0] + sign * b[0], a[1] + sign * b[1], a[2] + sign * b[2], a[3] + sign * b[3] ] :
				[ a[0], a[1], a[2], a[3] ] );
			return new Plane ( { coefficients: [ c[0], c[1], c[2], c[3] ] } );
		};

		const planes: Plane[] = [];
		planes[LEFT] = make ( r3, 1, r0 );    // x >= -w
		planes[RIGHT] = make ( r3, -1, r0 );  // x <= w
		planes[BOTTOM] = make ( r3, 1, r1 );  // y >= -w
		planes[TOP] = make ( r3, -1, r1 );    // y <= w
		planes[NEAR] = make ( r2, 1, null );  // z >= 0
		planes[FAR] = make ( r3, -1, r2 );    // z <= w
		return planes;
	}

	/**
	 * Clone the frustum.
	 * @returns {ViewFrustum} The cloned frustum.
	 */
	public override clone(): ViewFrustum
	{
		const answer = new ViewFrustum();
		answer.setPlanes ( this.planes );
		return answer;
	}

	/**
	 * Set the planes from a projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public setFromMatrix ( matrix: Readonly<IMatrix44> ): void
	{
		this.setPlanes ( ViewFrustum.makePlanes ( matrix ) );
	}

	/**
	 * Get the left plane.
	 * @returns {Plane} The plane.
	 */
	public get left(): Readonly<Plane>
	{
		return this.getPlane ( LEFT );
	}

	/**
	 * Get the right plane.
	 * @returns {Plane} The plane.
	 */
	public get right(): Readonly<Plane>
	{
		return this.getPlane ( RIGHT );
	}

	/**
	 * Get the bottom plane.
	 * @returns {Plane} The plane.
	 */
	public get bottom(): Readonly<Plane>
	{
		return this.getPlane ( BOTTOM );
	}

	/**
	 * Get the top plane.
	 * @returns {Plane} The plane.
	 */
	public get top(): Readonly<Plane>
	{
		return this.getPlane ( TOP );
	}

	/**
	 * Get the near plane.
	 * @returns {Plane} The plane.
	 */
	public get near(): Readonly<Plane>
	{
		return this.getPlane ( NEAR );
	}

	/**
	 * Get the far plane.
	 * @returns {Plane} The plane.
	 */
	public get far(): Readonly<Plane>
	{
		return this.getPlane ( FAR );
	}
}
