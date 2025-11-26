///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Validation functions.
//
///////////////////////////////////////////////////////////////////////////////

import type {
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the matrix is valid.
 * @param {IMatrix44} m - The matrix to check.
 * @returns {boolean} True if the matrix is valid, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isValidMatrix = ( m: Readonly<IMatrix44> ) =>
{
	// Get the array length.
	const length: number = m.length;

	// Check the length.
	if ( 16 !== length )
	{
		return false;
	}

	// Check all the elements.
	for ( let i = 0; i < 16; ++i )
	{
		if ( "number" !== ( typeof ( m[i] ) ) )
		{
			return false;
		}
		if ( false === isFinite ( m[i] ) )
		{
			return false;
		}
	}

	// If we get to here then the matrix is valid.
	return true;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the vector is valid.
 * @param {IVector4} m - The vector to check.
 * @returns {boolean} True if the vector is valid, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isValidVec4 = ( m: Readonly<IVector4> ) =>
{
	// Get the array length.
	const length: number = m.length;

	// Check the length.
	if ( 4 !== length )
	{
		return false;
	}

	// Check all the elements.
	if ( "number" !== ( typeof ( m[0] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[0] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[1] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[1] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[2] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[2] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[3] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[3] ) )
	{
		return false;
	}

	// If we get to here then the vector is valid.
	return true;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the vector is valid.
 * @param {IVector3} m - The vector to check.
 * @returns {boolean} True if the vector is valid, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isValidVec3 = ( m: Readonly<IVector3> ) =>
{
	// Get the array length.
	const length: number = m.length;

	// Check the length.
	if ( 3 !== length )
	{
		return false;
	}

	// Check all the elements.
	if ( "number" !== ( typeof ( m[0] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[0] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[1] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[1] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[2] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[2] ) )
	{
		return false;
	}

	// If we get to here then the vector is valid.
	return true;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the vector is valid.
 * @param {IVector2} m - The vector to check.
 * @returns {boolean} True if the vector is valid, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isValidVec2 = ( m: Readonly<IVector2> ) =>
{
	// Get the array length.
	const length: number = m.length;

	// Check the length.
	if ( 2 !== length )
	{
		return false;
	}

	// Check all the elements.
	if ( "number" !== ( typeof ( m[0] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[0] ) )
	{
		return false;
	}
	if ( "number" !== ( typeof ( m[1] ) ) )
	{
		return false;
	}
	if ( false === isFinite ( m[1] ) )
	{
		return false;
	}

	// If we get to here then the vector is valid.
	return true;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the given value is a finite number.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a number, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isFiniteNumber = ( value: unknown ) =>
{
	return ( Number.isFinite ( value ) );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the given value is a positive finite number.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a positive number, otherwise false.
 */
///////////////////////////////////////////////////////////////////////////////

export const isPositiveFiniteNumber = ( value: unknown ) =>
{
	if ( false == isFiniteNumber ( value ) )
	{
		return false;
	}
	if ( ( value as number ) <= 0 )
	{
		return false;
	}
	return true;
}
