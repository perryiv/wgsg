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

import { hasBits } from "../../../Tools";
import { Sphere } from "../../../Math";
import { Visitor } from "../../../Visitors/Visitor";
import {
	Flags,
	Node as BaseClass,
	Node as ChildType,
	type INodeTraverseCallback,
} from "../Node";


///////////////////////////////////////////////////////////////////////////////
/**
 * Callback type.
 */
///////////////////////////////////////////////////////////////////////////////

export type IGroupCallback = ( ( node: ChildType ) => void );
export type IGroupPredicate = ( ( node: Readonly<ChildType>, index: number ) => boolean );


///////////////////////////////////////////////////////////////////////////////
/**
 * Group class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Group extends BaseClass
{
	#children: ChildType[] = [];
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
	protected override getBoundingSphere() : Sphere
	{
		// Return the bounding sphere if it is valid.
		if ( true === this.#sphere.valid )
		{
			return this.#sphere;
		}

		// Get the new bounding sphere.
		const answer = this.calculateBoundingSphere();

		// If it's invalid then don't store it.
		if ( false === answer.valid )
		{
			return answer;
		}

		// If we get to here then save the answer for next time.
		this.#sphere = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Calculate the bounding sphere of this node.
	 * @returns {Sphere} The bounding sphere of this node.
	 */
	protected calculateBoundingSphere() : Sphere
	{
		// Make a new sphere.
		const answer = new Sphere();

		// Add each child's sphere to ours.
		this.forEachChild ( ( child: ChildType ) =>
		{
			// Handle when the child node does not add to the bounds.
			if ( false === hasBits ( child.flags, Flags.ADDS_TO_BOUNDS ) )
			{
				return;
			}

			// Get the child's bounding sphere.
			const { bounds } = child;

			// If the child has an invalid sphere then skip it.
			if ( false === bounds.valid )
			{
				return;
			}

			// Grow the answer by the sphere.
			answer.growBySphere ( bounds );
		} );

		// Return the answer.
		return answer;
	}

	/**
	 * Find the index of the child that matched the given predicate.
	 * @param {IGroupPredicate} predicate - The function that tests each child node.
	 * @returns {number} The index of the child node that matches the predicate or -1.
	 */
	public findChild ( predicate: IGroupPredicate ) : number
	{
		// Shortcuts.
		const children = this.#children;
		const numChildren = children.length;

		// Loop through the children.
		for ( let i = 0; i < numChildren; ++i )
		{
			if ( predicate ( children[i], i ) )
			{
				return i;
			}
		}

		// We didn't find it.
		return -1;
	}

	/**
	 * Find the index of the child.
	 * @param {ChildType | null | undefined} child - The child node to find.
	 * @returns {number} The index of the child node or -1.
	 */
	public indexOf ( child: ( Readonly<ChildType> | null | undefined ) ) : number
	{
		// Handle invalid child.
		if ( !child )
		{
			return -1;
		}

		// Use a predicate to find the index of the child.
		return this.findChild ( ( current: Readonly<ChildType> ) =>
		{
			return ( current === child );
		} );
	}

	/**
	 * Dirty the bounds of this node.
	 */
	public override dirtyBounds (): void
	{
		// Make a new invalid sphere.
		this.#sphere = new Sphere();

		// Let the parents know that their bounds are now invalid.
		this.forEachParent ( ( parent: ChildType ) =>
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
		this.forEachChild ( ( child: ChildType ) =>
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
	 * @param {ChildType | null | undefined} node - The node to add to the group.
	 */
	public addChild ( node: ( ChildType | null | undefined ) )
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

		// This group's bounds are now dirty.
		this.dirtyBounds();
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

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		// Get the base class's JSON.
		const base = super.toJSON();

		// Get the JSON for the children.
		const children: object[] = [];
		this.forEachChild ( ( child: ChildType ) =>
		{
			children.push ( child.toJSON() );
		} );

		// Return the object that represents this class.
		return {
			...base,
			children
		};
	}
}
