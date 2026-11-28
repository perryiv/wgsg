///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders with Phong shading and draws the triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

import { WithEdges as BaseClass } from "./WithEdges";
import { State } from "../Scene";
import { makeSingleton } from "../Tools/Singleton";
import common from "./Edges.wgsl?raw";
import lighting from "./Lighting.wgsl?raw";
import code from "./PhongEdges.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IPhongEdgesShaderInput
{
	topology?: GPUPrimitiveTopology;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class PhongEdges extends BaseClass
{
	static readonly #singleton = makeSingleton ( () => new PhongEdges() );

	/**
	 * Construct the class.
	 * @class
	 * @param {IPhongEdgesShaderInput} [input] - The input.
	 */
	protected constructor ( input?: Readonly<IPhongEdgesShaderInput> )
	{
		const topology = input?.topology;

		super ( {
			code: ( lighting + common + code ),
			topology: ( topology ?? "triangle-list" )
		} );
	}

	/**
	 * Get the singleton instance.
	 * @returns {PhongEdges} The singleton instance.
	 */
	public static get instance () : PhongEdges
	{
		return PhongEdges.#singleton.get();
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		PhongEdges.#singleton.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.PhongEdges";
	}

	// Does the shader read the normal vectors? Phong shading reads the normal vectors.
	protected readonly usesNormals = true;

	/**
	 * Make and return a state object that uses this shader.
	 * @param {object} input - The input object.
	 * @param {GPUPrimitiveTopology} input.topology - The primitive topology.
	 * @returns {State} The state object.
	 */
	public static makeState = ( { topology } : { topology: GPUPrimitiveTopology } ) : State =>
	{
		// Shortcut.
		const shader = PhongEdges.instance;

		// Return the new state.
		return new State ( { shader, topology } );
	}
}
