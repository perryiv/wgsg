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
import { IMatrix44 } from "../../../Types";
import { isValidMatrix } from "../../../Math";
import { mat4 } from "gl-matrix";
import { Visitor } from "../../../Visitors/Visitor";
import { makeIdentity } from "../../../Tools/Math";


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform group class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Transform extends Group
{
	#matrix: IMatrix44 = makeIdentity();

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
	public override getClassName() : string
	{
		return "Scene.Nodes.Groups.Transform";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public override accept ( visitor: Visitor ): void
	{
		visitor.visitTransform ( this );
	}

	/**
	 * Get the matrix.
	 * @returns {IMatrix44} The transformation matrix.
	 */
	public get matrix () : IMatrix44
	{
		return this.#matrix;
	}

	/**
	 * Set the matrix.
	 * @param {IMatrix44} matrix - The transformation matrix.
	 */
	public set matrix ( matrix: IMatrix44 )
	{
		// Do this to keep the TypeScript compiler happy.
		const length: number = matrix.length;

		// Check the length.
		if ( 16 !== length )
		{
			throw new Error ( `Invalid array length ${length} for transformation matrix, should be 16` );
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
