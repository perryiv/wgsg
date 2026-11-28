///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with flat shading and draws the triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

import { WithEdges as BaseClass } from "./WithEdges";
import { State } from "../Scene";
import { makeSingleton } from "../Tools/Singleton";
import common from "./Edges.wgsl?raw";
import lighting from "./Lighting.wgsl?raw";
import code from "./FlatEdges.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IFlatEdgesShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class FlatEdges extends BaseClass
{
	static readonly #singleton = makeSingleton ( () => new FlatEdges() );

	/**
	 * Construct the class.
	 * @class
	 * @param {IFlatEdgesShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IFlatEdgesShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code: ( lighting + common + code ),
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {FlatEdges} The singleton instance.
	 */
	public static get instance () : FlatEdges
	{
		return FlatEdges.#singleton.get();
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		FlatEdges.#singleton.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.FlatEdges";
	}

	// Does the shader read the normal vectors? Flat shading calculates the normals, so it does not read them.
	protected readonly usesNormals = false;

	/**
	 * Make and return a state object that uses this shader.
	 * @param {object} input - The input object.
	 * @param {GPUPrimitiveTopology} input.topology - The primitive topology.
	 * @returns {State} The state object.
	 */
	public static makeState = ( { topology } : { topology: GPUPrimitiveTopology } ) : State =>
	{
		// Shortcut.
		const shader = FlatEdges.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}
}
