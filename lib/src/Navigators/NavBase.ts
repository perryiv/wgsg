///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base navigator class.
//
///////////////////////////////////////////////////////////////////////////////

import { BaseHandler as BaseClass } from "../Events/Handlers/BaseHandler";
import { Projection } from "../Projections/Projection";
import { Sphere } from "../Math";
import type { IMatrix44, IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base navigator class.
 * @abstract
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class NavBase extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor ()
	{
		super();
	}

	/**
	 * Get the view matrix.
	 * @returns The view matrix.
	 */
	public abstract get viewMatrix () : IMatrix44;

	/**
	 * Rotate the navigator.
	 * @param {IVector4} r - The rotation quaternion.
	 */
	public abstract rotate ( r: IVector4 ) : void;

	/**
	 * Zoom the navigator.
	 * @param {number} scale - The zoom scale factor.
	 */
	public abstract zoom ( scale: number ) : void;

	/**
	 * Reset the navigator to its default state.
	 */
	public abstract reset() : void;

	/**
	 * Set the navigator so that the sphere is completely within the view-volume.
	 * If the given model is null then reset the navigator to its default state.
	 * @param {Sphere} sphere - The bounding sphere.
	 * @param {Projection} projection - The projection.
	 * @param {object} [options] - The options.
	 * @param {boolean} [options.resetRotation] - Whether or not to reset the rotation.
	 */
	public abstract viewSphere ( sphere: Sphere, projection: Projection, options?: { resetRotation?: boolean } ) : void;
}
