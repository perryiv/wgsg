
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

type ReadonlyNumber = Readonly < number >;


//////////////////////////////////////////////////////////////////////////
/**
 * See if the "bits" are in "n".
 * @param {ReadonlyNumber} n - The number to check.
 * @param {ReadonlyNumber} bits - The bits to check for.
 * @returns {boolean} True if the bits are present in the number.
 */
//////////////////////////////////////////////////////////////////////////

export function hasBits ( n: ReadonlyNumber, bits: ReadonlyNumber ) : boolean
{
	return ( ( n & bits ) === bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Add the "bits" to "n".
 * @param {ReadonlyNumber} n - The number to modify.
 * @param {ReadonlyNumber} bits - The bits to add.
 * @returns {number} The modified number with the bits added.
 */
//////////////////////////////////////////////////////////////////////////

export function addBits ( n: ReadonlyNumber, bits: ReadonlyNumber ) : number
{
	return ( n | bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Remove the "bits" from "n".
 * @param {ReadonlyNumber} n - The number to modify.
 * @param {ReadonlyNumber} bits - The bits to remove.
 * @returns {number} The modified number with the bits removed.
 */
//////////////////////////////////////////////////////////////////////////

export function removeBits ( n: ReadonlyNumber, bits: ReadonlyNumber ) : number
{
	return ( ( n & bits ) ? ( n ^ bits ) : n );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Toggle the "bits" in "n".
 * @param {ReadonlyNumber} n - The number to modify.
 * @param {ReadonlyNumber} bits - The bits to toggle.
 * @returns {number} The modified number with the bits toggled.
 */
//////////////////////////////////////////////////////////////////////////

export function toggleBits ( n: ReadonlyNumber, bits: ReadonlyNumber ) : number
{
	return ( n ^ bits );
}

//////////////////////////////////////////////////////////////////////////
/**
 * Set the "bits" in "n".
 * @param {ReadonlyNumber} n - The number to modify.
 * @param {ReadonlyNumber} bits - The bits to set.
 * @param {boolean} state - True to set the bits, false to clear them.
 * @returns {number} The modified number with the bits set or cleared.
 */
//////////////////////////////////////////////////////////////////////////

export function setBits ( n: ReadonlyNumber, bits: ReadonlyNumber, state: boolean ) : number
{
	return ( state ? ( addBits ( n, bits ) ) : ( removeBits ( n, bits ) ) );
}
