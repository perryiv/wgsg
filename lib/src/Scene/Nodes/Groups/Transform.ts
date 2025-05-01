
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Transform group class.
//
///////////////////////////////////////////////////////////////////////////////

import { Group } from "./Group";
import { IDENTITY_MATRIX } from "../../../Tools/Constants";


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform group class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Transform extends Group
{
	#matrix: Float64Array = new Float64Array ( IDENTITY_MATRIX );

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Transform";
	}

	/**
	 * Get the matrix.
	 * @returns {Float64Array} The transformation matrix.
	 */
	public get matrix () : Float64Array
	{
		return this.#matrix;
	}

	/**
	 * Set the matrix.
	 * @param {Float64Array} matrix - The transformation matrix.
	 */
	public set matrix ( matrix: Float64Array )
	{
		// Check the size.
		if ( 16 !== matrix.length )
		{
			throw new Error ( `Invalid array length ${matrix.length} for transformation matrix, should be 16` );
		}

		// Make a copy.
		this.#matrix = new Float64Array ( matrix );
	}
}
