
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
	 * @constructor
	 */
	constructor()
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	{
	}

	/**
	 * Return the id.
	 * @param {number} id - The id.
	 */
	public get id()
	{
		return this.#id;
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public abstract getClassName() : string;

	/**
	 * Return the type.
	 * @param {string} type - The type.
	 */
	public get type()
	{
		return this.getClassName();
	}
}
