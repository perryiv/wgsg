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
import { Shape, State } from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	The hierarchy of items in the render graph.
//
///////////////////////////////////////////////////////////////////////////////

/*
- layers
	- layer
		- projection-matrix-map (unclipped)
		- projection-matrix-map (clipped)
			- projection-matrix (as string)
				- projection-matrix-data
					- projection-matrix
					- states-map
						- state-name
							- state-data
								- state
								- model-matrix-map
									- model-matrix (as string)
										- model-matrix-data
											- model-matrix
											- shapes-array
*/


///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IMatrixAsString = string;
export interface IModelMatrixData
{
	modelMatrix: IMatrix44;
	shapes: Shape[];
}
export type IModelMatrixMap = Map < IMatrixAsString, IModelMatrixData >;
export interface IStateData
{
	state: State;
	modelMatrices: IModelMatrixMap;
}
export type IStateMap = Map < string, IStateData >;
export interface IProjMatrixData
{
	projMatrix: IMatrix44;
	states: IStateMap;
}
export type IProjMatrixMap = Map < IMatrixAsString, IProjMatrixData >;
export interface ILayer
{
	clipped: IProjMatrixMap;
	unclipped: IProjMatrixMap;
}
export type ILayerMap = Map < number, ILayer >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the map key from the matrix.
 * @param {IMatrix44} matrix - The transformation matrix.
 * @returns {IMatrixAsString} The key for the matrix map.
 */
///////////////////////////////////////////////////////////////////////////////

export const getIMatrixAsString = ( matrix: IMatrix44 ) : IMatrixAsString =>
{
	return matrix.toString();
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the data associated with the given model matrix.
 * Make it if we have to.
 * @param {IModelMatrixMap} mmm - The map of model matrices.
 * @param {IMatrix44} modelMatrix - The model matrix.
 * @returns {IModelMatrixData} The model matrix data.
 */
///////////////////////////////////////////////////////////////////////////////

export const getModelMatrixData = ( mmm: IModelMatrixMap, modelMatrix: IMatrix44 ) : IModelMatrixData =>
{
	const name = getIMatrixAsString ( modelMatrix );
	let mmd = mmm.get ( name );
	if ( !mmd )
	{
		modelMatrix = [ ...modelMatrix ]; // Important! Store a copy.
		mmd = {
			modelMatrix,
			shapes: []
		};
		mmm.set ( name, mmd );
	}
	return mmd;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the state data associated with the given state name.
 * Make it if we have to.
 * @param {IStateMap} sm - The map of state data.
 * @param {string} name - The name of the state.
 * @returns {IStateData} The state data.
 */
///////////////////////////////////////////////////////////////////////////////

export const getStateData = ( sm: IStateMap, name: string ) : IStateData =>
{
	let sd = sm.get ( name );
	if ( !sd )
	{
		sd = {
			state: new State(),
			modelMatrices: new Map < IMatrixAsString, IModelMatrixData > ()
		};
		sm.set ( name, sd );
	}
	return sd;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the data associated with the given projection matrix.
 * Make it if we have to.
 * @param {IProjMatrixMap} pmm - The map of projection matrices.
 * @param {IMatrix44} projMatrix - The projection matrix.
 * @returns {IProjMatrixData} The projection matrix data.
 */
///////////////////////////////////////////////////////////////////////////////

export const getProjMatrixData = ( pmm: IProjMatrixMap, projMatrix: IMatrix44 ) : IProjMatrixData =>
{
	const name = getIMatrixAsString ( projMatrix );
	let pmd = pmm.get ( name );
	if ( !pmd )
	{
		projMatrix = [ ...projMatrix ]; // Important! Store a copy.
		pmd = {
			projMatrix,
			states: new Map < string, IStateData > ()
		}
		pmm.set ( name, pmd );
	}
	return pmd;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the layer. Make it if we have to.
 * @param {ILayerMap} layers - The map of layers.
 * @param {number} layer - The layer number.
 * @returns {ILayer} The layer.
 */
///////////////////////////////////////////////////////////////////////////////

export const getLayer = ( layers: ILayerMap, layer: number ) : ILayer =>
{
	let cg = layers.get ( layer );
	if ( !cg )
	{
		cg = {
			clipped:   new Map < IMatrixAsString, IProjMatrixData > (),
			unclipped: new Map < IMatrixAsString, IProjMatrixData > ()
		};
		layers.set ( layer, cg );
	}
	return cg;
}
