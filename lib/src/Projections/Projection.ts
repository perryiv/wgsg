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

import { Base as BaseClass } from "../Base/Base";
import { DEFAULT_FAR_DISTANCE, DEFAULT_NEAR_DISTANCE } from "../Tools";
import { Sphere } from "../Math";
import type { IMatrix44, IViewport } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used in projections.
//
///////////////////////////////////////////////////////////////////////////////

export interface IProjectionNearFar
{
	near: number;
	far: number;
}

export type IUpdateNearFarCallback = ( values: IProjectionNearFar ) => IProjectionNearFar;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base projection class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Projection extends BaseClass
{
	#near = DEFAULT_NEAR_DISTANCE;
	#far = DEFAULT_FAR_DISTANCE;
	#onUpdateNearFar: ( IUpdateNearFarCallback | null ) = null;

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
	public get near() : number
	{
		return this.#near;
	}

	/**
	 * Set the near distance.
	 * @param {number} near - The near distance.
	 */
	public set near ( near: number )
	{
		this.#near = near;
	}

	/**
	 * Get the far distance.
	 * @returns {number} The far distance.
	 */
	public get far() : number
	{
		return this.#far;
	}

	/**
	 * Set the far distance.
	 * @param {number} far - The far distance.
	 */
	public set far ( far: number )
	{
		this.#far = far;
	}

	/**
	 * Get the callback that is called when the near and far distances are updated.
	 * @returns {IUpdateNearFarCallback | null} The callback that is called when the near and far distances are updated.
	 */
	public get onUpdateNearFar() : ( IUpdateNearFarCallback | null )
	{
		return this.#onUpdateNearFar;
	}

	/**
	 * Set the callback that is called when the near and far distances are updated.
	 * @param {IUpdateNearFarCallback | null} callback - The callback that is called when the near and far distances are updated.
	 */
	public set onUpdateNearFar ( callback: ( IUpdateNearFarCallback | null ) )
	{
		this.#onUpdateNearFar = callback;
	}

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public abstract set viewport ( vp: Readonly<IViewport> );
}
