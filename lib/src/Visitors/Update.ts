///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Update visitor class.
//
///////////////////////////////////////////////////////////////////////////////

import { Node, Shape } from "../Scene";
import { Visitor } from "./Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Update visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Update extends Visitor
{
	#wasDirty = new Set < Node > ();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Visitors.Update";
	}

	/**
	 * Update the scene.
	 * @param {Node} scene - The scene node.
	 */
	public update ( scene: Node ) : void
	{
		// This will clear the set of dirty nodes.
		this.reset();

		// Have the scene accept the visitor.
		scene.accept ( this );

		// Mark all the nodes in the set as no longer dirty.
		// This happens at the end to make sure all the nodes are updated.
		// TODO: Is this necessary? Can we mark them as we update them?
		this.#wasDirty.forEach ( ( node: Node ) =>
		{
			node.dirty = false;
		} );

		// No need to wait so clear the set of dirty nodes now.
		this.reset();
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape node.
	 */
	public override visitShape ( shape: Shape ) : void
	{
		if ( true === shape.dirty )
		{
			shape.update();
			this.#wasDirty.add ( shape );
		}
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The scene node.
	 */
	public override visitNode ( node: Node ) : void
	{
		// Handle all nodes that are not shapes. It's probably a group and was
		// only dirty because one of its child nodes was marked dirty.
		if ( true === node.dirty )
		{
			this.#wasDirty.add ( node );
		}
	}

	/**
	 * Reset to the initial state.
	 */
	public override reset() : void
	{
		this.#wasDirty.clear();
	}
}
