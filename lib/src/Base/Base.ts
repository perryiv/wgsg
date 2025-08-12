///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for most other classes.
//
///////////////////////////////////////////////////////////////////////////////

import { getNextId } from "../Tools/Functions";


///////////////////////////////////////////////////////////////////////////////
/**
 * Object class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Base
{
	#id: number = getNextId();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	{
	}

	/**
	 * Return the id.
	 * @returns {number} The id.
	 */
	public get id()
	{
		return this.#id;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public abstract getClassName() : string;

	/**
	 * Return the type.
	 * @returns {string} The type.
	 */
	public get type()
	{
		return this.getClassName();
	}
}
