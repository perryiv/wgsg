
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

import { Base } from "../../Base/Base";
import { Group } from "./Groups/Group";
import { Visitor } from "../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Node class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Node extends Base
{
	#parents: Map < number, Group > = new Map < number,Group > ();

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		super();
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public abstract accept ( _: Visitor ): void;

	/**
	 * Add a parent. This is for the Group class. Do not use it directly.
	 * @internal
	 * @param {Group} parent - A new parent group.
	 */
	public addParent ( parent: Group )
	{
		// Shortcut.
		const parents = this.#parents;

		// Make sure the parent is not already in the set.
		if ( parents.has ( parent.id ) )
		{
			throw new Error ( "Given group is already a parent of this node" );
		}

		// Add the parent.
		parents.set ( parent.id, parent );
	}

	/**
	 * Remove a parent. This is for the Group class. Do not use it directly.
	 * @internal
	 * @param {number} id - The id of the parent group node to remove.
	 * @return {boolean} True if it worked, otherwise false.
	 */
	public removeParent ( id: number )
	{
		// Remove the parent.
		return this.#parents.delete ( id );
	}

	/**
	 * See if this node has the given parent.
	 * @param {number} id - The id of the parent to check.
	 * @return {boolean} True if we have the given parent, otherwise false.
	 */
	public hasParent ( id: number )
	{
		// Do we have the parent?
		return this.#parents.has ( id );
	}
}
