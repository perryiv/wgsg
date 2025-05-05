///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Visitor class that modifies its matrix as it traverses the scene.
//
///////////////////////////////////////////////////////////////////////////////

import { mat4 } from "gl-matrix";
import { Group, Node, Shape, Transform } from "../Scene/index";
import { IDENTITY_MATRIX } from "../Tools";
import { IMatrix44 } from "../Types";
import { Visitor } from "./Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Matrix multiplying visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Multiply extends Visitor
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Return the matrix.
	 * @param {IMatrix44} matrix - The matrix.
	 */
	public get matrix()
	{
		return this.#matrix;
	}

	/**
	 * Visit the transform.
	 */
	public visitTransform ( transform: Transform ) : void
	{
		// Make a copy of the original matrix.
		const original: IMatrix44 = [ ...this.#matrix ];

		// Multiply the original matrix by the given one and save it in our member.
		mat4.multiply ( this.#matrix, original, transform.matrix );

		// Now call the base class's function.
		this.visitTransform ( transform );

		// Put things back where we found them.
		mat4.copy ( this.#matrix, original );
	}

	/**
	 * Visit these node types.
	 */
	public visitGroup ( group: Group ) : void
	{
		super.visitGroup ( group );
	}
	public visitNode ( node: Node ) : void
	{
		super.visitNode ( node );
	}
	public visitShape ( shape: Shape ) : void
	{
		super.visitShape ( shape );
	}
}
