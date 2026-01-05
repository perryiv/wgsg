///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Math functions.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "./Constants";
import type {
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
} from "../Types";
import {
	quat,
	vec2,
	vec3,
	vec4,
} from "gl-matrix";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IClampInputType = number | IVector2 | IVector3 | IVector4;


///////////////////////////////////////////////////////////////////////////////
//
//	Return a new identity matrix.
//
///////////////////////////////////////////////////////////////////////////////

export const makeIdentity = () : IMatrix44 =>
{
	return [ ...IDENTITY_MATRIX ];
};


///////////////////////////////////////////////////////////////////////////////
//
//	Return the number clamped to the given range.
//
///////////////////////////////////////////////////////////////////////////////

const getClampedNumber = ( n: Readonly<number>, mn: Readonly<number>, mx: Readonly<number> ) : number =>
{
	return Math.max ( mn, Math.min ( mx, n ) );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Clamp the vector to the given range.
//
///////////////////////////////////////////////////////////////////////////////

const clampVec2 = ( v: IVector2, mn: Readonly<number>, mx: Readonly<number> ) : void =>
{
	v[0] = getClampedNumber ( v[0], mn, mx );
	v[1] = getClampedNumber ( v[1], mn, mx );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Clamp the vector to the given range.
//
///////////////////////////////////////////////////////////////////////////////

const clampVec3 = ( v: IVector3, mn: Readonly<number>, mx: Readonly<number> ) : void =>
{
	v[0] = getClampedNumber ( v[0], mn, mx );
	v[1] = getClampedNumber ( v[1], mn, mx );
	v[2] = getClampedNumber ( v[2], mn, mx );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Clamp the vector to the given range.
//
///////////////////////////////////////////////////////////////////////////////

const clampVec4 = ( v: IVector4, mn: Readonly<number>, mx: Readonly<number> ) : void =>
{
	v[0] = getClampedNumber ( v[0], mn, mx );
	v[1] = getClampedNumber ( v[1], mn, mx );
	v[2] = getClampedNumber ( v[2], mn, mx );
	v[3] = getClampedNumber ( v[3], mn, mx );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Clamp the number or vector to the given range.
//
///////////////////////////////////////////////////////////////////////////////

export const clamp = ( v: IClampInputType, mn: Readonly<number>, mx: Readonly<number> ) : IClampInputType =>
{
	if ( typeof v === "number" )
	{
		return getClampedNumber ( v, mn, mx );
	}

	else if ( 2 === v.length )
	{
		clampVec2 ( v, mn, mx );
		return v;
	}

	else if ( 3 === v.length )
	{
		clampVec3 ( v, mn, mx );
		return v;
	}

	else if ( 4 === v.length )
	{
		clampVec4 ( v, mn, mx );
		return v;
	}

	throw new Error ( "Invalid input type for clamp function" );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Normalize a 2D vector.
 * @param {IVector2} input - The vector to normalize.
 * @returns {IVector2} The normalized vector.
 */
///////////////////////////////////////////////////////////////////////////////

export const normalizeVec2 = ( input: Readonly<IVector2> ) : IVector2 =>
{
	const answer: IVector2 = [ 0, 0 ];
	vec2.normalize ( answer, input );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Normalize a 3D vector.
 * @param {IVector3} input - The vector to normalize.
 * @returns {IVector3} The normalized vector.
 */
///////////////////////////////////////////////////////////////////////////////

export const normalizeVec3 = ( input: Readonly<IVector3> ) : IVector3 =>
{
	const answer: IVector3 = [ 0, 0, 0 ];
	vec3.normalize ( answer, input );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Normalize a 4D vector.
 * @param {IVector4} input - The vector to normalize.
 * @returns {IVector4} The normalized vector.
 */
///////////////////////////////////////////////////////////////////////////////

export const normalizeVec4 = ( input: Readonly<IVector4> ) : IVector4 =>
{
	const answer: IVector4 = [ 0, 0, 0, 0 ];
	vec4.normalize ( answer, input );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Normalize a quaternion.
 * @param {IVector4} input - The quaternion to normalize.
 * @returns {IVector4} The normalized quaternion.
 */
///////////////////////////////////////////////////////////////////////////////

export const normalizeQuat = ( input: Readonly<IVector4> ) : IVector4 =>
{
	const answer: IVector4 = [ 0, 0, 0, 0 ];
	quat.normalize ( answer, input );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the midpoint between two 3D points.
 * @param {IVector3} out - The output vector.
 * @param {IVector3} a - The first point.
 * @param {IVector3} b - The second point.
 * @returns {IVector3} The midpoint.
 */
///////////////////////////////////////////////////////////////////////////////

export const midPoint = ( out: IVector3, a: Readonly<IVector3>, b: Readonly<IVector3> ): IVector3 =>
{
	vec3.add ( out, a, b );
	vec3.scale ( out, out, 0.5 );
	return out;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Fix the given angle by keeping it in the given range.
 * http://stackoverflow.com/questions/1628386/normalise-orientation-between-0-and-360
 * @param {number} angle - The angle to fix.
 * @param {number} low - The low end of the range.
 * @param {number} high - The high end of the range.
 * @returns {number} The fixed angle.
 */
///////////////////////////////////////////////////////////////////////////////

export const fixAngle = ( angle: number, low: number, high: number ) : number =>
{
  const width = high - low;
  const offsetValue = angle - low;
  return ( offsetValue - ( Math.floor ( offsetValue / width ) * width ) ) + low;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Return e^(-u)
 * @param {number} u - The input value in the range [0,1].
 * @returns {number} The output value in the range [0,1].
 */
///////////////////////////////////////////////////////////////////////////////

export const exponentialDecay = ( u: number ) : number =>
{
	// Handle when input is out of range.
  if ( u < 0 )
  {
    return 0;
  }
  if ( u > 1 )
  {
    return 1;
  }

  // See http://www.wolframalpha.com/input/?i=y%3De^-x
  u *= 6;
  u -= 3;
  u = Math.exp ( -u );
  u /= 20;

  // Return modified value.
  return u;
}
