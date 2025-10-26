///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Visitor for when the device is lost.
//
///////////////////////////////////////////////////////////////////////////////

import { Visitor } from "./Visitor";
import {
	Geometry,
	Group,
	Node,
	Shape,
	type IPrimitiveList,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * DeviceLost visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class DeviceLost extends Visitor
{
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
		return "Visitors.DeviceLost";
	}

	/**
	 * Handle when the device is lost.
	 * @param {Node} scene - The scene node.
	 */
	public handle ( scene: Node ) : void
	{
		// Have the scene accept the visitor.
		scene.accept ( this );
	}

	/**
	 * Visit the group.
	 * @param {Group} group - The group to visit.
	 */
	public override visitGroup ( group: Group ) : void
	{
		super.visitGroup ( group );
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// Reset the arrays.
		geom.points?.reset();
		geom.normals?.reset();
		geom.colors?.reset();
		geom.texCoords?.reset();

		// Reset all the primitives.
		geom.primitives?.forEach ( ( primitive: IPrimitiveList ) =>
		{
			primitive.reset();
		} );

		// Redirect to the shape function. Do not call the base class.
		this.visitShape ( geom );
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape node.
	 */
	public override visitShape ( shape: Shape ) : void
	{
		// Get the state.
		const state = shape.state;
		if ( state )
		{
			// Get the shader.
			const shader = state.shader;
			if ( shader )
			{
				// Reset the shader. It will rebuild later when needed.
				shader.reset();
				console.log ( `Reset shader ${shader.id} module after device was lost` );
			}
		}

		// Call the base class.
		super.visitShape ( shape );
	}

	/**
	 * Reset to the initial state.
	 */
	public override reset() : void
	{
		// Do nothing.
	}
}
