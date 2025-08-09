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

import { IVector4 } from "../Types";
import { ShaderBase } from "./ShaderBase";
import { vec4 } from "gl-matrix";

// @ts-expect-error TypeScript does not recognize WGSL files.
import code from "./SolidColor.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISolidColorShaderInput
{
	color?: IVector4;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Importing this class should register it with the shader manager.
//
///////////////////////////////////////////////////////////////////////////////

export const SOLID_COLOR_SHADER_NAME = "Shaders.SolidColor";


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
	 * @param {ISolidColorShaderInput} input - The input for the constructor.
	 * @param {string} [input.code] - The shader code.
	 * @param {IVector4} [input.color] - The color to use.
	 */
	public constructor ( input?: ISolidColorShaderInput )
	{
		super ( { code: ( code as string ) } );

		const { color } = ( input ? input : {} );

		if ( ( color ) && ( 4 === color.length ) )
		{
			vec4.copy ( this.#color, color );
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return SOLID_COLOR_SHADER_NAME;
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
