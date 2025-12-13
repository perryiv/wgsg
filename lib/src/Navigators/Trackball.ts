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

import { NavBase as BaseClass } from "./NavBase";
import {
	Perspective,
	ProjectionBase as Projection,
} from "../Projections";
import {
	intersectLinePlane,
	intersectLineSphere,
	isFiniteNumber,
	Plane,
	Sphere,
} from "../Math";
import {
	DEG_TO_RAD,
	IDENTITY_MATRIX,
	normalizeQuat,
	normalizeVec3,
} from "../Tools";
import type {
	IEvent,
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
} from "../Types";
import {
	mat4,
	quat,
	vec2,
	vec3,
	vec4,
} from "gl-matrix";


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
		distance: 0,
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
	#matrix: ( IMatrix44 | null ) = null;
	#inverse: ( IMatrix44 | null ) = null;
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
	public override getClassName () : string
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
	public override get viewMatrix () : Readonly<IMatrix44>
	{
		// Initialize the answer.
		let vm = this.#matrix;

		// If the answer is invalid ...
		if ( !vm )
		{
			// Give it space for the answer.
			vm = [ ...IDENTITY_MATRIX ];

			// Calculate and copy the new matrix.
			mat4.copy ( vm, this.calculateMatrix() );

			// Assign the answer for next time.
			this.#matrix = vm;

			// The inverse is now invalid.
			this.#inverse = null;
		}

		// Return what we have.
		return vm;
	}

	/**
	 * Get the inverse view matrix.
	 * @returns {IMatrix44 | null} The inverse view matrix, or null if it does not exist.
	 */
	public override get invViewMatrix () : ( Readonly<IMatrix44> | null )
	{
		// Initialize the answer.
		let ivm = this.#inverse;

		// If the answer is invalid ...
		if ( !ivm )
		{
			// Give it space for the answer.
			ivm = [ ...IDENTITY_MATRIX ];

			// Calculate the inverse.
			if ( !mat4.invert ( ivm, this.viewMatrix ) )
			{
				// If we get to here then the inverse failed.
				return null;
			}

			// Assign the answer for next time.
			this.#inverse = ivm;
		}

		// Return what we have.
		return ivm;
	}

	/**
	 * Get the center point.
	 * @returns {IVector3} The center point.
	 */
	public get center () : Readonly<IVector3>
	{
		return this.#state.center;
	}

	/**
	 * Set the center point.
	 * @param {IVector3} c - The center point.
	 */
	public set center ( c: Readonly<IVector3> )
	{
		vec3.copy ( this.#state.center, c );
		this.#matrix = null;
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
		this.#matrix = null;
	}

	/**
	 * Get the rotation.
	 * @returns {IVector4} The rotation.
	 */
	public get rotation () : Readonly<IVector4>
	{
		return this.#state.rotation;
	}

	/**
	 * Set the rotation.
	 * @param {IVector4} r - The rotation.
	 */
	public set rotation ( r: Readonly<IVector4> )
	{
		vec4.copy ( this.#state.rotation, r );
		this.#matrix = null;
	}

	/**
	 * Rotate the navigator.
	 * @param {IVector4} quaternion - The rotation quaternion.
	 */
	public override rotateQuaternion ( quaternion: IVector4 ) : void
	{
		// Make sure it's normalized.
		quaternion = normalizeQuat ( quaternion );

		// Make space for the answer.
		let answer: IVector4 = [ 0, 0, 0, 1 ];

		// This order is rotation about global axes.
		quat.multiply ( answer, quaternion, this.rotation );

		// Make sure it's normalized.
		answer = normalizeQuat ( answer );

		// Set the new rotation.
		this.rotation = answer;
	}

	/**
	 * Rotate the navigator.
	 * @param {IVector3} axis - The rotation axis.
	 * @param {number} radians - The angle in radians.
	 */
	public override rotateAxisAngle ( axis: IVector3, radians: number ) : void
	{
		// Make sure the axis is normalized.
		axis = normalizeVec3 ( axis );

		// Make space for the rotation.
		let dr: IVector4 = [ 0, 0, 0, 1 ];

		// Calculate the rotation quaternion.
		quat.setAxisAngle ( dr, axis, radians );

		dr = normalizeQuat ( dr );

		let nr: IVector4 = [ 0, 0, 0, 1 ]; // New rotation.

		// This order is rotation about global axes.
		quat.multiply ( nr, dr, this.rotation );

		// Make sure it's normalized.
		nr = normalizeQuat ( nr );

		// Set the new rotation.
		this.rotation = nr;
	}

	/**
	 * Translate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IVector2} input.current - The current screen position.
	 * @param {IVector2} input.previous - The previous screen position.
	 * @param {number} input.scale - The translation scale factor.
	 */
	public override translateScreenXY ( input: { current: IVector2, previous: IVector2, scale: number } ) : void
	{
		// Get the input.
		const { current, previous, scale } = input;

		// The two points make our translation vector.
		const t: IVector2 = [ 0, 0 ];
		vec2.subtract ( t, previous, current );
		vec2.scale ( t, t, scale );

		// Get the center in global space.
		const center: IVector3 = [ ...this.center ];
		vec3.transformMat4 ( center, center, this.viewMatrix );

		// Now translate the center.
		vec3.add ( center, center, [ t[0], t[1], 0 ] );

		// Get the inverse of the view matrix.
		const ivm = this.invViewMatrix;

		// Handle invalid matrix.
		if ( !ivm )
		{
			return;
		}

		// Put the new center point in model space.
		vec3.transformMat4 ( center, center, ivm );

		// Set the new center.
		this.center = center;
	}

	/**
	 * Zoom the navigator.
	 * @param {number} scale - The zoom scale factor.
	 */
	public zoom ( scale: number ) : void
	{
		this.distance *= scale;
		this.#matrix = null;
	}

	/**
	 * Reset the navigator to its default state.
	 */
	public override reset() : void
	{
		this.#state = makeDefaultTrackballState();
		this.#matrix = null;
	}

	/**
	 * Set the navigator so that the sphere is completely within the view-volume.
	 * @param {object} input - The input parameters.
	 * @param {Sphere} input.sphere - The sphere to view.
	 * @param {Projection} input.projection - The projection to use.
	 * @param {boolean} [input.resetRotation] - Whether to or not reset the rotation.
	 */
	public override viewSphere ( input: { sphere: Sphere, projection: Projection, resetRotation?: boolean } ) : void
	{
		// Get the input.
		const { sphere, projection, resetRotation } = input;

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

			// Set the center.
			this.center = sphere.center;

			// Reset the rotation if we should.
			if ( resetRotation )
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
	 * Make the trackball sphere.
	 * @returns {Sphere} The trackball sphere.
	 */
	public makeSphere () : Sphere
	{
		return new Sphere ( [ 0, 0, -2 ], 1 );
	}

	/**
	 * Handle the event.
	 * @param {IEvent} event - The event.
	 */
	public override handleEvent ( event: IEvent ) : void
	{
		// Shortcut.
		const { viewer } = event;

		// Get the command for this event's input state.
		const command = viewer.getCommand ( event );

		// Handle no command.
		if ( !command )
		{
			return
		}

		// If we get to here then execute the command.
		command.execute ( event );
	}

	/**
	 * Translate the navigator in screen x-y space.
	 * @param {object} params - The parameters.
	 * @param {IEvent} params.event - The event.
	 * @param {number} params.scale - The translation scale factor.
	 */
	public override mouseTranslate ( params: { event: IEvent, scale: number } ) : void
	{
		// Get the input.
		const { event, scale } = params;
		const { previous: pm, current: cm, viewer } = event;

		// Handle no mouse points.
		if ( !pm || !cm )
		{
			return;
		}

		// Handle zero distance between screen points.
		if ( true === vec2.equals ( cm, pm ) )
		{
			return;
		}

		// We need the inverse of the view matrix in order to proceed.
		const ivm = this.invViewMatrix;

		// Handle invalid matrix.
		if ( !ivm )
		{
			return;
		}

		// Get the line under the current mouse point in global space.
		const cl = viewer.makeLine ( { screenPoint: cm, viewMatrix: IDENTITY_MATRIX } );

		// Handle invalid line.
		if ( !cl?.valid )
		{
			return;
		}

		// Get the line under the previous mouse point in global space.
		const pl = viewer.makeLine ( { screenPoint: pm, viewMatrix: IDENTITY_MATRIX } );

		// Handle invalid line.
		if ( !pl?.valid )
		{
			return;
		}

		// Make sure the lines are normalized.
		cl.normalize();
		pl.normalize();

		// Make a plane parallel to the view-plane at the negative distance.
		const point: IVector3 = [ 0, 0, -this.distance ];
		const plane = new Plane ( { point, normal: [ 0, 0, 1 ] } );

		// Intersect the lines with the plane.
		const ci = intersectLinePlane ( { line: cl, plane } );
		const pi = intersectLinePlane ( { line: pl, plane } );

		// Handle no intersections.
		if ( ( null === ci ) || ( null === pi ) )
		{
			return;
		}
		if ( ( false === isFiniteNumber ( ci ) ) || ( false === isFiniteNumber ( pi ) ) )
		{
			return;
		}

		// Get the intersection points.
		const cp = cl.getPoint ( ci );
		const pp = pl.getPoint ( pi );

		// Now we can translate with 2D screen points.
		this.translateScreenXY ( {
			current:  [ cp[0], cp[1] ],
			previous: [ pp[0], pp[1] ],
			scale } );
	}

	/**
	 * Rotate the navigator.
	 * @param {object} input - The input parameters.
	 * @param {IEvent} input.event - The event.
	 * @param {number} input.scale - The rotation scale factor.
	 */
	public override mouseRotate ( input: { event: IEvent, scale: number } ) : void
	{
		// Get input.
		const { event, scale } = input;

		// Get the event properties.
		const { current: cm, previous: pm, viewer } = event;

		// Handle invalid input.
		if ( !cm || !pm )
		{
			return;
		}

		// Handle zero distance between screen points.
		if ( true === vec2.equals ( cm, pm ) )
		{
			return;
		}

		// Get the line under the current mouse point in global space.
		const cl = viewer.makeLine ( { screenPoint: cm, viewMatrix: [ ...IDENTITY_MATRIX ] } );

		// Handle invalid line.
		if ( !cl?.valid )
		{
			return;
		}

		// Get the line under the previous mouse point in global space.
		const pl = viewer.makeLine ( { screenPoint: pm, viewMatrix: [ ...IDENTITY_MATRIX ] } );

		// Handle invalid line.
		if ( !pl?.valid )
		{
			return;
		}

		// Make sure the lines are normalized.
		cl.normalize();
		pl.normalize();

		// Make the trackball sphere in global space.
		const sphere = this.makeSphere();

		// Intersect the lines with the trackball sphere.
		const ci = intersectLineSphere ( { line: cl, sphere } );
		const pi = intersectLineSphere ( { line: pl, sphere } );

		// We ignore zero or one (tangent) intersections.
		if ( !(
			isFiniteNumber ( ci.u1 ) &&
			isFiniteNumber ( ci.u2 ) &&
			isFiniteNumber ( pi.u1 ) &&
			isFiniteNumber ( pi.u2 )
		) )
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
		vec3.subtract ( v0, p0, sphere.center );
		v0 = normalizeVec3 ( v0 );

		// Make the vector from the sphere center to the second intersection point.
		let v1: IVector3 = [ 0, 0, 0 ];
		vec3.subtract ( v1, p1, sphere.center );
		v1 = normalizeVec3 ( v1 );

		// The cross product is the axis of rotation.
		let axis: IVector3 = [ 0, 0, 0 ];
		vec3.cross ( axis, v0, v1 );
		axis = normalizeVec3 ( axis );

		// The angle between the two vectors.
		const angle = vec3.angle ( v0, v1 );

		// Handle invalid angles.
		if ( false === isFiniteNumber ( angle ) )
		{
			return;
		}

		// Rotate the trackball.
		this.rotateAxisAngle ( axis, angle * scale );

		// Request a render.
		viewer.requestRender();
	}
}
