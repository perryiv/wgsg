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
import { ProjMatrixGroup } from "./ProjMatrixGroup";
import { ShaderBase, type IPipelineOptions } from "../Shaders";
import type { IMatrix44, IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IPipelineInput
{
	shader: ShaderBase;
	options: IPipelineOptions;
}

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
	#options: IPipelineOptions;
	#projMatrixMap: IProjMatrixMap = new Map < string, ProjMatrixGroup > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IPipelineInput} input - The shader, and the options the GPU
	 * pipeline is made with.
	 */
	constructor ( { shader, options }: IPipelineInput )
	{
		super();
		this.#shader = shader;
		this.#options = { ...options };
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
	 * Get the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public get projMatrix () : Readonly<IMatrix44>
	{
		return this.shader.projMatrix;
	}

	/**
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public set projMatrix ( matrix: Readonly<IMatrix44> )
	{
		this.shader.projMatrix = matrix;
	}

	/**
	 * Get the projection matrix group. Make it if we have to.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {IMatrix44} matrix - The projection matrix.
	 * @param {string} [key] - The matrix as a string, if the caller already
	 * has it. Making it for every shape would be slow.
	 * @returns {ProjMatrixGroup} The projection matrix group.
	 */
	public getProjMatrixGroup ( info: IRenderGraphInfo, matrix: Readonly<IMatrix44>, key?: string ) : ProjMatrixGroup
	{
		const name = ( key ?? JSON.stringify ( matrix ) );
		let pmg = this.#projMatrixMap.get ( name );
		if ( !pmg )
		{
			pmg = new ProjMatrixGroup ( matrix );
			this.#projMatrixMap.set ( name, pmg );
			info.numProjMatrixGroups++;
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
	 * Get the topology.
	 * @returns {GPUPrimitiveTopology} The topology.
	 */
	public get topology() : GPUPrimitiveTopology
	{
		return this.#options.topology;
	}

	/**
	 * Get the options the GPU pipeline is made with.
	 * @returns {IPipelineOptions} The pipeline options.
	 */
	public get options() : Readonly<IPipelineOptions>
	{
		return this.#options;
	}

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public configureRenderPass ( pass: GPURenderPassEncoder, frame: number ) : void
	{
		const { shader } = this;

		if ( !shader )
		{
			throw new Error ( `Pipeline ${this.type} ${this.id} has invalid shader when configuring render pass` );
		}

		// Configure the render pass.
		shader.configureRenderPass ( pass, frame );
	}
}
