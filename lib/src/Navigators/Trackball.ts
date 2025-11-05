///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Viewer event handler that prints the events.
//
///////////////////////////////////////////////////////////////////////////////

import { isFiniteNumber } from "../Math";
import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
import { NavBase as BaseClass } from "./NavBase";
import { Node } from "../Scene";
import {
	IDENTITY_MATRIX,
	normalizeQuat,
	normalizeVec3,
	makeLine as makeLineUnderScreenPoint,
	discardEvent,
} from "../Tools";
import type {
	IMatrix44,
	IMouseEvent,
	IVector2,
	IVector3,
	IVector4,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface ITrackballState
{
	center: IVector3;
	distance: number;
	rotation: IVector4;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the default trackball state.
 * @returns {ITrackballState} The default trackball state.
 */
///////////////////////////////////////////////////////////////////////////////

function makeDefaultTrackballState() : ITrackballState
{
	return {
		center: [ 0, 0, 0 ],
		distance: 2,
		rotation: [ 0, 0, 0, 1 ]
	};
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Viewer event handler that prints the events.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Trackball extends BaseClass
{
	#dirty = true;
	#matrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#state: ITrackballState = makeDefaultTrackballState();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public getClassName () : string
	{
		return "Navigators.Trackball";
	}

	/**
	 * Calculate and return the matrix.
	 * @returns {IMatrix44} The model matrix.
	 */
	protected calculateMatrix () : IMatrix44
	{
		// Shortcuts.
		const c = this.#state.center;
		const d = this.#state.distance;
		const r = this.#state.rotation;

		// The matrix that makes the center point the actual center of rotation.
		const tm: IMatrix44 = [ ...IDENTITY_MATRIX ];
		mat4.translate ( tm, IDENTITY_MATRIX, [ -c[0], -c[1], -c[2] ] );

		// Make the rotation matrix.
		const rm: IMatrix44 = [ ...IDENTITY_MATRIX ];
		mat4.fromQuat ( rm, r );

		// The matrix that pushes the model away from the camera.
		const dm: IMatrix44 = [ ...IDENTITY_MATRIX ];
		mat4.translate ( dm, IDENTITY_MATRIX, [ 0, 0, -d ] );

		// Multiply everything together in the correct order.
		const answer: IMatrix44 = [ ...IDENTITY_MATRIX ];
		mat4.multiply ( answer, answer, dm );
		mat4.multiply ( answer, answer, rm );
		mat4.multiply ( answer, answer, tm );

		// Return the answer.
		return answer;
	}

	/**
	 * Get the model matrix.
	 * @returns {IMatrix44} The model matrix.
	 */
	public get matrix () : IMatrix44
	{
		if ( true == this.#dirty )
		{
			mat4.copy ( this.#matrix, this.calculateMatrix() );
			this.#dirty = false;
		}

		return this.#matrix;
	}

	/**
	 * Get the center point.
	 * @returns {IVector3} The center point.
	 */
	public get center () : IVector3
	{
		return this.#state.center;
	}

	/**
	 * Set the center point.
	 * @param {IVector3} c - The center point.
	 */
	public set center ( c: IVector3 )
	{
		vec3.copy ( this.#state.center, c );
		this.#dirty = true;
	}

	/**
	 * Get the distance.
	 * @returns {number} The distance.
	 */
	public get distance () : number
	{
		return this.#state.distance;
	}

	/**
	 * Set the distance.
	 * @param {number} d - The distance.
	 */
	public set distance ( d: number )
	{
		this.#state.distance = d;
		this.#dirty = true;
	}

	/**
	 * Get the rotation.
	 * @returns {IVector4} The rotation.
	 */
	public get rotation () : IVector4
	{
		return this.#state.rotation;
	}

	/**
	 * Set the rotation.
	 * @param {IVector4} r - The rotation.
	 */
	public set rotation ( r: IVector4 )
	{
		vec4.copy ( this.#state.rotation, r );
		this.#dirty = true;
	}

	/**
	 * Rotate the trackball.
	 * @param {IVector3 | IVector4} input - The rotation axis or quaternion.
	 * @param {number} [radians] - The angle in radians required if input is a rotation axis.
	 */
	public rotate ( input: ( IVector3 | IVector4 ), radians?: number ) : void
	{
		switch ( input.length )
		{
			case 3:
			{
				if ( false === isFiniteNumber ( radians ) )
				{
					throw new Error ( "An angle in radians is required when rotating about an axis" );
				}

				radians = radians!;
				input = normalizeVec3 ( input );

				let dr: IVector4 = [ 0, 0, 0, 1 ]; // Delta rotation.
				quat.setAxisAngle ( dr, input, radians );
				dr = normalizeQuat ( dr );

				let nr: IVector4 = [ 0, 0, 0, 1 ]; // New rotation.
				quat.multiply ( nr, this.rotation, dr );
				nr = normalizeQuat ( nr );

				this.rotation = nr;
				break;
			}
			case 4:
			{
				input = normalizeQuat ( input );

				let answer: IVector4 = [ 0, 0, 0, 1 ];
				quat.multiply ( answer, this.rotation, input );
				answer = normalizeQuat ( answer );

				this.rotation = answer;
				break;
			}
			default:
			{
				throw new Error ( "Input must be a rotation axis (IVector3) or a quaternion (IVector4)" );
			}
		}
	}

	/**
	 * Reset the navigator to its default state.
	 */
	public override reset() : void
	{
		this.#state = makeDefaultTrackballState();
		this.#dirty = true;
	}

	/**
	 * Set the navigator so that the model is completely within the view-volume.
	 * If the given model is null then reset the navigator to its default state.
	 * @param {Node | null} model - The model node.
	 */
	public override viewAll ( model: Node | null ) : void
	{
		void model;   // Do nothing with the function argument.
		this.reset(); // For now just reset to the default state.
	}

	/**
	 * Handle mouse down event.
	 * @param {IMouseEvent} event - The mouse down event.
	 */
	public override mouseDown ( event: IMouseEvent ) : void
	{
		console.log ( "Mouse down:", event );
		discardEvent ( event );
	}

	/**
	 * Handle mouse move event.
	 * @param {IMouseEvent} event - The mouse move event.
	 */
	public override mouseMove ( event: IMouseEvent ) : void
	{
		// console.log ( "Mouse move:", event );
		discardEvent ( event );
	}

	/**
	 * Handle mouse drag event.
	 * @param {IMouseEvent} event - The mouse drag event.
	 */
	public override mouseDrag ( event: IMouseEvent ) : void
	{
		const {
			current: cm,
			previous: pm,
			projMatrix,
			viewport,
			event: originalEvent,
			requestRender
		} = event;

		if ( !cm || !pm || !event )
		{
			return;
		}

		if ( 1 !== originalEvent.buttons ) // Left mouse button only.
		{
			return;
		}

		const viewMatrix: IMatrix44 = [ ...this.matrix ];

		// Get the line under the current mouse position.
		const cl = makeLineUnderScreenPoint ( {
			screenPoint: [ cm[0], cm[1] ],
			viewMatrix, projMatrix, viewport,
		} );

		// Get the line under the current mouse position.
		const pl = makeLineUnderScreenPoint ( {
			screenPoint: [ pm[0], pm[1] ],
			viewMatrix, projMatrix, viewport,
		} );

		// Make the trackball sphere in world space.
		const sphereCenter: IVector3 = [ 0, 0, 0 ];
		const sphereRadius: number = this.distance * 0.5;

		// For now ...
		void cl;
		void pl;
		void sphereCenter;
		void sphereRadius;

		// Intersect the line with the trackball sphere.

		const dir: IVector2 = [ 0, 0 ];
		vec2.rotate ( dir, cm, pm, ( Math.PI * 0.5 ) );
		vec2.normalize ( dir, dir );
		this.rotate ( [ dir[0], dir[1], 0.0 ], 0.01 );
		requestRender();
	}

	/**
	 * Handle mouse up event.
	 * @param {IMouseEvent} event - The mouse up event.
	 */
	public override mouseUp ( event: IMouseEvent ) : void
	{
		console.log ( "Mouse up:", event );
	}
}
