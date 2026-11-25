///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

import { IVector3, IVector4 } from "./Vector";


///////////////////////////////////////////////////////////////////////////////
//
//	Plane type.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPlaneCoefficients
{
	coefficients: IVector4;
}

export interface IPlanePointAndNormal
{
	point: IVector3;
	normal: IVector3;
}

export type IPlane = ( IPlaneCoefficients | IPlanePointAndNormal );

/**
 * Where something is compared to a plane or a frustum. For a plane, inside
 * is the side its normal points to. For a frustum, inside is the inside of
 * every plane.
 */
export type IContainment = ( "inside" | "intersects" | "outside" );
