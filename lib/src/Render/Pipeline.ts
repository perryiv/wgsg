///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Represents a render pipeline.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { ShaderBase } from "../Shaders";
import { ProjMatrix } from "./ProjMatrix";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IProjMatrixMap = Map < string, ProjMatrix >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a render pipeline.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Pipeline extends BaseClass
{
	#shader: ( ShaderBase | null ) = null;
	#pipeline: ( GPUShaderModule | null ) = null;
	#projMatrixMap: IProjMatrixMap = new Map < string, ProjMatrix > ();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.Pipeline";
	}
	
	/**
	 * Get the projection matrices.
	 * @returns {IProjMatrixMap} The projection matrices map.
	 */
	public get projMatrixMap() : IProjMatrixMap
	{
		return this.#projMatrixMap;
	}

	/**
	 * Get the shader.
	 * @returns {ShaderBase | null} The shader.
	 */
	public get shader() : ( ShaderBase | null )
	{
		return this.#shader;
	}

	/**
	 * Set the shader.
	 * @param {ShaderBase | null} shader - The new shader.
	 */
	public set shader ( shader: ( ShaderBase | null ) )
	{
		this.#shader = shader;
	}

	/**
	 * Get the GPU pipeline.
	 * @returns {GPUShaderModule} The GPU pipeline.
	 */
	public get pipeline() : GPUShaderModule
	{
		const pipeline = this.#pipeline;
		if ( !pipeline )
		{
			throw new Error ( "TODO: Make the pipeline here" );
		}
		return pipeline;
	}
}
