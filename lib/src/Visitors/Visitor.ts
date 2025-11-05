///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base visitor class.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base/Base";
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
 * Base visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Visitor extends Base
{
	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Visit the group.
	 * @param {Group} group - The group to visit.
	 */
	public visitGroup ( group: Group ) : void
	{
		group.forEachChild ( ( child: Node ) =>
		{
			child.accept ( this );
		} );
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform to visit.
	 */
	public visitTransform ( tr: Transform ) : void
	{
		this.visitGroup ( tr );
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection to visit.
	 */
	public visitProjection ( proj: Projection ) : void
	{
		this.visitGroup ( proj );
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry to visit.
	 */
	public visitGeometry ( geom: Geometry ) : void
	{
		void geom; // Do nothing with the function argument.
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape to visit.
	 */
	public visitShape ( shape: Shape ) : void
	{
		void shape; // Do nothing with the function argument.
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The node to visit.
	 */
	public visitNode ( node: Node ) : void
	{
		void node; // Do nothing with the function argument.
	}

	/**
	 * Reset to the initial state.
	 */
	public abstract reset() : void
}
