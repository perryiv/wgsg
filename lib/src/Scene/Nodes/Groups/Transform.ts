
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
import { Matrix44 } from "../../../Types";
import { Visitor } from "../../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform group class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Transform extends Group
{
	#matrix: Matrix44 = [ ...IDENTITY_MATRIX ];

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
	 * Apply the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public apply ( visitor: Visitor ): void
	{
		visitor.visitTransform ( this );
	}

	/**
	 * Get the matrix.
	 * @returns {Matrix44} The transformation matrix.
	 */
	public get matrix () : Matrix44
	{
		return this.#matrix;
	}

	/**
	 * Set the matrix.
	 * @param {Matrix44} matrix - The transformation matrix.
	 */
	public set matrix ( matrix: Matrix44 )
	{
		// Do this to keep the TypeScript compiler happy.
		const size: number = matrix.length;

		// Check the size.
		if ( 16 !== size )
		{
			throw new Error ( `Invalid array length ${size} for transformation matrix, should be 16` );
		}

		// Make a copy.
		this.#matrix = [ ... matrix ];
	}
}
