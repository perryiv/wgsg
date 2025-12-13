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

import { Visitor as BaseClass } from "./Visitor";
import {
	Geometry,
	Group,
	Node,
	ProjectionNode as Projection,
	Shape,
	Transform,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Update visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Update extends BaseClass
{
	#wasDirty = new Map < number, Node > ();

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
	 * Visit the group.
	 * @param {Group} group - The group to visit.
	 */
	public override visitGroup ( group: Group ) : void
	{
		if ( true === group.dirty )
		{
			super.visitGroup ( group );
			this.#wasDirty.set ( group.id, group );
		}
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform to visit.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		if ( true === tr.dirty )
		{
			super.visitTransform ( tr );
			this.#wasDirty.set ( tr.id, tr );
		}
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection to visit.
	 */
	public override visitProjection ( proj: Projection ) : void
	{
		if ( true === proj.dirty )
		{
			super.visitProjection ( proj );
			this.#wasDirty.set ( proj.id, proj );
		}
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry to visit.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		if ( true === geom.dirty )
		{
			geom.update();
			super.visitGeometry ( geom );
			this.#wasDirty.set ( geom.id, geom );
		}
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
			super.visitShape ( shape );
			this.#wasDirty.set ( shape.id, shape );
		}
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The scene node.
	 */
	public override visitNode ( node: Node ) : void
	{
		if ( true === node.dirty )
		{
			super.visitNode ( node );
			this.#wasDirty.set ( node.id, node );
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
