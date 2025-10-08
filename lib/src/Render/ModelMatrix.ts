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
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	constructor ( matrix: IMatrix44 )
	{
		super();
		mat4.copy ( this.#matrix, matrix );
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
	 * Add the shape to the model matrix.
	 * @param {Shape} shape - The shape to add.
	 */
	public addShape ( shape: Shape )
	{
		this.#shapes.push ( shape );
	}

	/**
	 * Call the given function for each shape.
	 * @param {Function} func - The function to call.
	 */
	public forEachShape ( func: ( shape: Shape, index: number ) => void )
	{
		this.#shapes.forEach ( func );
	}

	/**
	 * Get the number of shapes.
	 * @returns {number} The number of shapes.
	 */
	public get numShapes() : number
	{
		return this.#shapes.length;
	}

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public configureRenderPass ( pass: GPURenderPassEncoder ) : void
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	{
	}
}
