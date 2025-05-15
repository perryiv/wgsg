
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Projection group class.
//
///////////////////////////////////////////////////////////////////////////////

import { Group } from "./Group";
import { IDENTITY_MATRIX } from "../../../Tools/Constants";
import { IMatrix44 } from "../../../Types";
import { isValidMatrix } from "../../../Math";
import { mat4 } from "gl-matrix";
import { Visitor } from "../../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Projection group class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Projection extends Group
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @class
	 * @param {IMatrix44 | null | undefined} matrix - Optional matrix input.
	 */
	constructor ( matrix?: ( IMatrix44 | null ) )
	{
		// Do this first.
		super();

		// Set our matrix if we were given a valid one.
		if ( matrix )
		{
			this.matrix = matrix;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Scene.Nodes.Groups.Projection";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public accept ( visitor: Visitor ): void
	{
		visitor.visitProjection ( this );
	}

	/**
	 * Get the matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public get matrix () : IMatrix44
	{
		return this.#matrix;
	}

	/**
	 * Set the matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public set matrix ( matrix: IMatrix44 )
	{
		// Do this to keep the TypeScript compiler happy.
		const length: number = matrix.length;

		// Check the length.
		if ( 16 !== length )
		{
			throw new Error ( `Invalid array length ${length} for projection matrix, should be 16` );
		}

		// Write over the values in our existing matrix.
		mat4.copy ( this.#matrix, matrix );
	}

	/**
	 * See if the matrix is valid.
	 * @returns {boolean} True if the matrix is valid, otherwise false.
	 */
	public get valid () : boolean
	{
		return isValidMatrix ( this.#matrix );
	}
}
