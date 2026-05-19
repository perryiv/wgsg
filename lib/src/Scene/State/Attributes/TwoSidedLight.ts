///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Two-sided light attribute class.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";


///////////////////////////////////////////////////////////////////////////////
/**
 * Two-sided light attribute class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class TwoSidedLight extends BaseClass
{
	#value = false;

	/**
	 * Construct the class.
	 * @class
	 * @param {boolean} [value] The initial value.
	 */
	public constructor ( value?: boolean )
	{
		super();

		if ( value !== undefined )
		{
			this.#value = value;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.TwoSidedLight";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return TwoSidedLight.getClassName();
	}

	/**
	 * Get the value.
	 * @returns {boolean} The value.
	 */
	public get value() : boolean
	{
		return this.#value;
	}

	/**
	 * Set the value.
	 * @param {boolean} value - The new value.
	 */
	public set value ( value: boolean )
	{
		this.#value = value;
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		return `${this.type} ${this.value}`;
	}

	/**
	 * Apply the state attributes to the shader.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		const { shader } = input;
		if ( "twoSidedLight" in shader )
		{
			shader.twoSidedLight = this.value;
		}
	}
}
