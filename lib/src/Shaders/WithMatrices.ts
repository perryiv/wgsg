///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that handles the projection and view matrices.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "../Tools";
import { mat4 } from "gl-matrix";
import { ShaderBase as BaseClass, type IShaderBaseInput } from "./ShaderBase";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IWithMatricesInput = IShaderBaseInput;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class WithMatrices extends BaseClass
{
	#projMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#viewMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @class
	 * @param {IWithMatricesInput} [input] - The input for the shader.
	 */
	protected constructor ( input: Readonly<IWithMatricesInput> )
	{
		super ( input );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		super.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.WithMatrices";
	}

	/**
	 * Get the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public get projMatrix () : Readonly<IMatrix44>
	{
		return this.#projMatrix;
	}

	/**
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public override set projMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#projMatrix, matrix );
	}

	/**
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public get viewMatrix () : Readonly<IMatrix44>
	{
		return this.#viewMatrix;
	}

	/**
	 * Set the view matrix.
	 * @param {IMatrix44} matrix - The view matrix.
	 */
	public override set viewMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#viewMatrix, matrix );
	}
}
