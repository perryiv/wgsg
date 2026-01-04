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
import { Box, Sphere } from "../../Math";
import { Group } from "./Groups/Group";
import { hasBits, setBits } from "../../Tools";
import { State } from "../State";
import { Visitor } from "../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
//
//	Types for node construction.
//
///////////////////////////////////////////////////////////////////////////////

export interface INodeConstructorInput
{
	state?: ( State | null );
	flags?: ( number | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Enumerations for node flags.
 * @enum {number}
 * @property {number} VISIBLE - Is the node visible?
 * @property {number} INTERSECTABLE - Can the node be intersected?
 * @property {number} ADDS_TO_BOUNDS - Does the node add to the bounds?
 * @property {number} DIRTY - Is the node dirty?
 */
///////////////////////////////////////////////////////////////////////////////

export enum Flags
{
	ADDS_TO_BOUNDS = ( 1 << 0 ),
	CLIPPED        = ( 1 << 1 ),
	DIRTY          = ( 1 << 2 ),
	INTERSECTABLE  = ( 1 << 3 ),
	VISIBLE        = ( 1 << 4 ),
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Callback types.
 */
///////////////////////////////////////////////////////////////////////////////

export type INodeParentCallback = ( ( node: Node ) => void );
export type INodeTraverseCallback = ( ( node: Node ) => void );


///////////////////////////////////////////////////////////////////////////////
/**
 * Node class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Node extends Base
{
	#state: ( State | null ) = null;
	#parents: Map < number, Group > = new Map < number,Group > ();
	#flags = (
		Flags.VISIBLE |
		Flags.INTERSECTABLE |
		Flags.ADDS_TO_BOUNDS |
		Flags.CLIPPED |
		Flags.DIRTY
	);

	/**
	 * Construct the class.
	 * @class
	 * @param {INodeConstructorInput} [input] - The input for the node.
	 * @param {State | null} [input.state] - Optional state for this node.
	 * @param {number} [input.flags] - Optional flags for this node.
	 */
	constructor ( input?: Readonly<INodeConstructorInput> )
	{
		super();

		if ( input )
		{
			const { state, flags } = input;

			if ( state )
			{
				this.#state = state;
			}

			if ( ( flags ) && ( flags > 0 ) )
			{
				this.#flags = flags;
			}
		}
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public abstract accept ( _: Visitor ): void;

	/**
	 * Get the state.
	 * @returns {State | null} State for this shape.
	 */
	public get state() : ( State | null )
	{
		return this.#state;
	}

	/**
	 * Set the state.
	 * @param {State | null} state - State for this shape.
	 */
	public set state ( state: ( State | null ) )
	{
		this.#state = state;
	}

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
	 * @returns {boolean} True if it worked, otherwise false.
	 */
	public removeParent ( id: number )
	{
		// Remove the parent.
		return this.#parents.delete ( id );
	}

	/**
	 * See if this node has the given parent.
	 * @param {number} id - The id of the parent to check.
	 * @returns {boolean} True if we have the given parent, otherwise false.
	 */
	public hasParent ( id: Readonly<number> )
	{
		// Do we have the parent?
		return this.#parents.has ( id );
	}

	/**
	 * Get the flags.
	 * @returns {number} The flags.
	 */
	public get flags() : number
	{
		return this.#flags;
	}

	/**
	 * Set the flags.
	 * @param {number} flags - The new flags.
	 */
	public set flags ( flags: Readonly<number> )
	{
		this.#flags = flags;
	}

	/**
	 * Get the visibility state.
	 * @returns {boolean} The visibility state.
	 */
	public get visible() : boolean
	{
		return hasBits ( this.#flags, Flags.VISIBLE );
	}

	/**
	 * Set the visibility state.
	 * @param {boolean} visible - The new visibility state.
	 */
	public set visible ( visible: Readonly<boolean> )
	{
		this.#flags = setBits ( this.#flags, Flags.VISIBLE, visible );
	}

	/**
	 * Get the intersectable state.
	 * @returns {boolean} The intersectable state.
	 */
	public get intersectable() : boolean
	{
		return hasBits ( this.#flags, Flags.INTERSECTABLE );
	}

	/**
	 * Set the intersectable state.
	 * @param {boolean} intersectable - The new intersectable state.
	 */
	public set intersectable ( intersectable: Readonly<boolean> )
	{
		this.#flags = setBits ( this.#flags, Flags.INTERSECTABLE, intersectable );
	}

	/**
	 * Get the adds-to-bounds state.
	 * @returns {boolean} The adds-to-bounds state.
	 */
	public get addsToBounds() : boolean
	{
		return hasBits ( this.#flags, Flags.ADDS_TO_BOUNDS );
	}

	/**
	 * Set the adds-to-bounds state.
	 * @param {boolean} addsToBounds - The new adds-to-bounds state.
	 */
	public set addsToBounds ( addsToBounds: Readonly<boolean> )
	{
		this.#flags = setBits ( this.#flags, Flags.ADDS_TO_BOUNDS, addsToBounds );
	}

	/**
	 * Get the clipped state.
	 * @returns {boolean} The clipped state.
	 */
	public get clipped() : boolean
	{
		return hasBits ( this.#flags, Flags.CLIPPED );
	}

	/**
	 * Set the clipped state.
	 * @param {boolean} clipped - The new clipped state.
	 */
	public set clipped ( clipped: Readonly<boolean> )
	{
		this.#flags = setBits ( this.#flags, Flags.CLIPPED, clipped );
	}

	/**
	 * Get the dirty state.
	 * @returns {boolean} The dirty state.
	 */
	public get dirty() : boolean
	{
		return hasBits ( this.#flags, Flags.DIRTY );
	}

	/**
	 * Set the dirty state.
	 * @param {boolean} dirty - The new dirty state.
	 */
	public set dirty ( dirty: Readonly<boolean> )
	{
		// Set our state.
		this.#flags = setBits ( this.#flags, Flags.DIRTY, dirty );

		// Do nothing if we're not dirty.
		if ( false === dirty )
		{
			return;
		}

		// Tell all the parents, and their parents, all the way up.
		this.forEachParent ( ( parent: Node ) =>
		{
			parent.dirty = true;
		} );
	}

	/**
	 * Call the given function for each parent node.
	 * @param {INodeParentCallback} cb - Callback function.
	 */
	public forEachParent ( cb: INodeParentCallback ) : void
	{
		this.#parents.forEach ( cb );
	}

	/**
	 * Get the bounding sphere of this node.
	 * @abstract
	 * @returns {Sphere} The bounding sphere of this node.
	 */
	public abstract getBoundingSphere() : Sphere;

	/**
	 * Get the bounding box of this node.
	 * @abstract
	 * @returns {Box} The bounding box of this node.
	 */
	public abstract getBoundingBox() : Box;

	/**
	 * Calculate the bounding box of this node.
	 * @abstract
	 * @returns {Box} The bounding box of this node.
	 */
	protected abstract calculateBoundingBox() : Box;

	/**
	 * Dirty the bounds of this node.
	 * @abstract
	 */
	public abstract dirtyBounds (): void;

	/**
	 * Traverse this node.
	 * @param {INodeTraverseCallback} cb - Callback function.
	 */
	public abstract traverse ( cb: INodeTraverseCallback ) : void;
}
