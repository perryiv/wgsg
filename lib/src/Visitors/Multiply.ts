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

import { IMatrix44 } from "../Types";
import { makeIdentity } from "../Tools/Math";
import { mat4 } from "gl-matrix";
import { ProjectionNode as Projection, Transform } from "../Scene";
import { Visitor } from "./Visitor";


///////////////////////////////////////////////////////////////////////////////
/**
 * Matrix multiplying visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Multiply extends Visitor
{
	#modelMatrix: IMatrix44 = makeIdentity(); // Has to be a copy.
	#projMatrix:  IMatrix44 = makeIdentity(); // Has to be a copy.

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Return the model matrix.
	 * @returns {IMatrix44} The model matrix.
	 */
	public get modelMatrix()
	{
		return this.#modelMatrix;
	}

	/**
	 * Return the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public get projMatrix()
	{
		return this.#projMatrix;
	}

	/**
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public set projMatrix ( matrix: Readonly<IMatrix44> )
	{
		// Check the input.
		if ( !matrix )
		{
			throw new Error ( "Invalid projection matrix" );
		}

		// Make sure it is a matrix.
		if ( 16 !== matrix.length )
		{
			throw new Error ( "Projection matrix must have 16 elements" );
		}

		// Copy the matrix.
		mat4.copy ( this.#projMatrix, matrix );
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform to visit.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		// Make a copy of the original matrix.
		const original: IMatrix44 = [ ...this.#modelMatrix ];

		// Multiply the original matrix by the given one and save it in our member.
		mat4.multiply ( this.#modelMatrix, original, tr.matrix );

		// Now call the base class's function.
		super.visitTransform ( tr );

		// Put things back where we found them.
		mat4.copy ( this.#modelMatrix, original );
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection to visit.
	 */
	public override visitProjection ( proj: Projection ) : void
	{
		// Make a copy of the original matrix.
		const original: IMatrix44 = [ ...this.#projMatrix ];

		// Set our member.
		this.projMatrix = proj.matrix;

		// Now call the base class's function.
		super.visitProjection ( proj );

		// Put things back where we found them.
		this.projMatrix = original;
	}
}
