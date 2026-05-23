///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all shapes.
//
///////////////////////////////////////////////////////////////////////////////

import { Box, Sphere } from "../../../Math";
import {
	Node,
	type INodeConstructorInput,
	type INodeTraverseCallback,
} from "../Node";


///////////////////////////////////////////////////////////////////////////////
/**
 * Shape class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Shape extends Node
{
	/**
	 * Construct the class.
	 * @class
	 * @param {INodeConstructorInput} [input] - The input for the node.
	 */
	constructor ( input?: INodeConstructorInput )
	{
		super ( input );
	}

	/**
	 * Get the bounding box of this node.
	 * @abstract
	 * @returns {Box} The bounding box of this node.
	 */
	protected abstract getBoundingBox() : Readonly<Box>;

	/**
	 * Get the bounding box of this node.
	 * @returns {Box} The bounding box of this node.
	 */
	public get box() : Readonly<Box>
	{
		return this.getBoundingBox();
	}

	/**
	 * Get the bounding sphere of this node.
	 * @returns {Sphere} The bounding sphere of this node.
	 */
	protected override getBoundingSphere() : Sphere
	{
		// Shortcut.
		const { box } = this;

		// Return an invalid sphere if the box is not valid.
		if ( false === box.valid )
		{
			return new Sphere();
		}

		// Get the sphere that encloses the box.
		const { center, radius } = box;
		return new Sphere ( center, radius );
	}

	/**
	 * Traverse this node.
	 * @param {INodeTraverseCallback} cb - Callback function.
	 */
	public override traverse ( cb: INodeTraverseCallback ) : void
	{
		cb ( this );
	}

	/**
	 * Update the shape.
	 */
	public abstract update() : void;

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		// Get the base class's JSON.
		const base = super.toJSON();

		// Return the object that represents this class.
		return {
			...base,
			box: this.box
		};
	}
}
