///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that handles the projection and model matrices.
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
	#projMatrix:  IMatrix44 = [ ...IDENTITY_MATRIX ];
	#modelMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

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
	protected getProjMatrix () : IMatrix44
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
	 * Get the model matrix.
	 * @returns {IMatrix44} The model matrix.
	 */
	protected getModelMatrix () : IMatrix44
	{
		return this.#modelMatrix;
	}

	/**
	 * Set the model matrix.
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	public override set modelMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#modelMatrix, matrix );
	}
}
