///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Represents a render bin. The bins of a layer are drawn in the order of
//	their numbers, so semi-transparent shapes can be drawn after the opaque
//	ones by putting them in a bin with a larger number.
//
//	A bin orders its own shapes by its sort mode, which the first state that
//	puts a shape in it decides (see State.binSort):
//	- null: not sorted by depth. The shapes are kept in their pipelines and
//	  state groups, so that the GPU switches as little as possible.
//	- "back-to-front" and "front-to-back": the shapes are also kept in a
//	  list with their depths, which is sorted before they're drawn. Shapes
//	  at the same depth stay in the order they were added, so the back faces
//	  of a shape added before its front faces are drawn first.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Pipeline } from "./Pipeline";
import { ProjMatrixGroup } from "./ProjMatrixGroup";
import { StateGroup } from "./StateGroup";
import type { IBinSort, Shape, State } from "../Scene";
import { makePipelineKey } from "../Shaders";
import { IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IPipelineMap = Map < string, Pipeline >;

// A shape in a sorted bin, with what it's drawn with.
export interface ISortedShape
{
	pipeline: Pipeline;
	pmg: ProjMatrixGroup;
	sg: StateGroup;
	shape: Shape;
	matrix: number;
	depth: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a bin (ordered container) in the render graph.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Bin extends BaseClass
{
	#pipelines: IPipelineMap = new Map < string, Pipeline > ();
	#sort: ( IBinSort | null );
	#sorted: ISortedShape[] = [];

	/**
	 * Construct the class.
	 * @class
	 * @param {IBinSort | null} [sort] - How the shapes are sorted by depth.
	 * The default is null, which is not at all.
	 */
	constructor ( sort: ( IBinSort | null ) = null )
	{
		super();
		this.#sort = sort;
	}

	/**
	 * Get how the shapes are sorted by depth.
	 * @returns {IBinSort | null} How they're sorted, or null if not at all.
	 */
	public get sort () : ( IBinSort | null )
	{
		return this.#sort;
	}

	/**
	 * See if the shapes are sorted by depth.
	 * @returns {boolean} True if they are.
	 */
	public get sorted () : boolean
	{
		return ( null !== this.#sort );
	}

	/**
	 * Add the shape. A bin sorted by depth keeps it in its list, and the
	 * others in its state group.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {ISortedShape} input - The shape, what it's drawn with, and
	 * its depth, which is only used when sorting.
	 */
	public addShape ( info: IRenderGraphInfo, input: Readonly<ISortedShape> ) : void
	{
		if ( this.sorted )
		{
			this.#sorted.push ( { ...input } );
			info.numShapes++;
		}
		else
		{
			input.sg.addShape ( info, input.shape, input.matrix );
		}
	}

	/**
	 * Sort the shapes by depth and call the given function for each one.
	 * Only bins sorted by depth have them.
	 * @param {Function} func - The function to call.
	 */
	public forEachSortedShape ( func: ( item: Readonly<ISortedShape> ) => void ) : void
	{
		// The sort keeps shapes at the same depth in the order they were added.
		const sign = ( ( "back-to-front" === this.#sort ) ? -1 : 1 );
		this.#sorted.sort ( ( a, b ) => ( ( a.depth === b.depth ) ? 0 : ( ( a.depth < b.depth ) ? -sign : sign ) ) );
		this.#sorted.forEach ( func );
	}

	/**
	 * Get the number of shapes in the sorted list.
	 * @returns {number} The number of shapes.
	 */
	public get numSortedShapes () : number
	{
		return this.#sorted.length;
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
	 * @param {boolean} [vertexColors] - Whether the shapes have vertex
	 * colors. The default is false.
	 * @param {boolean} [texCoords] - Whether the shapes have texture
	 * coordinates. The default is false.
	 * @returns {Pipeline} The pipeline.
	 */
	public getPipeline ( info: IRenderGraphInfo, state: State, vertexColors = false, texCoords = false ) : Pipeline
	{
		const { shader } = state;

		if ( !shader )
		{
			throw new Error ( `State '${state.name}' has invalid shader when getting pipeline` );
		}

		const options = state.pipelineOptions;
		if ( vertexColors )
		{
			options.vertexColors = true;
		}
		if ( texCoords )
		{
			options.texCoords = true;
		}
		const name = `${shader.type}, ${makePipelineKey ( options )}`;
		let pipeline: ( Pipeline | undefined ) = this.#pipelines.get ( name );

		if ( !pipeline )
		{
			pipeline = new Pipeline ( { shader, options } );
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
