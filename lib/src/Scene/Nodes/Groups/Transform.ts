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

import { Box, isValidMatrix } from "../../../Math";
import { Group } from "./Group";
import { IDENTITY_MATRIX } from "../../../Tools";
import { IMatrix44, IVector3 } from "../../../Types";
import { mat4 } from "gl-matrix";
import { Visitor } from "../../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform group class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Transform extends Group
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @class
	 * @param {IMatrix44 | null | undefined} matrix - Optional matrix input.
	 */
	constructor ( matrix?: ( Readonly<IMatrix44> | null ) )
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
	public set matrix ( matrix: Readonly<IMatrix44> )
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
	 * Translate the matrix.
	 * @param {IVector3} v - The translation vector.
	 */
	public translate ( v: Readonly<IVector3> ) : void
	{
		mat4.translate ( this.#matrix, this.#matrix, v );
	}

	/**
	 * Rotate the matrix.
	 * @param {number} angle - The rotation angle in radians.
	 * @param {IVector3} axis - The rotation axis.
	 */
	public rotate ( angle: Readonly<number>, axis: Readonly<IVector3> ) : void
	{
		mat4.rotate ( this.#matrix, this.#matrix, angle, axis );
	}

	/**
	 * See if the matrix is valid.
	 * @returns {boolean} True if the matrix is valid, otherwise false.
	 */
	public get valid () : boolean
	{
		return isValidMatrix ( this.#matrix );
	}

	/**
	 * Get the bounding box of this node.
	 * @returns {Box} The bounding box of this node.
	 */
	protected override getBoundingBox() : Box
	{
		// Call the base class function.
		const box = super.getBoundingBox();

		// Handle invalid box.
		if ( false === box.valid )
		{
			return box;
		}

		// Return the transformed box.
		return Box.transform ( box, this.#matrix );
	}
}
