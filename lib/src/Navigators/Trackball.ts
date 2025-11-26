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

import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
import { NavBase as BaseClass } from "./NavBase";
import {
	Perspective,
	ProjectionBase as Projection,
} from "../Projections";
import {
	intersectLineSphere,
	isFiniteNumber,
	Sphere,
} from "../Math";
import {
	DEG_TO_RAD,
	IDENTITY_MATRIX,
	makeLine as makeLineUnderScreenPoint,
	normalizeQuat,
	normalizeVec3,
} from "../Tools";
import type {
	IEvent,
	IMatrix44,
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
	 * @returns {IMatrix44} The view matrix.
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
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public get viewMatrix () : IMatrix44
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
				quat.multiply ( nr, dr, this.rotation ); // This order is rotation about global axes.
				nr = normalizeQuat ( nr );

				this.rotation = nr;
				break;
			}
			case 4:
			{
				input = normalizeQuat ( input );

				let answer: IVector4 = [ 0, 0, 0, 1 ];
				quat.multiply ( answer, input, this.rotation ); // This order is rotation about global axes.
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
	 * Set the navigator so that the sphere is completely within the view-volume.
	 * If the given model is null then reset the navigator to its default state.
	 * @param {Sphere} sphere - The bounding sphere.
	 * @param {Projection} projection - The projection.
	 * @param {object} [options] - The options.
	 * @param {boolean} [options.resetRotation] - Whether or not to reset the rotation.
	 */
	public override viewSphere ( sphere: Sphere, projection: Projection, options?: { resetRotation?: boolean } ) : void
	{
		if ( projection instanceof Perspective )
		{
			const { fov } = projection;
			const { radius } = sphere;

			// Think of a ball falling into a cone. The field-of-view (fov) is the
			// angle of the cone's point. We want the distance from the cone's point
			// to the center of the ball. The radius from the center of the ball to
			// where the ball touches the cone makes a 90 degree angle with the cone.
			// The hypotenuse of the two symmetric triangles is the new trackball
			// distance. The geometry can be calculated in 2D.

			// sin ( theta ) = opposite / hypotenuse
			// hypotenuse = opposite / sin ( theta )
			// theta = fov / 2
			// opposite = radius
			// hypotenuse = radius / sin ( fov / 2 )
			const hypotenuse = radius / ( Math.sin ( ( fov / 2 ) * DEG_TO_RAD ) );

			// The hypotenuse is the new distance.
			this.distance = hypotenuse;

			// // Set the center.
			// this.center = sphere.center;

			// Reset the rotation if we should.
			if ( options?.resetRotation )
			{
				this.rotation = [ 0, 0, 0, 1 ];
			}
		}

		else
		{
			throw new Error ( `Projection type '${projection.type}' not supported when viewing sphere` );
		}
	}

	/**
	 * Make the trackball sphere in world space.
	 * @returns {Sphere} The trackball sphere.
	 */
	public makeSphere () : Sphere
	{
		const dist = this.distance;
		const sphere = new Sphere (
			[ 0, 0, 0 ], // Center
			( dist * 0.5 )   // Radius
		);
		return sphere;
	}

	/**
	 * Handle the event.
	 * @param {IEvent} event - The event.
	 */
	public override handleEvent ( event: IEvent ) : void
	{
		const { type } = event;

		switch ( type )
		{
			case "key_down":
			{
				this.keyDown ( event );
				break;
			}
			case "mouse_drag":
			{
				this.mouseDrag ( event );
				break;
			}
			default:
			{
				break;
			}
		}
	}

	/**
	 * Handle key down event.
	 * @param {IEvent} event - The key down event.
	 */
	protected keyDown ( event: IEvent ) : void
	{
		const { viewer } = event;

		const command = viewer.getCommand ( event );

		if ( !command )
		{
			return
		}

		command.execute ( viewer );
		viewer.requestRender();
	}

	/**
	 * Handle mouse drag event.
	 * @param {IEvent} event - The mouse drag event.
	 */
	protected mouseDrag ( event: IEvent ) : void
	{
		// Get input.
		const {
			type,
			current: cm,
			previous: pm,
			event: originalEvent,
			viewer,
		} = event;

		// Get viewer properties.
		const { projMatrix, viewport } = viewer;

		// Handle wrong event type.
		if ( "mouse_drag" !== type )
		{
			return;
		}

		// Handle invalid input.
		if ( !cm || !pm || !originalEvent )
		{
			return;
		}

		// Handle wrong event type.
		if ( false === ( originalEvent instanceof MouseEvent ) )
		{
			return;
		}

		// Left mouse button only.
		// TODO: Make this configurable.
		if ( 1 !== originalEvent.buttons )
		{
			return;
		}

		// Handle zero distance drag.
		if ( true === vec2.equals ( cm, pm ) )
		{
			return;
		}

		// Shortcut.
		const viewMatrix = this.viewMatrix;

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

		// Handle invalid lines.
		if ( ( !cl ) || ( !pl ) )
		{
			return;
		}

		// Normalize the lines.
		cl.normalize();
		pl.normalize();

		// Get the inverse of the view matrix.
		const ivm: IMatrix44 = [ ...IDENTITY_MATRIX ];
		mat4.invert ( ivm, viewMatrix );

		// Handle no inverse.
		if ( !ivm )
		{
			return;
		}

		// Put the lines in model space.
		cl.transform ( ivm );
		pl.transform ( ivm );

		// Handle invalid lines.
		if ( ( false === cl.valid ) || ( false === pl.valid ) )
		{
			return;
		}

		// Make the trackball sphere in world space.
		const sphere = this.makeSphere();

		// Intersect the lines with the trackball sphere.
		const ci = intersectLineSphere ( { line: cl, sphere } );
		const pi = intersectLineSphere ( { line: pl, sphere } );

		// We ignore zero or one (tangent) intersections.
		if ( !( isFiniteNumber ( ci.u1 ) && isFiniteNumber ( ci.u2 ) &&
						isFiniteNumber ( pi.u1 ) && isFiniteNumber ( pi.u2 ) ) )
		{
			return;
		}

		// Get the smaller parameter because that is the closest intersection.
		const uc = Math.min ( ci.u1!, ci.u2! );
		const up = Math.min ( pi.u1!, pi.u2! );

		// Get the intersection points.
		const p0: IVector3 = pl.getPoint ( up );
		const p1: IVector3 = cl.getPoint ( uc );

		// Make the vector from the sphere center to the first intersection point.
		let v0: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( v0, p0, this.center );
		v0 = normalizeVec3 ( v0 );

		// Make the vector from the sphere center to the second intersection point.
		let v1: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( v1, p1, this.center );
		v1 = normalizeVec3 ( v1 );

		// The cross product is the axis of rotation.
		let axis: IVector3 = [ 0, 0, 0 ];
		vec3.cross ( axis, v0, v1 );
		axis = normalizeVec3 ( axis );
		// console.log ( "Axis of rotation:", axis );

		// The angle between the two vectors.
		const angle = vec3.angle ( v0, v1 );

		// Handle invalid angles.
		if ( false === isFiniteNumber ( angle ) )
		{
			return;
		}

		// Rotate the trackball.
		this.rotate ( axis, angle );

		// Request a render.
		viewer.requestRender();
	}
}
