///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Represents a render bin. Each bin renders its children in order.
//	This can be used, for example, for correct transparency by putting those
//	objects in a bin with a large key, which will make them render last.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Pipeline } from "./Pipeline";
import { State } from "../Scene";
import { IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IPipelineMap = Map < string, Pipeline >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a bin (ordered container) in the render graph.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Bin extends BaseClass
{
	#pipelines: IPipelineMap = new Map < string, Pipeline > ();

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
		return "Render.Bin";
	}

	/**
	 * Get the pipeline. Make it if we have to.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {State} state - The state.
	 * @returns {Pipeline} The pipeline.
	 */
	public getPipeline ( info: IRenderGraphInfo, state: State ) : Pipeline
	{
		const { shader, topology } = state;

		if ( !shader )
		{
			throw new Error ( `State '${state.name}' has invalid shader when getting pipeline` );
		}

		const name = `${shader.name}, ${topology}`;
		let pipeline: ( Pipeline | undefined ) = this.#pipelines.get ( name );

		if ( !pipeline )
		{
			pipeline = new Pipeline ( { shader, topology } );
			this.#pipelines.set ( name, pipeline );
			info.numPipelines++;
		}

		return pipeline;
	}

	/**
	 * Call the given function for each pipeline.
	 * @param {Function} func - The function to call.
	 */
	public forEachPipeline ( func: ( pipeline: Pipeline ) => void ) : void
	{
		// The order doesn't matter so we don't sort like the layers and bins.
		this.#pipelines.forEach ( func );
	}

	/**
	 * Get the number of pipelines.
	 * @returns {number} The number of pipelines.
	 */
	public get numPipelines () : number
	{
		return this.#pipelines.size;
	}
}
