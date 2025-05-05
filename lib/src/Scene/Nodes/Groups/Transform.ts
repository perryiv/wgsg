
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
import { IMatrix44 } from "../../../Types";
import { Visitor } from "../../../Visitors/Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform group class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Transform extends Group
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @param {IMatrix44 | null | undefined} matrix - Optional matrix input.
	 * @constructor
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
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Transform";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public accept ( visitor: Visitor ): void
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

		// Make a copy.
		this.#matrix = [ ... matrix ];
	}

	/**
	 * See if the matrix is valid.
	 * @returns {boolean} True if the matrix is valid, otherwise false.
	 */
	public get valid () : boolean
	{
		// Shortcut.
		const m = this.#matrix;

		// Get the array length.
		const length: number = m.length;

		// Check the length.
		if ( 16 !== length )
		{
			return false;
		}

		// Check all the elements.
		for ( let i = 0; i < 16; ++i )
		{
			if ( "number" !== ( typeof ( m[i] ) ) )
			{
				return false;
			}
			if ( false === isFinite ( m[i] ) )
			{
				return false;
			}
		}

		// It worked.
		return true;
	}
}
