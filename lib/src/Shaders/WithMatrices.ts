///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders a solid color.
//	https://stackoverflow.com/questions/71535213/a-way-to-load-wglsl-files-in-typescript-files-using-esbuild
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
	#modelMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];

	/**
	 * Construct the class.
	 * @class
	 * @param {IWithMatricesInput} [input] - The input for the shader.
	 */
	protected constructor ( input: IWithMatricesInput )
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
	 * Get the model matrix.
	 * @returns {IMatrix44} The model matrix.
	 */
	protected getModelMatrix () : Readonly<IMatrix44>
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
