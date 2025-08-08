///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Contains the model matrix and everything that gets rendered with it.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { IDENTITY_MATRIX } from "../Tools/Constants";
import { mat4 } from "gl-matrix";
import { Shape } from "../Scene/Nodes/Shapes/Shape";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for model matrix and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ModelMatrix extends BaseClass
{
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#shapes: Shape[] = [];

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.ModelMatrix";
	}

	/**
	 * Get the matrix.
	 * @returns {IMatrix44} The matrix.
	 */
	public get matrix() : IMatrix44
	{
		return this.#matrix;
	}

	/**
	 * Set the matrix.
	 * @param {IMatrix44} matrix - The new matrix.
	 */
	public set matrix ( matrix: IMatrix44 )
	{
		mat4.copy ( this.#matrix, matrix );
	}

	/**
	 * Get the shapes.
	 * @returns {Shape[]} The shapes array.
	 */
	public get shapes() : Shape[]
	{
		return this.#shapes;
	}
}
