
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

import { Group } from "./Groups/Group";

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all nodes.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Node class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Node
{
	#parents: Set < Group > = new Set < Group > ();

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	{
	}


	/**
	 * Add a parent.
	 * @param {Group} group - A new parent group.
	 */
	public addParent ( group: Group )
	{
		// Shortcut.
		const parents = this.#parents;

		// Make sure the parent is not already in the set.
		if ( parents.has ( group ) )
		{
			throw new Error ( "Given group is already a parent of this node" );
		}

		// Add the group as a parent.
		parents.add ( group );
	}
}
