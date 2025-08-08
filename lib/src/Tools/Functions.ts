///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Misc functions.
//
///////////////////////////////////////////////////////////////////////////////

let nextId = 0;


/**
 * Get the next ID.
 * @returns {number} The next unique ID.
 */
export function getNextId()
{
	return ++nextId;
};


/**
 * Get the number of elements.
 * @param {T | null} array - The array to check.
 * @param {number} dimension - The dimension of the elements (e.g., 3 for points).
 * @returns {number} The number of elements.
 */
export function getNumElements < T extends { length: number } > ( array: ( T | null ), dimension: number ) : number
{
	// Handle invalid array.
	if ( !array )
	{
		return 0;
	}

	// Handle no elements.
	if ( array.length < 1 )
	{
		return 0;
	}

	// The length should be evenly divisible by the given dimension.
	if ( 0 !== ( array.length % dimension ) )
	{
		throw new Error ( `Array length ${array.length} is not evenly divisible by ${dimension}` );
	}

	// Return the number of elements.
	return ( array.length / dimension );
}
