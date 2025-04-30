
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Group class.
//
///////////////////////////////////////////////////////////////////////////////

import { Node } from "../Node";


///////////////////////////////////////////////////////////////////////////////
/**
 * Callback type.
 */
///////////////////////////////////////////////////////////////////////////////

export type IGroupCallback = ( ( node: Node ) => void );


///////////////////////////////////////////////////////////////////////////////
/**
 * Group class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Group extends Node
{
	#children: Node[] = [];

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Call the given function for each child node.
	 * @param {IGroupCallback} cb - Callback function.
	 */
	public forEachChild ( cb: IGroupCallback )
	{
		for ( const child of this.#children )
		{
			cb ( child );
		}
	}

	/**
	 * Add a child node.
	 * @param {Node | null | undefined} node - The node to add to the group.
	 */
	public addChild ( node: ( Node | null | undefined ) )
	{
		// Quietly handle invalid nodes.
		if ( !node )
		{
			return;
		}

		// This group is now one of the node's parents. Do this first because
		// it will throw if we're already a parent.
		node.addParent ( this );

		// Add the node to the array.
		// If we get to here then we know it won't be a repeat.
		this.#children.push ( node );
	}
}
