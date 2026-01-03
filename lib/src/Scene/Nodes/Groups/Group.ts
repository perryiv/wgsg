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

import { Visitor } from "../../../Visitors/Visitor";
import { Box, Sphere } from "../../../Math";
import { hasBits } from "../../../Tools";
import {
	Flags,
	Node,
	type INodeTraverseCallback,
} from "../Node";
import { IMatrix44 } from "../../../Types";


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
	#box: Box = new Box();
	#sphere: Sphere = new Sphere();

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
	public override accept ( visitor: Visitor ): void
	{
		visitor.visitGroup ( this );
	}

	/**
	 * Get the bounding sphere of this node.
	 * @returns {Sphere} The bounding sphere of this node.
	 */
	public override getBoundingSphere() : Sphere
	{
		// Return the bounding sphere if it is valid.
		if ( true === this.#sphere.valid )
		{
			return this.#sphere;
		}

		// Make a new sphere.
		const answer = new Sphere();

		// Add each child's sphere to ours.
		this.forEachChild ( ( child: Node ) =>
		{
			// Handle when the child node does not add to the bounds.
			if ( false === hasBits ( child.flags, Flags.ADDS_TO_BOUNDS ) )
			{
				return;
			}

			// Get the child's sphere.
			const sphere = child.getBoundingSphere();

			// If the child has an invalid sphere then skip it.
			if ( false === sphere.valid )
			{
				return;
			}

			// Grow the answer.
			answer.growBySphere ( sphere );
		} );

		// Save the answer for next time.
		this.#sphere = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Get the bounding box of the given group.
	 * @param {Group} group - The group.
	 * @param {IMatrix44 | undefined} matrix - Optional matrix to transform the boxes.
	 * @returns {Box} The bounding box of this group.
	 */
	protected static getBoundingBox ( group: Group, matrix?: IMatrix44 ) : Box
	{
		// Make a new box.
		const answer = new Box();

		// Add each child's box to ours.
		group.forEachChild ( ( child: Node ) =>
		{
			// Handle when the child node does not add to the bounds.
			if ( false === hasBits ( child.flags, Flags.ADDS_TO_BOUNDS ) )
			{
				return;
			}

			// Get the child's box.
			const box = child.getBoundingBox();

			// If the child has an invalid box then skip it.
			if ( false === box.valid )
			{
				return;
			}

			// Are we supposed to transform the box?
			if ( matrix )
			{
				// Grow the answer by the transformed box.
				answer.growByBox ( Box.transform ( box, matrix ) );
			}

			// Otherwise ...
			else
			{
				// Grow the answer by the box.
				answer.growByBox ( box );
			}
		} );

		// Return the answer.
		return answer;
	}

	/**
	 * Get the bounding box of this node.
	 * @returns {Box} The bounding box of this node.
	 */
	public override getBoundingBox() : Box
	{
		// Return the bounding box if it is valid.
		if ( true === this.#box.valid )
		{
			return this.#box;
		}

		// Get the new bounding box.
		const answer = Group.getBoundingBox ( this );

		// Save the answer for next time.
		this.#box = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Dirty the bounds of this node.
	 */
	public override dirtyBounds (): void
	{
		// Make a new invalid box.
		this.#box = new Box();

		// Let the parents know that their bounding boxes are now invalid.
		this.forEachParent ( ( parent: Node ) =>
		{
			parent.dirtyBounds();
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
	 * Is the group empty?
	 * @returns {boolean} True if the group is empty.
	 */
	public get empty() : boolean
	{
		return ( this.size <= 0 );
	}

	/**
	 * Traverse this node.
	 * @param {INodeTraverseCallback} cb - Callback function.
	 */
	public override traverse ( cb: INodeTraverseCallback ) : void
	{
		cb ( this );
		this.forEachChild ( ( child: Node ) =>
		{
			child.traverse ( cb );
		} );
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
	public getChild ( index: Readonly<number> )
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
	public removeChild ( index: Readonly<number> ) : boolean
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
