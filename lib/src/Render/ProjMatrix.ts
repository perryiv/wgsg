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
import { ModelMatrix } from "./ModelMatrix";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IModelMatrixMap = Map < string, ModelMatrix >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for projection matrix and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ProjMatrix extends BaseClass
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#modelMatrixMap: IModelMatrixMap = new Map < string, ModelMatrix > ();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.ProjMatrix";
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
	 * Set the matrix.
	 * @param {IMatrix44} matrix - The new matrix.
	 */
	public set matrix ( matrix: IMatrix44 )
	{
		mat4.copy ( this.#matrix, matrix );
	}

	/**
	 * Get the model matrix map.
	 * @returns {IModelMatrixMap} The model matrix map.
	 */
	public get modelMatrixMap() : IModelMatrixMap
	{
		return this.#modelMatrixMap;
	}
}
