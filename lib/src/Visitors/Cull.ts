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
	type IShapeList,
	type IShapesMap,
	type IStateMap,
	type IStatePair
} from "../Render";


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Cull extends Multiply
{
	#layers: ILayerMap = new Map < number, IClipGroups > ();
	#defaultState: State = new State();

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		// Call this first.
		super();
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
		const layers = this.#layers;
		const modelMatrix = this.modelMatrix;
		const projMatrix = this.projMatrix;
		const state = shape.state ?? this.#defaultState;
		const clipped = state.clipped;
		const layer = state.layer;

		// Get or make the containers we need.
		const clipGroups: IClipGroups = getClipGroups ( layers, layer );
		const stateMap: IStateMap = ( clipped ? clipGroups.clipped : clipGroups.unclipped );
		const { proj }: IStatePair = getStatePair ( stateMap, state );
		const shapeMap: IShapesMap = getShapesMap ( proj, projMatrix );
		const { shapes }: IShapeList = getShapeList ( shapeMap, modelMatrix );

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
		this.#layers.clear();
	}
}
