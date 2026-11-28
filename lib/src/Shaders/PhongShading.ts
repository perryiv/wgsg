///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with Phong shading.
//	https://webgpufundamentals.org/webgpu/lessons/webgpu-lighting-directional.html
//
///////////////////////////////////////////////////////////////////////////////

import { Lighting as BaseClass } from "./Lighting";
import { State } from "../Scene";
import type { IPipelineOptions, IVertexArrayName } from "./ShaderBase";
import code from "./PhongShading.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IPhongShadingShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class PhongShading extends BaseClass
{
	static #instance: ( PhongShading | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IPhongShadingShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IPhongShadingShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code,
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {PhongShading} The singleton instance.
	 */
	public static get instance () : PhongShading
	{
		if ( !PhongShading.#instance )
		{
			PhongShading.#instance = new PhongShading();
		}
		return PhongShading.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( PhongShading.#instance )
		{
			PhongShading.#instance.destroy();
			PhongShading.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.PhongShading";
	}

	/**
	 * Make and return a state object that uses this shader.
	 * @param {object} input - The input object.
	 * @param {GPUPrimitiveTopology} input.topology - The primitive topology.
	 * @returns {State} The state object.
	 */
	public static makeState = ( { topology } : { topology: GPUPrimitiveTopology } ) : State =>
	{
		// Shortcut.
		const shader = PhongShading.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}

	/**
	 * Get the geometry's arrays that the pipeline reads as vertex buffers:
	 * the points and normals, and the colors if there are vertex colors.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {IVertexArrayName[]} The arrays.
	 */
	public getVertexArrays ( options: Readonly<IPipelineOptions> ) : IVertexArrayName[]
	{
		return ( ( true === options.vertexColors ) ? [ "points", "normals", "colors" ] : [ "points", "normals" ] );
	}
}
