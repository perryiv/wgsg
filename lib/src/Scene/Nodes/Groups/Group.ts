
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
	 * Get the number of children.
	 * @return {number} The number of child nodes.
	 */
	public get size() : number
	{
		return this.#children.length;
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

	/**
	 * Get the child node.
	 * @param {number} index - The array index of the child.
	 * @return {Node | null} The child node or null.
	 */
	public getChild ( index: number )
	{
		// Handle invalid indices.
		if ( ( index < 0 ) || ( index > this.size ) )
		{
			return null;
		}

		// Get the child node at this position.
		const child = this.#children[index];

		// Do not return undefined.
		return ( child ? child : null );
	}

	/**
	 * Remove a child node.
	 * @param {Node | null | undefined} node - The node to add to the group.
	 * @return {boolean} True if it worked, otherwise false.
	 */
	public removeChild ( index: number )
	{
		// Get the child node at this position.
		const child = this.getChild ( index );

		// Handle invalid child node.
		if ( !child )
		{
			return;
		}

		// Remove this group from the set of parents.
		child.removeParent ( this );

		// Remove the node from our array.
		this.#children.splice ( index, 1 );
	}

	/**
	 * Remove all of the child nodes.
	 */
	public clear ()
	{
		// Note: Could call removeChild() in a loop but this should be faster.

		// Tell all the children that we are no longer a parent.
		for ( const child of this.#children )
		{
			child.removeParent ( this );
		}

		// Reset the array of children.
		this.#children = [];
	}
}
