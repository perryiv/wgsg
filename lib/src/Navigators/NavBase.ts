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
import type {
	IEvent,
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
} from "../Types";


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
	public abstract get viewMatrix () : Readonly<IMatrix44>;

	/**
	 * Get the inverse view matrix.
	 * @returns The inverse view matrix.
	 */
	public abstract get invViewMatrix () : ( Readonly<IMatrix44> | null );

	/**
	 * Rotate the navigator.
	 * @param {IVector4} quaternion - The rotation quaternion.
	 */
	public abstract rotateQuaternion ( quaternion: IVector4 ) : void;

	/**
	 * Rotate the navigator.
	 * @param {IVector3} axis - The rotation axis.
	 * @param {number} radians - The angle in radians.
	 */
	public abstract rotateAxisAngle ( axis: IVector3, radians: number ) : void;

	/**
	 * Translate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IEvent} input.event - The event.
	 * @param {IVector2} input.current - The current screen position.
	 * @param {IVector2} input.previous - The previous screen position.
	 * @param {number} input.scale - The translation scale factor.
	 */
	public abstract translateScreenXY ( input: { current: IVector2, previous: IVector2, scale: number } ) : void;

	/**
	 * Rotate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IEvent} input.event - The event.
	 * @param {number} input.scale - The rotation scale factor.
	 */
	public abstract mouseRotate ( input: { event: IEvent, scale: number } ) : void;

	/**
	 * Translate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IEvent} input.event - The event.
	 * @param {number} input.scale - The translation scale factor.
	 */
	public abstract mouseTranslate ( input: { event: IEvent, scale: number } ) : void;

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
	 * @param {object} input - The input parameters.
	 * @param {Sphere} input.sphere - The sphere to view.
	 * @param {Projection} input.projection - The projection to use.
	 * @param {boolean} [input.resetRotation] - Whether to or not reset the rotation.
	 */
	public abstract viewSphere ( input: { sphere: Sphere, projection: Projection, resetRotation?: boolean } ) : void;
}
