///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Grid decorator class.
//
///////////////////////////////////////////////////////////////////////////////

import { buildGrid } from "../Builders";
import { Color as ColorTool } from "../Tools/Color";
import { Decorator as BaseClass } from "./Decorator";
import { Node as SceneNode } from "../Scene/Nodes";
import type {
	IVector2,
	IVector3,
	IViewer,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Grid decorator class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Grid extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	public constructor ()
	{
		super();
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName () : string
	{
		return "Decorators.Grid";
	}

	/**
	 * Get the viewer. This is needed because there is a setter.
	 * Otherwise, this.viewer is always undefined.
	 * @returns {(IViewer | null)} The viewer or null if not set.
	 */
	public override get viewer () : ( IViewer | null )
	{
		return super.viewer;
	}

	/**
	 * Set the viewer.
	 * @param {(IViewer | null)} viewer - The viewer or null to clear it.
	 */
	public override set viewer ( viewer: ( IViewer | null ) )
	{
		const existing = this.viewer;

		if ( existing === viewer )
		{
			return;
		}

		if ( existing )
		{
			const extraScene = existing.extraScene;
			extraScene.removeChild ( extraScene.findChild ( ( child ) =>
			{
				return ( child === this.scene );
			} ) );
		}

		super.viewer = viewer;

		if ( viewer )
		{
			viewer.extraScene.addChild ( this.scene );
		}
	}

	/**
	 * Build the scene.
	 * @returns {(SceneNode | null)} The scene or null if not available.
	 */
	protected override buildScene () : ( SceneNode | null )
	{
		// Set reasonable defaults for the grid.
		const center: IVector3 = [ 0, 0, 0 ];
		const size: IVector2 = [ 20, 20 ];

		// Is there a viewer?
		const viewer = this.viewer;
		if ( viewer )
		{
			// Is there a model scene?
			const modelScene = viewer.modelScene;
			if ( modelScene )
			{
				// Get the bounding sphere for the model scene.
				const bounds = modelScene.bounds;

				// Update the center and size of the grid based on the bounds.
				center[0] = bounds.center[0];
				center[1] = bounds.center[1] - bounds.radius;
				center[2] = bounds.center[2];
				const length = bounds.radius * 10;
				size[0] = length;
				size[1] = length;
			}
		}

		return buildGrid ( {
			center,
			size,
			numLines: [ 21, 21 ],
			color: [ ...ColorTool.black ]
		} );
	}
}
