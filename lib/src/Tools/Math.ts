
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Math related functions.
//
///////////////////////////////////////////////////////////////////////////////

import { IMatrix44 } from "../Types";


/**
 * See if the matrix is valid.
 * @param {IMatrix44} m - The matrix to check.
 * @returns {boolean} True if the matrix is valid, otherwise false.
 */
export const isValidMatrix = ( m: IMatrix44 ) =>
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


/**
 * See if the given value is a finite number.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a number, otherwise false.
 */
export const isFiniteNumber = ( value: unknown ) =>
{
	return ( Number.isFinite ( value ) );
}


/**
 * See if the given value is a positive finite number.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a positive number, otherwise false.
 */
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
