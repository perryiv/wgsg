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
import { IMatrix44 } from "../Types";
import { ProjMatrixGroup } from "./ProjMatrixGroup";
import { ShaderBase } from "../Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IProjMatrixMap = Map < string, ProjMatrixGroup >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a render pipeline.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Pipeline extends BaseClass
{
	#shader: ShaderBase;
	#projMatrixMap: IProjMatrixMap = new Map < string, ProjMatrixGroup > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {ShaderBase} shader - The pipeline shader.
	 */
	constructor ( shader: ShaderBase )
	{
		super();
		this.#shader = shader;
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
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public set projMatrix ( matrix: IMatrix44 )
	{
		this.shader.projMatrix = matrix;
	}

	/**
	 * Set the model matrix.
	 * @param {IMatrix44} matrix - The model matrix.
	 */
	public set modelMatrix ( matrix: IMatrix44 )
	{
		this.shader.modelMatrix = matrix;
	}

	/**
	 * Get the projection matrix. Make it if we have to.
	 * @param {IMatrix44} matrix - The projection matrix.
	 * @returns {ProjMatrix} The projection matrix.
	 */
	public getProjMatrixGroup ( matrix: IMatrix44 ) : ProjMatrixGroup
	{
		const name = JSON.stringify ( matrix );
		let pmg = this.#projMatrixMap.get ( name );
		if ( !pmg )
		{
			pmg = new ProjMatrixGroup ( matrix );
			this.#projMatrixMap.set ( name, pmg );
		}
		return pmg;
	}

	/**
	 * Call the given function for each projection matrix.
	 * @param {Function} func - The function to call.
	 */
	public forEachProjMatrixGroup ( func: ( pmg: ProjMatrixGroup ) => void ) : void
	{
		// The order doesn't matter so we don't sort like the layers and bins.
		this.#projMatrixMap.forEach ( func );
	}

	/**
	 * Get the number of projection matrices.
	 * @returns {number} The number of projection matrices.
	 */
	public get numProjMatrices () : number
	{
		return this.#projMatrixMap.size;
	}

	/**
	 * Get the shader.
	 * @returns {ShaderBase} The shader.
	 */
	public get shader() : ShaderBase
	{
		const shader = this.#shader;
		if ( !shader )
		{
			throw new Error ( "Pipeline has invalid shader" );
		}
		return shader;
	}


	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 */
	public configureRenderPass ( pass: GPURenderPassEncoder ) : void
	{
		const { shader } = this;

		if ( !shader )
		{
			throw new Error ( `Pipeline ${this.type} ${this.id} has invalid shader when configuring render pass` );
		}

		// Configure the render pass.
		shader.configureRenderPass ( pass );
	}
}
