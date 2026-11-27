///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Depth attribute class.
//
//	It says whether drawing writes to the depth buffer. The depth test is
//	always done, so a shape is still hidden behind what is in front of it.
//	Without depth writes, a shape does not hide what is drawn after it, which
//	is what semi-transparent shapes need. This is part of the GPU pipeline,
//	so states with different settings use different pipelines.
//
//	To draw a semi-transparent shape, give its state a color with an alpha
//	below one, this attribute with depth writes off, and put the state in
//	TRANSPARENT_BIN, so that it is drawn after the opaque shapes in its layer.
//	For a closed shape, buildTransparentScene() draws its back faces and then
//	its front faces.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";
import type { IPipelineOptions } from "../../../Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IDepthInput
{
	write?: boolean;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Depth attribute class. Without it, depth is written.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Depth extends BaseClass
{
	#write = true;

	/**
	 * Construct the class.
	 * @class
	 * @param {IDepthInput} [input] - The input object.
	 * @param {boolean} [input.write] - Whether to write to the depth buffer.
	 * The default is true.
	 */
	public constructor ( input?: Readonly<IDepthInput> )
	{
		super();

		const write = input?.write;
		if ( write !== undefined )
		{
			this.#write = write;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.Depth";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return Depth.getClassName();
	}

	/**
	 * Get whether depth is written.
	 * @returns {boolean} True if depth is written.
	 */
	public get write() : boolean
	{
		return this.#write;
	}

	/**
	 * Set whether depth is written.
	 * @param {boolean} write - True to write depth.
	 */
	public set write ( write: boolean )
	{
		this.#write = write;
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		return `${this.type} ${this.write ? "write" : "no-write"}`;
	}

	/**
	 * Apply the state attributes to the shader. Depth writing is part of the
	 * pipeline instead, so this does nothing.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		void input;
	}

	/**
	 * Set depth writing in the pipeline options.
	 * @param {IPipelineOptions} options - The pipeline options to change.
	 */
	public override configurePipeline ( options: IPipelineOptions ) : void
	{
		options.depthWrite = this.write;
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
			write: this.write
		};
	}
}
