///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for shaders that light a material with a directional light and
//	an ambient light. The uniforms are the same for all of them, so the shader
//	code for each starts with Lighting.wgsl, which also has the lighting.
//
///////////////////////////////////////////////////////////////////////////////

import { vec4 } from "gl-matrix";
import {
	DEFAULT_AMBIENT,
	DEFAULT_AMBIENT_LIGHT,
	DEFAULT_DIFFUSE,
	DEFAULT_EMISSION,
	DEFAULT_SHININESS,
	DEFAULT_SPECULAR,
	MAX_SHININESS,
} from "../Tools/Constants";
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
 * Base class for shaders that light a material.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Lighting extends BaseClass
{
	#ambient: IVector4 = [ ...DEFAULT_AMBIENT ];
	#diffuse: IVector4 = [ ...DEFAULT_DIFFUSE ];
	#specular: IVector4 = [ ...DEFAULT_SPECULAR ];
	#emission: IVector4 = [ ...DEFAULT_EMISSION ];
	#shininess = DEFAULT_SHININESS;
	#twoSidedLight = false;
	#lightDir: IVector4 = [ 0.0, 0.0, -1.0, 0.0 ];
	#ambientLight: IVector4 = [ ...DEFAULT_AMBIENT_LIGHT ];
	#camera: ( ArrayBuffer | null ) = null;
	#material: ( ArrayBuffer | null ) = null;

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
	 * Return the ambient color.
	 * @returns {IVector4} The color.
	 */
	public get ambient () : IVector4
	{
		return [ ...this.#ambient ];
	}

	/**
	 * Set the ambient color.
	 * @param {IVector4} color - The color.
	 */
	public set ambient ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#ambient, color );
		this.materialChanged();
	}

	/**
	 * Return the diffuse color.
	 * @returns {IVector4} The color.
	 */
	public get diffuse () : IVector4
	{
		return [ ...this.#diffuse ];
	}

	/**
	 * Set the diffuse color.
	 * @param {IVector4} color - The color.
	 */
	public set diffuse ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#diffuse, color );
		this.materialChanged();
	}

	/**
	 * Return the specular color.
	 * @returns {IVector4} The color.
	 */
	public get specular () : IVector4
	{
		return [ ...this.#specular ];
	}

	/**
	 * Set the specular color.
	 * @param {IVector4} color - The color.
	 */
	public set specular ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#specular, color );
		this.materialChanged();
	}

	/**
	 * Return the emission color.
	 * @returns {IVector4} The color.
	 */
	public get emission () : IVector4
	{
		return [ ...this.#emission ];
	}

	/**
	 * Set the emission color.
	 * @param {IVector4} color - The color.
	 */
	public set emission ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#emission, color );
		this.materialChanged();
	}

	/**
	 * Return the shininess.
	 * @returns {number} The shininess, from 0 to 128.
	 */
	public get shininess () : number
	{
		return this.#shininess;
	}

	/**
	 * Set the shininess.
	 * @param {number} shininess - The shininess, from 0 to 128.
	 */
	public set shininess ( shininess: number )
	{
		if ( !( ( shininess >= 0 ) && ( shininess <= MAX_SHININESS ) ) )
		{
			throw new Error ( `Shininess ${shininess} is not from 0 to ${MAX_SHININESS}` );
		}
		this.#shininess = shininess;
		this.materialChanged();
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
		this.materialChanged();
	}

	/**
	 * Put back the default values of what state attributes set. The lights
	 * are not one of them.
	 */
	public override reset () : void
	{
		this.ambient = DEFAULT_AMBIENT;
		this.diffuse = DEFAULT_DIFFUSE;
		this.specular = DEFAULT_SPECULAR;
		this.emission = DEFAULT_EMISSION;
		this.shininess = DEFAULT_SHININESS;
		this.twoSidedLight = false;
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
		this.cameraChanged();
	}

	/**
	 * Return the ambient light.
	 * @returns {IVector4} The color of the ambient light.
	 */
	public get ambientLight () : IVector4
	{
		return [ ...this.#ambientLight ];
	}

	/**
	 * Set the ambient light. It lights every side the same, times the
	 * material's ambient color.
	 * @param {IVector4} color - The color of the ambient light.
	 */
	public set ambientLight ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#ambientLight, color );
		this.cameraChanged();
	}

	/**
	 * Return the camera's uniform values, in the same order as the "Camera"
	 * struct in the shader code: the projection matrix, the light direction
	 * and one unused value, which lines the next one up on 16 bytes, and the
	 * ambient light.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected makeCameraUniforms () : ArrayBuffer
	{
		this.#camera ??= new ArrayBuffer ( ( 16 + 4 + 4 ) * 4 );
		const floats = new Float32Array ( this.#camera );
		floats.set ( this.projMatrix, 0 );
		floats.set ( [ this.#lightDir[0], this.#lightDir[1], this.#lightDir[2] ], 16 );
		floats.set ( this.#ambientLight, 20 );
		return this.#camera;
	}

	/**
	 * Get the number of 4-byte values in the material's uniforms, like the
	 * "Surface" struct in Lighting.wgsl: the ambient, diffuse, specular, and
	 * emission colors, the shininess, the two-sided flag, and two unused
	 * values so that the size is a multiple of 16 bytes. Derived classes that
	 * add uniforms after these override this.
	 * @returns {number} The number of 4-byte values.
	 */
	protected get numMaterialValues () : number
	{
		return ( ( 4 * 4 ) + 1 + 1 + 2 );
	}

	/**
	 * Return the material's uniform values, in the same order as the
	 * "Material" struct in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected makeMaterialUniforms () : ArrayBuffer
	{
		this.#material ??= new ArrayBuffer ( this.numMaterialValues * 4 );
		const floats = new Float32Array ( this.#material );
		floats.set ( this.#ambient, 0 );
		floats.set ( this.#diffuse, 4 );
		floats.set ( this.#specular, 8 );
		floats.set ( this.#emission, 12 );
		floats[16] = this.#shininess;
		new Uint32Array ( this.#material )[17] = ( this.#twoSidedLight ? 1 : 0 );
		return this.#material;
	}
}
