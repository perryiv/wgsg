
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all nodes.
//
///////////////////////////////////////////////////////////////////////////////

import { Group } from "./Groups/Group";


///////////////////////////////////////////////////////////////////////////////
/**
 * Node class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Node extends Object
{
	#parents: Set < Group > = new Set < Group > ();

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		super();
	}


	/**
	 * Add a parent. This is for the Group class. Do not use it directly.
	 * @internal
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
