///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for shaders that use a color and a directional light.
//	The uniforms are the same for all of them, so the shader code for each
//	must start with the same "Uniforms" struct and binding.
//
///////////////////////////////////////////////////////////////////////////////

import { ColorTool as Color } from "../Tools";
import { vec4 } from "gl-matrix";
import { WithMatrices as BaseClass, type IWithMatricesInput } from "./WithMatrices";
import type { IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ILightingInput = IWithMatricesInput;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for shaders that use a color and a directional light.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Lighting extends BaseClass
{
	#color: IVector4 = [ ...Color.gray ];
	#twoSidedLight = false;
	#lightDir: IVector4 = [ 0.0, 0.0, -1.0, 0.0 ];

	#uniforms: ( ArrayBuffer | null ) = null;

	/**
	 * Construct the class.
	 * @abstract
	 * @param {ILightingInput} input - The input.
	 */
	protected constructor ( input: Readonly<ILightingInput> )
	{
		super ( input );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.Lighting";
	}

	/**
	 * Get the name.
	 * @returns {string} The name of the shader.
	 */
	// public get name() : string
	// {
	// 	const color = this.color.join ( ", " );
	// 	const lightDir = this.lightDir.join ( ", " );
	// 	return `${this.type} with color: [${color}], two-sided lighting: ${this.twoSidedLight}, and light direction: [${lightDir}]`;
	// }

	/**
	 * Return the color.
	 * @returns {IVector4} The color.
	 */
	public get color () : IVector4
	{
		return [ ...this.#color ];
	}

	/**
	 * Set the color.
	 * @param {IVector4} color - The color.
	 */
	public set color ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#color, color );
		this.uniformsChanged();
	}

	/**
	 * Return whether to use two-sided lighting.
	 * @returns {boolean} Whether to use two-sided lighting.
	 */
	public get twoSidedLight () : boolean
	{
		return this.#twoSidedLight;
	}

	/**
	 * Set whether to use two-sided lighting.
	 * @param {boolean} twoSidedLight - Whether to use two-sided lighting.
	 */
	public set twoSidedLight ( twoSidedLight: boolean )
	{
		this.#twoSidedLight = twoSidedLight;
		this.uniformsChanged();
	}

	/**
	 * Return the light direction.
	 * @returns {IVector4} The light direction.
	 */
	public get lightDir () : IVector4
	{
		return [ ...this.#lightDir ];
	}

	/**
	 * Set the light direction.
	 * @param {IVector4} lightDir - The light direction.
	 */
	public set lightDir ( lightDir: Readonly<IVector4> )
	{
		vec4.copy ( this.#lightDir, lightDir );
		this.uniformsChanged();
	}

	/**
	 * Get the number of 4-byte values in the uniforms. Two 4x4 matrices, the
	 * color, the light direction, and the two-sided flag. Derived classes that
	 * add uniforms after these override this.
	 * @returns {number} The number of 4-byte values.
	 */
	protected get numUniformValues () : number
	{
		return ( 16 + 16 + 4 + 3 + 1 );
	}

	/**
	 * Return the uniform values, in the same order as the "Uniforms" struct
	 * in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected makeUniforms () : ArrayBuffer
	{
		let uniforms = this.#uniforms;
		if ( !uniforms )
		{
			uniforms = new ArrayBuffer ( this.numUniformValues * 4 );
			this.#uniforms = uniforms;
		}
		const floats = new Float32Array ( uniforms );
		floats.set ( this.projMatrix, 0 );
		floats.set ( this.viewMatrix, 16 );
		floats.set ( this.#color, 32 );
		floats.set ( [ this.#lightDir[0], this.#lightDir[1], this.#lightDir[2] ], 36 );
		new Uint32Array ( uniforms )[39] = ( this.#twoSidedLight ? 1 : 0 );
		return uniforms;
	}
}
