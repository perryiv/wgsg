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

import type { IMatrix44 } from "../Types";
import { Multiply } from "./Multiply";
import {
	Group,
	Node,
	ProjectionNode as Projection,
	Shape,
	State,
	Transform,
} from "../Scene";



///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IShapeList
{
	matrix: IMatrix44;
	shapes: Shape[];
}
type IShapesMap = Map < IMatrix44, IShapeList >;
type IProjectionGroup = Map < IMatrix44, IShapesMap >;
interface IStatePair
{
	state: State;
	proj: IProjectionGroup
}
type IStateMap = Map < string, IStatePair >;
interface IClipGroups
{
	clipped: IStateMap;
	unclipped: IStateMap;
}
type ILayerMap = Map < number, IClipGroups >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the shapes list.
 * @returns {IShapeList} The shapes list.
 */
///////////////////////////////////////////////////////////////////////////////

const getShapeList = ( sm: IShapesMap, matrix: IMatrix44 ) : IShapeList =>
{
	let sl = sm.get ( matrix );
	if ( !sl )
	{
		sl = {
			matrix,
			shapes: []
		}
		sm.set ( matrix, sl );
	}
	return sl;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the map of shapes. Make it if we have to.
 * @returns {IStatePair} The map of shapes.
 */
///////////////////////////////////////////////////////////////////////////////

const getShapesMap = ( proj: IProjectionGroup, matrix: IMatrix44 ) : IShapesMap =>
{
	let sm = proj.get ( matrix );
	if ( !sm )
	{
		sm = new Map < IMatrix44, IShapeList > ();
		proj.set ( matrix, sm );
	}
	return sm;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the state pair. Make it if we have to.
 * @returns {IStatePair} The state pair.
 */
///////////////////////////////////////////////////////////////////////////////

const getStatePair = ( stateMap: IStateMap, state: ( State | null ), defaultState: State ) : IStatePair =>
{
	state = state ?? defaultState;
	const name = state.name;
	let sp = stateMap.get ( name );
	if ( !sp )
	{
		sp = {
			state,
			proj: new Map < IMatrix44, IShapesMap > ()
		}
		stateMap.set ( name, sp );
	}
	return sp;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the clip groups. Make it if we have to.
 * @returns {IClipGroups} The clip groups.
 */
///////////////////////////////////////////////////////////////////////////////

const getClipGroups = ( layers: ILayerMap, layer: number ) : IClipGroups =>
{
	let cg = layers.get ( layer );
	if ( !cg )
	{
		cg = {
			clipped:   new Map < string, IStatePair > (),
			unclipped: new Map < string, IStatePair > ()
		};
		layers.set ( layer, cg );
	}
	return cg;
}


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
	 * Visit the shape.
	 */
	public visitShape ( shape: Shape ) : void
	{
		// Shortcuts.
		const layers = this.#layers;
		const modelMatrix = this.modelMatrix;
		const projMatrix = this.projMatrix;
		const clipped = shape.clipped;
		const layer = shape.layer;

		// Get or make the containers we need.
		const clipGroups: IClipGroups = getClipGroups ( layers, layer );
		const stateMap: IStateMap = ( clipped ? clipGroups.clipped : clipGroups.unclipped );
		const { proj }: IStatePair = getStatePair ( stateMap, shape.state, this.#defaultState );
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
