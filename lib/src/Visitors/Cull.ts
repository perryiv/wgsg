///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Cull visitor class.
//
///////////////////////////////////////////////////////////////////////////////

import { Multiply } from "./Multiply";
import {
	Geometry,
	Group,
	Node,
	ProjectionNode as Projection,
	Shape,
	State,
	Transform,
} from "../Scene";
import {
	getClipGroups,
	getShapeList,
	getShapesMap,
	getStatePair,
	type IClipGroups,
	type ILayerMap,
	type IShapesMap,
	type IStateMap,
	type IStatePair
} from "../Render";


///////////////////////////////////////////////////////////////////////////////
/**
 * Input for the cull visitor constructor.
 * @interface
 */
///////////////////////////////////////////////////////////////////////////////

interface ICullVisitorInput
{
	layers: ILayerMap,
	defaultState: State
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Cull extends Multiply
{
	#layers: ( ILayerMap | null ) = null;
	#defaultState: ( State | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ( input?: ICullVisitorInput )
	{
		// Call this first.
		super();

		// Get the input or defaults.
		const { layers, defaultState } = ( input ?? {
			layers: new Map < number, IClipGroups > (),
			defaultState: new State()
		} );

		// Set our members.
		this.#layers = layers;
		this.#defaultState = defaultState;
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Visitors.Cull";
	}

	/**
	 * Get the layers or throw an exception.
	 * @returns {ILayerMap} The map of layers.
	 */
	public get layers () : ILayerMap
	{
		const layers = this.#layers;
		if ( !layers )
		{
			throw new Error ( "Invalid map of layers" );
		}
		return layers;
	}

	/**
	 * Set the layers.
	 * @params {ILayerMap} layers - The map of layers.
	 */
	public set layers ( layers: ILayerMap )
	{
		this.#layers = layers;
	}

	/**
	 * Get the default state or throw an exception.
	 * @returns {State} The default state.
	 */
	public get defaultState () : State
	{
		const state = this.#defaultState;
		if ( !state )
		{
			throw new Error ( "Invalid default state" );
		}
		return state;
	}

	/**
	 * Set the default state.
	 * @params {State} state - The default state.
	 */
	public set defaultState ( state: State )
	{
		this.#defaultState = state;
	}

	/**
	 * Visit the group.
	 */
	public visitGroup ( group: Group ) : void
	{
		super.visitGroup ( group );
	}

	/**
	 * Visit the transform.
	 */
	public visitTransform ( transform: Transform ) : void
	{
		super.visitTransform ( transform );
	}

	/**
	 * Visit the projection.
	 */
	public visitProjection ( projection: Projection ) : void
	{
		super.visitProjection ( projection );
	}

	/**
	 * Visit the geometry.
	 */
	public visitGeometry ( geom: Geometry ) : void
	{
		super.visitGeometry ( geom );
	}

	/**
	 * Visit the shape.
	 */
	public visitShape ( shape: Shape ) : void
	{
		// Shortcuts.
		const layers = this.layers;
		const modelMatrix = this.modelMatrix;
		const projMatrix = this.projMatrix;
		const state = shape.state ?? this.defaultState;
		const clipped = state.clipped;
		const layer = state.layer;

		// Get or make the containers we need.
		const clipGroups: IClipGroups = getClipGroups ( layers, layer );
		const stateMap: IStateMap = ( clipped ? clipGroups.clipped : clipGroups.unclipped );
		const { proj }: IStatePair = getStatePair ( stateMap, state );
		const shapeMap: IShapesMap = getShapesMap ( proj, projMatrix );
		const shapes: Shape[] = getShapeList ( shapeMap, modelMatrix );

		// Add our shape.
		shapes.push ( shape );

		// Do this last.
		super.visitShape ( shape );
	}

	/**
	 * Visit the node.
	 */
	public visitNode ( node: Node ) : void
	{
		super.visitNode ( node );
	}

	/**
	 * Reset to the initial state.
	 */
	public reset() : void
	{
		this.layers.clear();
	}
}
