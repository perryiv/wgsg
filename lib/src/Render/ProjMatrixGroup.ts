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
import { ViewMatrixGroup } from "./ViewMatrixGroup";
import type { IMatrix44, IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IviewMatrixMap = Map < string, ViewMatrixGroup >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for projection matrix and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ProjMatrixGroup extends BaseClass
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#viewMatrixMap: IviewMatrixMap = new Map < string, ViewMatrixGroup > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IMatrix44} matrix - The projection matrix.
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
	 * Get the view matrix group. Make it if we have to.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {IMatrix44} matrix - The view matrix.
	 * @returns {ViewMatrixGroup} The view matrix group.
	 */
	public getViewMatrixGroup ( info: IRenderGraphInfo, matrix: Readonly<IMatrix44> ) : ViewMatrixGroup
	{
		const name = JSON.stringify ( matrix );
		let mmg = this.#viewMatrixMap.get ( name );
		if ( !mmg )
		{
			mmg = new ViewMatrixGroup ( matrix );
			this.#viewMatrixMap.set ( name, mmg );
			info.numViewMatrixGroups++;
		}
		return mmg;
	}

	/**
	 * Call the given function for each view matrix group.
	 * @param {Function} func - The function to call.
	 */
	public forEachViewMatrixGroup ( func: ( mmg: ViewMatrixGroup ) => void ) : void
	{
		// The order doesn't matter so we don't sort like the layers and bins.
		this.#viewMatrixMap.forEach ( func );
	}

	/**
	 * Get the number of view matrices.
	 * @returns {number} The number of view matrices.
	 */
	public get numViewMatrices () : number
	{
		return this.#viewMatrixMap.size;
	}
}
