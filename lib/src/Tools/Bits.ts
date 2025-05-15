
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Functions for working with bits.
//
//	Originally from:
//	https://github.com/perryiv/usul/blob/master/source/Usul/Bits/Bits.h
//
///////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////
/**
 * See if the "bits" are in "n".
 * @param {number} n - The number to check.
 * @param {number} bits - The bits to check for.
 * @returns {boolean} True if the bits are present in the number.
 */
//////////////////////////////////////////////////////////////////////////

export function hasBits ( n: Readonly < number >, bits: Readonly < number > ) : boolean
{
	return ( ( n & bits ) === bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Add the "bits" to "n".
 * @param {number} n - The number to modify.
 * @param {number} bits - The bits to add.
 * @returns {number} The modified number with the bits added.
 */
//////////////////////////////////////////////////////////////////////////

export function addBits ( n: Readonly < number >, bits: Readonly < number > ) : number
{
	return ( n | bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Remove the "bits" from "n".
 * @param {number} n - The number to modify.
 * @param {number} bits - The bits to remove.
 * @returns {number} The modified number with the bits removed.
 */
//////////////////////////////////////////////////////////////////////////

export function removeBits ( n: Readonly < number >, bits: Readonly < number > ) : number
{
	return ( ( n & bits ) ? ( n ^ bits ) : n );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Toggle the "bits" in "n".
 * @param {number} n - The number to modify.
 * @param {number} bits - The bits to toggle.
 * @returns {number} The modified number with the bits toggled.
 */
//////////////////////////////////////////////////////////////////////////

export function toggleBits ( n: Readonly < number >, bits: Readonly < number > ) : number
{
	return ( n ^ bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Set the "bits" in "n".
 * @param {number} n - The number to modify.
 * @param {number} bits - The bits to set.
 * @param {boolean} state - True to set the bits, false to clear them.
 * @returns {number} The modified number with the bits set or cleared.
 */
//////////////////////////////////////////////////////////////////////////

export function setBits ( n: Readonly < number >, bits: Readonly < number >, state: boolean ) : number
{
	return ( state ? ( addBits ( n, bits ) ) : ( removeBits ( n, bits ) ) );
}
