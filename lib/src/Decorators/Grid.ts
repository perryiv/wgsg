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

import { Color as ColorTool } from "../Tools/Color";
import { Decorator as BaseClass } from "./Decorator";
import { Node as SceneNode } from "../Scene/Nodes";
import { vec2, vec3 } from "gl-matrix";
import {
	buildGrid,
	type IGridBuilderInput,
} from "../Builders";
import type {
	IVector2,
	IVector3,
	IViewer,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IGridDecoratorData extends IGridBuilderInput
{
	autoPosition: boolean;
	autoSize: boolean;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Grid decorator class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Grid extends BaseClass
{
	#data: IGridDecoratorData = {
		center: [ 0, 0, 0 ],
		size: [ 20, 20 ],
		numLines: [ 21, 21 ],
		color: [ ...ColorTool.black ],
		autoPosition: true,
		autoSize: true
	};

	/**
	 * Construct the class.
	 * @param {Partial<IGridDecoratorData>} [input] - The optional input to initialize the grid with.
	 * @class
	 */
	public constructor ( input?: Partial<IGridDecoratorData> )
	{
		super();

		if ( input )
		{
			this.data = input;
		}
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public static getClassName () : string
	{
		return "Decorators.Grid";
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName () : string
	{
		return Grid.getClassName();
	}

	/**
	 * Get a copy of the grid configuration data.
	 * @returns {IGridDecoratorData} The grid configuration data.
	 */
	public get data () : IGridDecoratorData
	{
		return { ...this.#data };
	}

	/**
	 * Set the grid configuration data.
	 * @param {Partial<IGridDecoratorData>} data - The grid configuration data to set.
	 */
	public set data ( data: Partial<IGridDecoratorData> )
	{
		this.#data = { ...this.#data, ...data };
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
		// Get the existing viewer, which may be null.
		const existing = this.viewer;

		// Do nothing if the existing one and the new one are the same.
		if ( existing === viewer )
		{
			return;
		}

		// If there is an existing viewer, remove the grid from its extra scene.
		if ( existing )
		{
			const extraScene = existing.extraScene;
			extraScene.removeChild ( extraScene.findChild ( ( child ) =>
			{
				return ( child === this.scene );
			} ) );
		}

		// Set our member with the given viewer, which may be null.
		super.viewer = viewer;

		// If the new viewer is valid then add our scene, which,
		// at this point, is probably an empty group node.
		if ( viewer )
		{
			viewer.extraScene.addChild ( this.scene );
		}
	}

	/**
	 * Determine the center and size of the grid based on the scene's bounds.
	 * @param {SceneNode} scene - The scene to get the bounds from.
	 * @returns {{center: IVector3, size: IVector2}} The center and size of the grid.
	 */
	protected static getCenterAndSize ( scene: SceneNode ) : { center: IVector3, size: IVector2 }
	{
		// Default values.
		const center: IVector3 = [ 0, 0, 0 ];
		const size: IVector2 = [ 20, 20 ];

		// Get the bounding sphere for the model scene.
		const bounds = scene.bounds;

		// Handle invalid bounds.
		if ( false === bounds.valid )
		{
			return { center, size };
		}

		// Update the center.
		center[0] = bounds.center[0];
		center[1] = bounds.center[1] - bounds.radius;
		center[2] = bounds.center[2];

		// Update the size.
		const length = bounds.radius * 10;
		size[0] = length;
		size[1] = length;

		// Return the answer.
		return { center, size };
	}

	/**
	 * Return the input we use to build the grid.
	 * @returns {IGridBuilderInput} The input we use to build the grid.
	 */
	protected get input () : IGridBuilderInput
	{
		// Make a copy.
		const answer = { ...this.#data };

		// Are we supposed to automatically position and size the grid?
		if ( answer.autoPosition || answer.autoSize )
		{
			const viewer = this.viewer;
			if ( viewer )
			{
				const scene = viewer.modelScene;
				if ( scene )
				{
					const { center, size } = Grid.getCenterAndSize ( scene );
					if ( answer.autoPosition )
					{
						vec3.copy ( answer.center, center );
					}
					if ( answer.autoSize )
					{
						vec2.copy ( answer.size, size );
					}
				}
			}
		}

		// Return the answer.
		return answer;
	}

	/**
	 * Build the scene.
	 * @returns {(SceneNode | null)} The scene or null if not available.
	 */
	protected override buildScene () : ( SceneNode | null )
	{
		// Build the grid and return it.
		return buildGrid ( this.input );
	}
}
