///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all state attributes.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../../Base";
import { ShaderBase, type IPipelineOptions } from "../../Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below and elsewhere.
//
///////////////////////////////////////////////////////////////////////////////

export interface IAttributeApplyInput
{
	shader: ShaderBase;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all state attributes.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Attribute extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static getClassName() : string
	{
		return "Scene.State.Attribute";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return Attribute.getClassName();
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public abstract override toString() : string;

	/**
	 * Apply the state attributes to the shader.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public abstract apply ( input: IAttributeApplyInput ) : void;

	/**
	 * Change the options that the GPU pipeline is made with, for attributes
	 * that are part of the pipeline, like face culling. Most attributes are
	 * not, so this does nothing. Overload if needed.
	 * @param {IPipelineOptions} options - The pipeline options to change.
	 */
	public configurePipeline ( options: IPipelineOptions ) : void
	{
		void options;
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
		};
	}
}
