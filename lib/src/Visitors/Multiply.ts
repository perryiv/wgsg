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
	 * Visit the transform.
	 * @param {Transform} tr - The transform to visit.
	 */
	public visitTransform ( tr: Transform ) : void
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
