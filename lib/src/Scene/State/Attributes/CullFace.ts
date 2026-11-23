///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Face culling attribute class.
//
//	The front of a triangle is the side from which its vertices go around
//	counterclockwise. Culling the back faces skips the triangles that face
//	away from the camera, so the inside of a closed surface is not drawn.
//	This is part of the GPU pipeline, so states with different culling use
//	different pipelines.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";
import type { IPipelineOptions } from "../../../Shaders";


///////////////////////////////////////////////////////////////////////////////
/**
 * Face culling attribute class. Without it, no faces are culled.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class CullFace extends BaseClass
{
	#mode: GPUCullMode = "back";

	/**
	 * Construct the class.
	 * @class
	 * @param {GPUCullMode} [mode] - Which faces to cull: "back" (the default),
	 * "front", or "none".
	 */
	public constructor ( mode?: GPUCullMode )
	{
		super();

		if ( mode !== undefined )
		{
			this.#mode = mode;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.CullFace";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return CullFace.getClassName();
	}

	/**
	 * Get which faces are culled.
	 * @returns {GPUCullMode} The mode.
	 */
	public get mode() : GPUCullMode
	{
		return this.#mode;
	}

	/**
	 * Set which faces are culled.
	 * @param {GPUCullMode} mode - The new mode.
	 */
	public set mode ( mode: GPUCullMode )
	{
		this.#mode = mode;
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		return `${this.type} ${this.mode}`;
	}

	/**
	 * Apply the state attributes to the shader. Culling is part of the
	 * pipeline instead, so this does nothing.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		void input;
	}

	/**
	 * Set the cull mode in the pipeline options.
	 * @param {IPipelineOptions} options - The pipeline options to change.
	 */
	public override configurePipeline ( options: IPipelineOptions ) : void
	{
		options.cullMode = this.mode;
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		// Get the base class's JSON.
		const base = super.toJSON();

		// Return the object that represents this class.
		return {
			...base,
			mode: this.mode
		};
	}
}
