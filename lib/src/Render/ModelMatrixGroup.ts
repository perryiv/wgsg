///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Contains the model matrix and everything that gets rendered with it.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { IDENTITY_MATRIX } from "../Tools/Constants";
import { mat4 } from "gl-matrix";
import { State } from "../Scene";
import { StateGroup } from "./StateGroup";
import type { IMatrix44, IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IStateGroupMap = Map < string, StateGroup >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for model matrix and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ModelMatrixGroup extends BaseClass
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#stateGroupMap: IStateGroupMap = new Map < string, StateGroup > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	constructor ( matrix: Readonly<IMatrix44> )
	{
		super();
		mat4.copy ( this.#matrix, matrix );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.ModelMatrixGroup";
	}

	/**
	 * Get the matrix.
	 * @returns {IMatrix44} The matrix.
	 */
	public get matrix() : IMatrix44
	{
		return this.#matrix;
	}

	/**
	 * Get the state group. Make it if we have to.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {State} state - The state.
	 * @returns {StateGroup} The state group.
	 */
	public getStateGroup ( info: IRenderGraphInfo, state: State ) : StateGroup
	{
		// Two states with the same name become one state group in the map.
		const { name } = state;
		let sg = this.#stateGroupMap.get ( name );
		if ( !sg )
		{
			sg = new StateGroup ( state );
			this.#stateGroupMap.set ( name, sg );
			info.numStateGroups++;
		}
		return sg;
	}

	/**
	 * Call the given function for each state group.
	 * @param {Function} func - The function to call.
	 */
	public forEachStateGroup ( func: ( sg: StateGroup ) => void )
	{
		this.#stateGroupMap.forEach ( func );
	}

	/**
	 * Get the number of shapes.
	 * @returns {number} The number of shapes.
	 */
	public get numStateGroups() : number
	{
		return this.#stateGroupMap.size;
	}
}
