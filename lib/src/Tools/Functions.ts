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

import { DEVELOPER_BUILD } from "./Constants";


///////////////////////////////////////////////////////////////////////////////
//
//	Variables needed below.
//
///////////////////////////////////////////////////////////////////////////////

const devNextIds = new Map < string, number > ();
let prodNextId = 0;


/**
 * Get the next ID.
 * @param {string | undefined} key - The key for which to get the next ID.
 * @returns {number} The next unique ID.
 */
function devGetNextId ( key?: string ) : number
{
	if ( ( !key ) || ( key.length < 1 ) )
	{
		throw new Error ( `Invalid key '${key}' when getting the next ID` );
	}

	if ( false === devNextIds.has ( key ) )
	{
		devNextIds.set ( key, 1 );
	}

	const id = devNextIds.get ( key );

	if ( undefined === id )
	{
		throw new Error ( `Unexpected undefined ID for key: ${key}` );
	}

	devNextIds.set ( key, ( id + 1 ) );

	return id;
};


/**
 * Get the next ID.
 * @returns {number} The next unique ID.
 */
function prodGetNextId () : number
{
	return ( ++prodNextId );
}


/**
 * Export the appropriate function based on the build type.
 * @param {string | undefined} key - The key for which to get the next ID (developer build only).
 * @returns {number} The next unique ID.
 */
export const getNextId = ( ( DEVELOPER_BUILD ) ? devGetNextId : prodGetNextId );


/**
 * Get the number of elements.
 * @param {T | null} array - The array to check.
 * @param {number} dimension - The dimension of the elements (e.g., 3 for points).
 * @returns {number} The number of elements.
 */
export function getNumElements < T extends { length: Readonly<number> } > ( array: ( T | null ), dimension: Readonly<number> ) : number
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
