///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with flat shading. The geometry does not need
//	normal vectors, because the shader calculates them for each triangle.
//
///////////////////////////////////////////////////////////////////////////////

import { Lighting as BaseClass } from "./Lighting";
import { State } from "../Scene";
import type { IPipelineOptions, IVertexArrayName } from "./ShaderBase";
import code from "./FlatShading.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IFlatShadingShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class FlatShading extends BaseClass
{
	static #instance: ( FlatShading | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IFlatShadingShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IFlatShadingShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code,
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {FlatShading} The singleton instance.
	 */
	public static get instance () : FlatShading
	{
		if ( !FlatShading.#instance )
		{
			FlatShading.#instance = new FlatShading();
		}
		return FlatShading.#instance;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		if ( FlatShading.#instance )
		{
			FlatShading.#instance.destroy();
			FlatShading.#instance = null;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.FlatShading";
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
		const shader = FlatShading.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}

	/**
	 * Get the geometry's arrays that the pipeline reads as vertex buffers:
	 * the points, and the colors if there are vertex colors.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {IVertexArrayName[]} The arrays.
	 */
	public getVertexArrays ( options: Readonly<IPipelineOptions> ) : IVertexArrayName[]
	{
		return ( ( true === options.vertexColors ) ? [ "points", "colors" ] : [ "points" ] );
	}
}
