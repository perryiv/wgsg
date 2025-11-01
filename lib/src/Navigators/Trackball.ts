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

import { IDENTITY_MATRIX } from "../Tools";
import { isFiniteNumber } from "../Math";
import { mat4, quat, vec3, vec4 } from "gl-matrix";
import { NavBase as BaseClass } from "./NavBase";
import { Node } from "../Scene";
import type {
	IMatrix44,
	IMouseData,
	IVector3,
	IVector4
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
		mat4.multiply ( answer, tm, rm );
		mat4.multiply ( answer, answer, dm );

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
	protected rotate ( input: ( IVector3 | IVector4 ), radians?: number ) : void
	{
		switch ( input.length )
		{
			case 3:
			{
				if ( false === isFiniteNumber ( radians ) )
				{
					throw new Error ( "An angle in radians is required when rotating about an axis" );
				}

				return;
			}
			case 4:
			{
				const answer: IVector4 = [ 0, 0, 0, 1 ];
				quat.normalize ( input, input );
				quat.multiply ( answer, this.rotation, input );
				quat.normalize ( answer, answer );
				this.rotation = answer;
				break;
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
		// For now just reset to the default state.
		this.reset();
	}

	/**
	 * Handle mouse down event.
	 * @param {IMouseData} data - The mouse down data.
	 */
	public override mouseDown ( data: IMouseData ) : void
	{
		console.log ( "Mouse down:", data );
	}

	/**
	 * Handle mouse move event.
	 * @param {IMouseData} data - The mouse move data.
	 */
	public override mouseMove ( data: IMouseData ) : void
	{
		// console.log ( "Mouse move:", data );
	}

	/**
	 * Handle mouse drag event.
	 * @param {IMouseData} data - The mouse drag data.
	 */
	public override mouseDrag ( { event, requestRender }: IMouseData ) : void
	{
		switch ( event?.buttons )
		{
			case 1: // Left button.
			{
				this.rotate ( [ 0, 1, 10, 1 ] );
				requestRender();
				console.log ( "Mouse drag (left):", event );
				break;
			}

			case 2: // Right button.
			{
				console.log ( "Mouse drag (right):", event );
				break;
			}

			case 4: // Middle button.
			{
				console.log ( "Mouse drag (middle):", event );
				break;
			}
		}
	}

	/**
	 * Handle mouse up event.
	 * @param {IMouseData} data - The mouse up data.
	 */
	public override mouseUp ( data: IMouseData ) : void
	{
		console.log ( "Mouse up:", data );
	}
}
