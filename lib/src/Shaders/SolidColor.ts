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
//
///////////////////////////////////////////////////////////////////////////////

import { vec4 } from "gl-matrix";
import { IVector4 } from "../Types";
import { ShaderBase } from "./ShaderBase";


///////////////////////////////////////////////////////////////////////////////
//
//	Vertex and fragment shader code.
//
///////////////////////////////////////////////////////////////////////////////

const shaderCode = `
@vertex fn vs(
	@builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
	let pos = array(
		vec2f( 0.0,  0.5),  // top center
		vec2f(-0.5, -0.5),  // bottom left
		vec2f( 0.5, -0.5)   // bottom right
	);

	return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs() -> @location(0) vec4f {
	return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;


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
		super ( device, shaderCode );

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
