///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Functions for quaternions.
//
///////////////////////////////////////////////////////////////////////////////

import { quat } from "gl-matrix";
import type { IVector3 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the roll from the quaternion. Written by Leo.
 * @param {quat} q - The input quaternion [x, y, z, w].
 * @returns {number} The roll angle in radians.
 */
///////////////////////////////////////////////////////////////////////////////

export function getRoll ( q: Readonly<quat> ) : number
{
	const [ x, y, z, w ] = q;
	const sinr_cosp = 2 * ( w * x + y * z );
	const cosr_cosp = 1 - 2 * ( x * x + y * y );
	return Math.atan2 ( sinr_cosp, cosr_cosp );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the pitch from the quaternion. Written by Leo.
 * @param {quat} q - The input quaternion [x, y, z, w].
 * @returns {number} The pitch angle in radians.
 */
///////////////////////////////////////////////////////////////////////////////

export function getPitch ( q: Readonly<quat> ) : number
{
	const [ x, y, z, w ] = q;
	const sinp = 2 * ( w * y - z * x );
	if ( Math.abs ( sinp ) >= 1 )
	{
		return ( Math.sign ( sinp ) * Math.PI / 2 ); // Gimbal lock.
	}
	else
	{
		return Math.asin ( sinp );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the yaw from the quaternion. Written by Leo.
 * @param {quat} q - The input quaternion [x, y, z, w].
 * @returns {number} The yaw angle in radians.
 */
///////////////////////////////////////////////////////////////////////////////

export function getYaw ( q: Readonly<quat> ) : number
{
	const [ x, y, z, w ] = q;
	const siny_cosp = 2 * ( w * z + x * y );
	const cosy_cosp = 1 - 2 * ( y * y + z * z );
	return Math.atan2 ( siny_cosp, cosy_cosp );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Convert a quaternion to Euler angles (XYZ order).
 * @param {IVector3} out - The output array [x, y, z] in radians.
 * @param {quat} q - The input quaternion [x, y, z, w].
 */
///////////////////////////////////////////////////////////////////////////////

export function convertQuaternionToEulerAngles ( out: IVector3, q: Readonly<quat> ) : void
{
	out[0] = getRoll ( q );
	out[1] = getPitch ( q );
	out[2] = getYaw ( q );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the 3 Euler angles (XYZ order) from the given quaternion.
 * @param {quat} q - The input quaternion [x, y, z, w].
 * @returns {IVector3} The Euler angles [x, y, z] in radians.
 */
///////////////////////////////////////////////////////////////////////////////

export function toEulerAngles ( q: Readonly<quat> ) : IVector3
{
	const out: IVector3 = [ 0, 0, 0 ];
	convertQuaternionToEulerAngles ( out, q );
	return out;
}
