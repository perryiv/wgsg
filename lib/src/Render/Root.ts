///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Root of the render graph.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Layer } from "./Layer";
import type { IMatrix44, IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	The hierarchy of items in the render graph.
//
///////////////////////////////////////////////////////////////////////////////

/*
- Root contains map of number to Layer, and the model-view matrices of the shapes
	- Layer contains map of number to RenderBin
		- RenderBin contains map of string (shader and pipeline options) to Pipeline
			- Pipeline contains Shader (and our shaders are singletons), GPUPipeline, and map of projection matrix (as string) to ProjMatrixGroup
				- ProjMatrixGroup contains projection matrix and map of state name to StateGroup
					- StateGroup contains state, and array of shapes with the index of each one's matrix in the root.
*/


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the root of the render graph.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Root extends BaseClass
{
	#layers = new Map < number, Layer > ();
	#matrices = new Float32Array ( 16 * 16 );
	#numMatrices = 0;

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
		return "Render.Root";
	}
	
	/**
	 * Get the layer. Make it if we have to.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {number} index - The layer index.
	 * @returns {Layer} The layer.
	 */
	public getLayer ( info: IRenderGraphInfo, index: Readonly<number> ) : Layer
	{
		let layer: ( Layer | undefined ) = this.#layers.get ( index );
		if ( !layer )
		{
			layer = new Layer ();
			this.#layers.set ( index, layer );
			info.numLayers++;
		}
		return layer;
	}

	/**
	 * Call the given function for each layer in numerical order.
	 * @param {Function} func - The function to call.
	 */
	public forEachLayer ( func: ( layer: Layer, index: number ) => void ) : void
	{
		const layers = Array.from ( this.#layers.entries() );
		layers.sort ( ( a, b ) =>
		{
			return ( a[0] - b[0] );
		} );
		layers.forEach ( ( [ index, layer ] ) =>
		{
			func ( layer, index )
		} );
	}

	/**
	 * Add a model-view matrix. Shapes under the same transform share one.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {IMatrix44} matrix - The matrix.
	 * @returns {number} The index of the matrix.
	 */
	public addMatrix ( info: IRenderGraphInfo, matrix: Readonly<IMatrix44> ) : number
	{
		const index = this.#numMatrices;
		const needed = ( ( index + 1 ) * 16 );
		if ( needed > this.#matrices.length )
		{
			const bigger = new Float32Array ( needed * 2 );
			bigger.set ( this.#matrices );
			this.#matrices = bigger;
		}
		this.#matrices.set ( matrix, ( index * 16 ) );
		this.#numMatrices = ( index + 1 );
		info.numMatrices++;
		return index;
	}

	/**
	 * Get a model-view matrix.
	 * @param {number} index - The index that addMatrix() returned.
	 * @returns {Float32Array} The matrix, a view into the root's array.
	 */
	public getMatrix ( index: number ) : Float32Array
	{
		if ( !Number.isInteger ( index ) || ( index < 0 ) || ( index >= this.#numMatrices ) )
		{
			throw new Error ( `Invalid matrix index ${index}, there are ${this.#numMatrices} matrices` );
		}
		const start = ( index * 16 );
		return this.#matrices.subarray ( start, ( start + 16 ) );
	}

	/**
	 * Get the number of model-view matrices.
	 * @returns {number} The number of matrices.
	 */
	public get numMatrices () : number
	{
		return this.#numMatrices;
	}

	/**
	 * Get the number of layers.
	 * @returns {number} The number of layers.
	 */
	public get numLayers () : number
	{
		return this.#layers.size;
	}

	/** 
	 * Clear the layers.
	 * @returns {void}
	 */
	public clear () : void
	{
		this.#layers.clear ();
		this.#numMatrices = 0;
	}
}
