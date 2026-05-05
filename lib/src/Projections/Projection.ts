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
import { Sphere } from "../Math";
import type { IMatrix44, IViewport } from "../Types";


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
	public abstract get matrix() : Readonly<IMatrix44>;

	/**
	 * Update the projection's near and far distances.
	 * @param {Sphere} sphere - The bounding sphere to use when updating the distances.
	 */
	public abstract updateNearFar ( sphere: Readonly<Sphere> ) : void;

	/**
	 * Get the near distance.
	 * @returns {number} The near distance.
	 */
	public abstract get near() : number;

	/**
	 * Get the far distance.
	 * @returns {number} The far distance.
	 */
	public abstract get far() : number;

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public abstract set viewport ( vp: Readonly<IViewport> );
}
