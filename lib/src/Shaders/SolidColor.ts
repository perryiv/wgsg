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
import { Manager } from "./Manager";
import { ShaderBase } from "./ShaderBase";
import { vec4 } from "gl-matrix";

// @ts-expect-error TypeScript does not recognize WGSL files.
import code from "./SolidColor.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Importing this class should register it with the shader manager.
//
///////////////////////////////////////////////////////////////////////////////

const THIS_CLASS_NAME = "Shaders.SolidColor";
Manager.instance.add ( THIS_CLASS_NAME, (	device: GPUDevice ) =>
{
	return SolidColor.factory ( device );
} );


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
	protected constructor ( device: GPUDevice, color?: IVector4 )
	{
		super ( device, ( code as string ) );

		if ( color )
		{
			vec4.copy ( this.#color, color );
		}
	}

	/**
	 * Factory function for this shader.
	 * @param {GPUDevice} device The GPU device.
	 * @returns {SolidColor} The shader instance.
	 */
	public static factory ( this: void, device: GPUDevice ) : SolidColor
	{
		return new SolidColor ( device );
	}
	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return THIS_CLASS_NAME;
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
