///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Color attribute class.
//
//	A shortcut for the Material attribute's diffuse color, which is linear,
//	like the material's colors. The other colors
//	are the defaults. If a state has both, the material is used, and in
//	developer builds the state warns about it.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";
import { Material } from "./Material";
import { Color as ColorTool } from "../../../Math/Color";
import { IVector4 } from "../../../Types";
import { vec4 } from "gl-matrix";


///////////////////////////////////////////////////////////////////////////////
/**
 * Color attribute class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Color extends BaseClass
{
	#color: IVector4 = [ ...ColorTool.gray ];

	/**
	 * Construct the class.
	 * @class
	 * @param {Readonly<IVector4>} [color] The color to use.
	 */
	public constructor ( color: Readonly<IVector4> )
	{
		super();

		if ( color )
		{
			vec4.copy ( this.#color, color );
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.Color";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return Color.getClassName();
	}

	/**
	 * Get the color.
	 * @returns {IVector4} The color.
	 */
	public get color() : Readonly<IVector4>
	{
		return this.#color;
	}

	/**
	 * Set the color.
	 * @param {Readonly<IVector4>} color - The new color.
	 */
	public set color ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#color, color );
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		const color = this.color.join ( ", " );
		return `${this.type} [${color}]`;
	}

	/**
	 * Apply the state attributes to the shader.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		// A material in the same state is used instead.
		const { shader, state } = input;
		if ( state.getAttribute ( Material.getClassName() ) )
		{
			return;
		}

		// Set the diffuse color, if the shader has one.
		if ( "diffuse" in shader )
		{
			shader.diffuse = this.color;
		}
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
			color: this.color
		};
	}
}
