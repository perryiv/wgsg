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

import { Base as BaseObject } from "../Base";
import { Visitor as BaseClass } from "./Visitor";
import {
	Geometry,
	Group,
	Node as SceneNode,
	Shape,
	type IPrimitiveList,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Return a key that will be unique for the given type.
 * @param {BaseObject} base - The object to get the key for.
 * @returns {string} The key.
 */
///////////////////////////////////////////////////////////////////////////////

const makeKeyForType = ( base: BaseObject ) : string =>
{
	return `${base.type}.${base.id}`;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * DeviceLost visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class DeviceLost extends BaseClass
{
	#states  = new Set < string > ();
	#shaders = new Set < string > ();

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
	 * @param {SceneNode} scene - The scene node.
	 */
	public handle ( scene: SceneNode ) : void
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
		// Shortcuts.
		const states = this.#states;
		const shaders = this.#shaders;

		// Get the state.
		const state = shape.state;

		// If there is a valid state ...
		if ( state )
		{
			// Make a unique key for this type.
			const key1 = makeKeyForType ( state );

			// If we have not seen this object before ...
			if ( false === states.has ( key1 ) )
			{
				// Set this for next time.
				states.add ( key1 );

				// Get the shader.
				const shader = state.shader;

				// If there is a valid shader ...
				if ( shader )
				{
					// Make a unique key for this type.
					const key2 = makeKeyForType ( shader );

					// If we have not seen this object before ...
					if ( false === shaders.has ( key2 ) )
					{
						// Set this for next time.
						shaders.add ( key2 );

						// Reset the shader. It will rebuild later when needed.
						shader.reset();
						console.log ( `Reset shader '${key2}' module after device was lost` );
					}
				}
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
		this.#states.clear();
		this.#shaders.clear();
	}
}
