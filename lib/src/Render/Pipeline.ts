///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Represents a render pipeline.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { IMatrix44 } from "../Types";
import { ProjMatrix } from "./ProjMatrix";
import { State } from "../Scene/State";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IProjMatrixMap = Map < string, ProjMatrix >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a render pipeline.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Pipeline extends BaseClass
{
	#state: State;
	#projMatrixMap: IProjMatrixMap = new Map < string, ProjMatrix > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {State} state - The pipeline state.
	 */
	constructor ( state: State )
	{
		super();
		this.#state = state;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.Pipeline";
	}

	/**
	 * Get the projection matrix. Make it if we have to.
	 * @param {IMatrix44} matrix - The projection matrix.
	 * @returns {ProjMatrix} The projection matrix.
	 */
	public getProjMatrix ( matrix: IMatrix44 ) : ProjMatrix
	{
		const name = JSON.stringify ( matrix );
		let projMatrix = this.#projMatrixMap.get ( name );
		if ( !projMatrix )
		{
			projMatrix = new ProjMatrix ( matrix );
			this.#projMatrixMap.set ( name, projMatrix );
		}
		return projMatrix;
	}

	/**
	 * Call the given function for each projection matrix.
	 * @param {Function} func - The function to call.
	 */
	public forEachProjMatrix ( func: ( projMatrix: ProjMatrix ) => void ) : void
	{
		// The order doesn't matter so we don't sort like the layers and bins.
		this.#projMatrixMap.forEach ( func );
	}

	/**
	 * Get the number of projection matrices.
	 * @returns {number} The number of projection matrices.
	 */
	public get numProjMatrices () : number
	{
		return this.#projMatrixMap.size;
	}

	/**
	 * Get the state.
	 * @returns {State} The state.
	 */
	public get state() : State
	{
		const state = this.#state;
		if ( !state )
		{
			throw new Error ( "Pipeline has invalid state" );
		}
		return state;
	}
}
