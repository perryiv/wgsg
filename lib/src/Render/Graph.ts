///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The render graph. It gets built every frame during the cull traversal.
//
///////////////////////////////////////////////////////////////////////////////

import type { IMatrix44 } from "../Types";
import {
	Shape,
	State,
} from "../Scene";



///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IShapesMap = Map < IMatrix44, Shape[] >;
export type IProjectionGroup = Map < IMatrix44, IShapesMap >;
export interface IStatePair
{
	state: State;
	proj: IProjectionGroup
}
export type IStateMap = Map < string, IStatePair >;
export interface IClipGroups
{
	clipped: IStateMap;
	unclipped: IStateMap;
}
export type ILayerMap = Map < number, IClipGroups >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the shapes list.
 * @param {IShapesMap} sm - The map containing lists of shapes.
 * @param {IMatrix44} matrix - The transformation matrix.
 * @returns {Shape[]} The shapes list.
 */
///////////////////////////////////////////////////////////////////////////////

export const getShapeList = ( sm: IShapesMap, matrix: IMatrix44 ) : Shape[] =>
{
	let sl = sm.get ( matrix );
	if ( !sl )
	{
		sl = [];
		sm.set ( matrix, sl );
	}
	return sl;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the map of shapes. Make it if we have to.
 * @param {IProjectionGroup} proj - The projection group.
 * @param {IMatrix44} matrix - The transformation matrix.
 * @returns {IStatePair} The map of shapes.
 */
///////////////////////////////////////////////////////////////////////////////

export const getShapesMap = ( proj: IProjectionGroup, matrix: IMatrix44 ) : IShapesMap =>
{
	let sm = proj.get ( matrix );
	if ( !sm )
	{
		sm = new Map < IMatrix44, Shape[] > ();
		proj.set ( matrix, sm );
	}
	return sm;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the state pair. Make it if we have to.
 * @param {IStateMap} stateMap - The state map.
 * @param {State} state - The state object.
 * @returns {IStatePair} The state pair.
 */
///////////////////////////////////////////////////////////////////////////////

export const getStatePair = ( stateMap: IStateMap, state: State ) : IStatePair =>
{
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
 * @param {ILayerMap} layers - The map of layers.
 * @param {number} layer - The layer number.
 * @returns {IClipGroups} The clip groups.
 */
///////////////////////////////////////////////////////////////////////////////

export const getClipGroups = ( layers: ILayerMap, layer: number ) : IClipGroups =>
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
