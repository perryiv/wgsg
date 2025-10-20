///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base projection class.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base/Base";
import { IMatrix44, IViewport } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base projection class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Projection extends Base
{
	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Return the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public abstract get matrix() : IMatrix44;

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public abstract set viewport ( vp: Readonly<IViewport> );
}
