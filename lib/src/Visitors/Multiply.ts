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

import { IDENTITY_MATRIX } from "../Tools";
import { IMatrix44 } from "../Types";
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
	#modelMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#projMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

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
	 * Return the model matrix.
	 * @return {IMatrix44} The model matrix.
	 */
	public get modelMatrix()
	{
		return this.#modelMatrix;
	}

	/**
	 * Return the projection matrix.
	 * @return {IMatrix44} The projection matrix.
	 */
	public get projMatrix()
	{
		return this.#projMatrix;
	}

	/**
	 * Visit the transform.
	 */
	public visitTransform ( transform: Transform ) : void
	{
		// Make a copy of the original matrix.
		const original: IMatrix44 = [ ...this.#modelMatrix ];

		// Multiply the original matrix by the given one and save it in our member.
		mat4.multiply ( this.#modelMatrix, original, transform.matrix );

		// Now call the base class's function.
		super.visitTransform ( transform );

		// Put things back where we found them.
		mat4.copy ( this.#modelMatrix, original );
	}

	/**
	 * Visit the projection.
	 */
	public visitProjection ( proj: Projection ) : void
	{
		// Make a copy of the original matrix.
		const original: IMatrix44 = [ ...this.#projMatrix ];

		// Set our member.
		mat4.copy ( this.#projMatrix, proj.matrix );

		// Now call the base class's function.
		super.visitProjection ( proj );

		// Put things back where we found them.
		mat4.copy ( this.#projMatrix, original );
	}
}
