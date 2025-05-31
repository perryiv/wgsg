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

import { vec4 } from "gl-matrix";
import { IVector4 } from "../Types";
import { ShaderBase } from "./ShaderBase";

// @ts-expect-error TypeScript does not recognize WGSL files.
import shaderCode from "./SolidColor.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class SolidColor extends ShaderBase
{
	#color: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ];

	/**
	 * Construct the class.
	 * @class
	 * @param {GPUDevice} device The GPU device.
	 * @param {IVector4} [color] The color to use.
	 */
	constructor ( device: GPUDevice, color?: IVector4 )
	{
		super ( device, ( shaderCode as string ) );

		if ( color )
		{
			vec4.copy ( this.#color, color );
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Shaders.SolidColor";
	}

	/**
	 * Set the color.
	 * @param {IVector4} color The color to use.
	 */
	public set color ( color: IVector4 )
	{
		vec4.copy ( this.#color, color );
	}

	/**
	 * Return the color.
	 * @returns {IVector4} The color.
	 */
	public get color () : IVector4
	{
		return [ ...this.#color ];
	}
}
