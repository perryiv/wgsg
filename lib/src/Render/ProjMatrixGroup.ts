///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Contains the projection matrix and everything that gets rendered with it.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { IDENTITY_MATRIX } from "../Tools/Constants";
import { mat4 } from "gl-matrix";
import { ModelMatrixGroup } from "./ModelMatrixGroup";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IModelMatrixMap = Map < string, ModelMatrixGroup >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for projection matrix and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ProjMatrixGroup extends BaseClass
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#modelMatrixMap: IModelMatrixMap = new Map < string, ModelMatrixGroup > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	constructor ( matrix: IMatrix44 )
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
		return "Render.ProjMatrixGroup";
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
	 * Get the model matrix. Make it if we have to.
	 * @param {IMatrix44} matrix - The model matrix.
	 * @returns {ModelMatrixGroup} The model matrix.
	 */
	public getModelMatrixGroup ( matrix: IMatrix44 ) : ModelMatrixGroup
	{
		const name = JSON.stringify ( matrix );
		let mmg = this.#modelMatrixMap.get ( name );
		if ( !mmg )
		{
			mmg = new ModelMatrixGroup ( matrix );
			this.#modelMatrixMap.set ( name, mmg );
		}
		return mmg;
	}

	/**
	 * Call the given function for each model matrix.
	 * @param {Function} func - The function to call.
	 */
	public forEachModelMatrixGroup ( func: ( mmg: ModelMatrixGroup ) => void ) : void
	{
		// The order doesn't matter so we don't sort like the layers and bins.
		this.#modelMatrixMap.forEach ( func );
	}

	/**
	 * Get the number of model matrices.
	 * @returns {number} The number of model matrices.
	 */
	public get numModelMatrices () : number
	{
		return this.#modelMatrixMap.size;
	}
}
