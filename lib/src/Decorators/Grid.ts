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
import { mat4, vec2, vec3 } from "gl-matrix";
import { Node as SceneNode, Transform } from "../Scene/Nodes";
import { Sphere as MathSphere } from "../Math";
import {
	buildGrid,
	type IGridBuilderInput,
} from "../Builders";
import type {
	IVector2,
	IVector3,
	IVector4,
	IViewer,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IGridDecoratorData
{
	localUp: IVector3;
	numLines: IVector2;
	color: IVector4;
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
		localUp: [ 0, 1, 0 ],
		numLines: [ 21, 21 ],
		color: [ ...ColorTool.black ],
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
	 * Update the scene if we should.
	 */
	public override updateScene () : void
	{
		if ( false === this.dirty )
		{
			return;
		}

		const { viewer } = this;

		if ( !viewer )
		{
			return;
		}

		vec3.copy ( this.#data.localUp, viewer.navBase.getLocalUp() );

		super.updateScene();
	}

	/**
	 * Determine the center and size of the grid based on the scene's bounds.
	 * @returns {{center: IVector3, size: IVector2}} The center and size of the grid.
	 */
	protected get modelBounds () : MathSphere
	{
		// Make a default bounds.
		let bounds = new MathSphere ( [ 0, 0, 0 ], 1 );

		// Get the viewer.
		const { viewer } = this;
		if ( viewer )
		{
			// Get the model scene.
			const { modelScene } = viewer;
			if ( modelScene )
			{
				// Get the bounds from the model scene if it is valid.
				if ( true === modelScene.bounds.valid )
				{
					bounds = modelScene.bounds.clone();
				}
			}
		}

		// Return the answer.
		return bounds;
	}

	/**
	 * Determine the center and size of the grid based on the scene's bounds.
	 * @returns {{center: IVector3, size: IVector2}} The center and size of the grid.
	 */
	protected getCenterAndSize () : { center: IVector3, size: IVector2 }
	{
		// Default values.
		const center: IVector3 = [ 0, 0, 0 ];
		const size: IVector2 = [ 1, 1 ];

		// Get the bounds.
		const bounds = this.modelBounds;

		// Update the center.
		vec3.copy ( center, bounds.center );

		// Update the size.
		const length = bounds.radius * 10;
		vec2.scale ( size, size, length );

		// Return the answer.
		return { center, size };
	}

	/**
	 * Build the scene.
	 * @returns {(SceneNode | null)} The scene or null if not available.
	 */
	protected override buildScene () : ( SceneNode | null )
	{
		// Determine what the center a size really should be.
		const { center, size } = this.getCenterAndSize();

		// We build the grid at the origin but with the correct size.
		const input: IGridBuilderInput = {
			...this.#data,
			center: ( [ 0, 0, 0 ] as IVector3 ),
			size
		};

		// Make a transform group to hold the grid.
		const tr = new Transform();

		// Build the grid and add it to the transform.
		tr.addChild ( buildGrid ( input ) );

		// Get the up-vector.
		const up: IVector3 = [ 0, 0, 0 ];
		vec3.copy ( up, this.#data.localUp );

		// The radius of the bounds is used to lower the grid.
		const { radius } = this.modelBounds;

		// We transform the grid differently depending on the up-vector.
		switch ( up.toString() )
		{
			case [ 1, 0, 0 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ -radius, 0, 0 ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				tr.rotate ( Math.PI * 0.5, [ 0, 0, 1 ] );
				break;
			}
			case [ -1, 0, 0 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ radius, 0, 0 ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				tr.rotate ( Math.PI * -0.5, [ 0, 0, 1 ] );
				break;
			}
			case [ 0, 1, 0 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ 0, -radius, 0 ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				break; // No rotation needed.
			}
			case [ 0, -1, 0 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ 0, radius, 0 ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				tr.rotate ( Math.PI, [ 1, 0, 0 ] );
				break;
			}
			case [ 0, 0, 1 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ 0, 0, -radius ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				tr.rotate ( Math.PI * -0.5, [ 1, 0, 0 ] );
				break;
			}
			case [ 0, 0, -1 ].toString():
			{
				mat4.translate ( tr.matrix, tr.matrix, [ 0, 0, radius ] );
				mat4.translate ( tr.matrix, tr.matrix, center );
				tr.rotate ( Math.PI * 0.5, [ 1, 0, 0 ] );
				break;
			}
		}

		// Return the transform.
		return tr;
	}
}
