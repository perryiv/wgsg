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
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ILayers = Map < number, Layer >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Root extends BaseClass
{
	#layers: ILayers = new Map < number, Layer > ();

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
	 * Get the layers.
	 * @returns {ILayers} The layers map.
	 */
	public get layers() : ILayers
	{
		return this.#layers;
	}

	/**
	 * Set the layers.
	 * @param {ILayers} layers - The new layers map.
	 */
	public set layers ( layers: ILayers )
	{
		this.#layers = layers;
	}
}
