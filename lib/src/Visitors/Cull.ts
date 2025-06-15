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
	getLayer,
	getModelMatrixData,
	getProjMatrixData,
	getStateData,
} from "../Render";
import type {
	ILayer,
	ILayerMap,
} from "../Render";


///////////////////////////////////////////////////////////////////////////////
/**
 * Input for the cull visitor constructor.
 * @interface
 */
///////////////////////////////////////////////////////////////////////////////

interface ICullVisitorInput
{
	layers?: ILayerMap,
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
	 * @class
	 * @param {ICullVisitorInput} input - The constructor input.
	 */
	constructor ( input: ICullVisitorInput )
	{
		// Call this first.
		super();

		// Get the input or defaults.
		const layers = ( input.layers ?? ( new Map < number, ILayer > () ) );

		// Set our members.
		this.#layers = layers;
		this.#defaultState = input.defaultState;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
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
	 * @param {ILayerMap} layers - The map of layers.
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
	 * @param {State} state - The default state.
	 */
	public set defaultState ( state: State )
	{
		this.#defaultState = state;
	}

	/**
	 * Visit the group.
	 * @param {Group} group - The group node.
	 */
	public visitGroup ( group: Group ) : void
	{
		super.visitGroup ( group );
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform node.
	 */
	public visitTransform ( tr: Transform ) : void
	{
		super.visitTransform ( tr );
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection node.
	 */
	public visitProjection ( proj: Projection ) : void
	{
		super.visitProjection ( proj );
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry node.
	 */
	public visitGeometry ( geom: Geometry ) : void
	{
		// Treat it like a shape.
		this.visitShape ( geom );
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape node.
	 */
	public visitShape ( shape: Shape ) : void
	{
		// Shortcuts.
		const layers = this.layers;
		const modelMatrix = this.modelMatrix;
		const projMatrix = this.projMatrix;
		const state = shape.state ?? this.defaultState;
		const clipped = shape.clipped;

		// Get or make the containers we need.
		const layer = getLayer ( layers, state.layer );
		const projMatrixMap = ( clipped ? layer.clipped : layer.unclipped );
		const projMatrixData = getProjMatrixData ( projMatrixMap, projMatrix );
		const { states } = projMatrixData;
		const { modelMatrices } = getStateData ( states, state );
		const { shapes } = getModelMatrixData ( modelMatrices, modelMatrix );

		// Add our shape.
		shapes.push ( shape );

		// Do this last.
		super.visitShape ( shape );
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The scene node.
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
