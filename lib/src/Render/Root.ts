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
import type { IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	The hierarchy of items in the render graph.
//
///////////////////////////////////////////////////////////////////////////////

/*
- Root contains map of number to Layer
	- Layer contains map of number to RenderBin
		- RenderBin contains map of string (state name) to Pipeline
			- Pipeline contains Shader, GPUPipeline, and map of projection matrix (as string) to ProjMatrix
				- ProjMatrix contains projection matrix and map of model matrix (as string) to ModelMatrix
					- ModelMatrix contains model matrix and array of shapes
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
	}
}
