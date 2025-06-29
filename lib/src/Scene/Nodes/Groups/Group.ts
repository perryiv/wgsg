
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

import { Flags, Node } from "../Node";
import { Visitor } from "../../../Visitors/Visitor";
import { Box } from "../../../Math";
import { hasBits } from "../../../Tools";


///////////////////////////////////////////////////////////////////////////////
/**
 * Callback type.
 */
///////////////////////////////////////////////////////////////////////////////

export type IGroupCallback = ( ( node: Node ) => void );


///////////////////////////////////////////////////////////////////////////////
/**
 * Group class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Group extends Node
{
	#children: Node[] = [];
	#bounds: Box = new Box();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Nodes.Groups.Group";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public accept ( visitor: Visitor ): void
	{
		visitor.visitGroup ( this );
	}

	/**
	 * Get the bounds of this node.
	 * @returns {Box} The bounds of this node.
	 */
	protected getBounds() : Box
	{
		// Return the bounding box if it is valid.
		if ( true === this.#bounds.valid )
		{
			return this.#bounds;
		}

		// Make a new bounds.
		const answer = new Box();

		// Add each child's box to ours.
		this.forEachChild ( ( child: Node ) =>
		{
			// Handle when the child node does not add to the bounds.
			if ( false === hasBits ( child.flags, Flags.ADDS_TO_BOUNDS ) )
			{
				return;
			}

			// If the child has an invalid bounds then skip it.
			if ( false === child.bounds.valid )
			{
				return;
			}

			// Grow the answer.
			answer.growByBox ( child.bounds );
		} );

		// Save the answer for next time.
		this.#bounds = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Set the bounds of this node.
	 * @param {Box | null} bounds - The new bounds of this node.
	 */
	protected setBounds ( bounds: Box | null ): void
	{
		// If we were given a box then clone it.
		// Otherwise, make a new default box.
		// Note: We can clone an invalid box, but not a null box.
		this.#bounds = ( bounds ? bounds.clone() : new Box() );

		// Let the parents know that their bounds are now invalid.
		this.forEachParent ( ( parent: Node ) =>
		{
			parent.bounds = null;
		} );
	}

	/**
	 * Get the number of children.
	 * @returns {number} The number of child nodes.
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
	 * @returns {Node | null} The child node or null.
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
	 * @param {number} index - The index of the node to remove from the group.
	 * @returns {boolean} True if it worked, otherwise false.
	 */
	public removeChild ( index: number ) : boolean
	{
		// Get the child node at this position.
		const child = this.getChild ( index );

		// Handle invalid child node.
		if ( !child )
		{
			return false;
		}

		// Remove this group from the set of parents.
		const result = child.removeParent ( this.id );

		// Report the error if there is one.
		if ( false == result )
		{
			throw new Error ( `${child.type} ${child.id} at index ${index} failed to remove parent ${this.type} ${this.id}` );
		}

		// Remove the node from our array.
		const answer = this.#children.splice ( index, 1 );

		// Report the error if there is one.
		if ( 1 !== answer.length )
		{
			throw new Error ( `Failed to remove ${child.type} ${child.id} at index ${index} from ${this.type} ${this.id}` );
		}

		// If we get to here then it worked.
		return true;
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
			child.removeParent ( this.id );
		}

		// Reset the array of children.
		// TODO: Would it be better to assign the array to []?
		this.#children.length = 0;
	}
}
