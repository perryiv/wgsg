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
	ICoordinateSystem,
	IEvent,
	IMatrix44,
	INavigationState,
	INavStepFunction,
	IRotationMode,
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
	 * @returns {IMatrix44} The view matrix.
	 */
	public abstract get viewMatrix () : Readonly<IMatrix44>;

	/**
	 * Get the inverse view matrix.
	 * @returns {IMatrix44 | null} The inverse view matrix.
	 */
	public abstract get invViewMatrix () : ( Readonly<IMatrix44> | null );

	/**
	 * Get the rotation part of the view matrix.
	 * @returns {IMatrix44} The rotation part of the view matrix.
	 */
	public abstract get rotationMatrix () : Readonly<IMatrix44>;

	/**
	 * Get the rotation mode.
	 * @returns {IRotationMode | null} The rotation mode.
	 */
	public abstract get rotationMode () : ( IRotationMode | null );

	/**
	 * Get the local up vector.
	 * @returns {IVector3} The local up vector.
	 */
	public abstract getLocalUp () : Readonly<IVector3>;

	/**
	 * Rotate the navigator.
	 * @param {IVector4} quaternion - The rotation quaternion.
	 */
	public abstract rotateQuaternion ( quaternion: IVector4 ) : void;

	/**
	 * Rotate the navigator.
	 * @param {IVector3} axis - The rotation axis.
	 * @param {number} radians - The angle in radians.
	 * @param {ICoordinateSystem} space - The rotation space.
	 */
	public abstract rotateAxisAngle ( axis: IVector3, radians: number, space: ICoordinateSystem ) : void;

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
	 * @returns {INavStepFunction | null} The navigation step function or null.
	 */
	public abstract mouseRotate ( input: { event: IEvent, scale: number } ) : ( INavStepFunction | null );

	/**
	 * Translate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IEvent} input.event - The event.
	 * @param {number} input.scale - The translation scale factor.
	 * @returns {INavStepFunction | null} The navigation step function or null.
	 */
	public abstract mouseTranslate ( input: { event: IEvent, scale: number } ) : ( INavStepFunction | null );

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
	 * Reset the navigator's rotation.
	 */
	public abstract resetRotation() : void;

	/**
	 * Get the internal state.
	 * @returns {INavigationState} The internal state.
	 */
	public abstract getInternalState() : INavigationState;

	/**
	 * Set the internal state.
	 * @param {INavigationState} state - The internal state.
	 */
	public abstract setInternalState ( state: Readonly<INavigationState> ) : void;

	/**
	 * Blend the given navigation states.
	 * @param {INavigationState} from - The starting state.
	 * @param {INavigationState} to - The ending state.
	 * @param {number} fraction - The fraction between the two states.
	 */
	public abstract blend ( from: Readonly<INavigationState>, to: Readonly<INavigationState>, fraction: number ) : INavigationState;

	/**
	 * Set the navigator so that the sphere is completely within the view-volume.
	 * @param {object} input - The input parameters.
	 * @param {Sphere} input.sphere - The sphere to view.
	 * @param {Projection} input.projection - The projection to use.
	 * @param {boolean} [input.resetRotation] - Whether to or not reset the rotation.
	 */
	public abstract viewSphere ( input: { sphere: Readonly<Sphere>, projection: Readonly<Projection>, resetRotation?: boolean } ) : void;
}
