///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base decorator class.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base/Base";
import { Group, Node as SceneNode } from "../Scene/Nodes";
import type { IViewer } from "../Types/Viewer";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base decorator class.
 * @abstract
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Decorator extends BaseClass
{
	#scene: Group = new Group();
	#viewer: ( IViewer | null ) = null;
	#dirty = true;

	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor ()
	{
		super();
	}

	/**
	 * Get the scene.
	 * @returns {Group} The scene.
	 */
	protected get scene () : Group
	{
		return this.#scene;
	}

	/**
	 * Get the visibility of the scene.
	 * @returns {boolean} True if the scene is visible, false if not.
	 */
	public get visible () : boolean
	{
		return this.scene.visible;
	}

	/**
	 * Set the visibility of the scene.
	 * @param {boolean} value - True to make the scene visible, false to hide it.
	 */
	public set visible ( value: boolean )
	{
		this.scene.visible = value;
	}

	/**
	 * Get the viewer.
	 * @returns {(IViewer | null)} The viewer or null if not set.
	 */
	public get viewer () : ( IViewer | null )
	{
		return this.#viewer;
	}

	/**
	 * Set the viewer.
	 * @param {(IViewer | null)} viewer - The viewer or null to clear it.
	 */
	public set viewer ( viewer: ( IViewer | null ) )
	{
		this.#viewer = viewer;
	}

	/**
	 * Is the scene dirty?
	 * @returns {boolean} True if the scene is dirty, false if not.
	 */
	public get dirty () : boolean
	{
		return this.#dirty;
	}

	/**
	 * Set the dirty flag.
	 * @param {boolean} value - The new value for the dirty flag.
	 */
	public set dirty ( value: boolean )
	{
		this.#dirty = value;
	}

	/**
	 * Update the scene if we should.
	 */
	public updateScene () : void
	{
		if ( false === this.dirty )
		{
			return;
		}

		this.scene.clear();
		this.scene.addChild ( this.buildScene() );

		this.dirty = false;
	}

	/**
	 * Build the scene.
	 * @returns {(SceneNode | null)} The scene or null if not available.
	 */
	protected abstract buildScene () : ( SceneNode | null );
}
