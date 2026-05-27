///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Orthographic projection class.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "../Tools/Constants";
import { mat4 } from "gl-matrix";
import { Projection } from "./Projection";
import type { IMatrix44, IViewport } from "../Types";
import {
	isFiniteNumber,
	isPositiveFiniteNumber,
	Sphere,
} from "../Math";


///////////////////////////////////////////////////////////////////////////////
/**
 * Orthographic projection class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Orthographic extends Projection
{
	#top    =  100;
	#bottom = -100;
	#left   = -100;
	#right  =  100;

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
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Projections.Orthographic";
	}

	/**
	 * Get the top value.
	 * @returns {number} The top value.
	 */
	public get top() : number
	{
		return this.#top;
	}

	/**
	 * Set the top value.
	 * @param {number} t - The new top value.
	 */
	public set top ( t: number )
	{
		if ( false === isFiniteNumber ( t ) )
		{
			throw new Error ( `Given top value '${t}' is not a finite number` );
		}
		this.#top = t;
	}

	/**
	 * Get the bottom value.
	 * @returns {number} The bottom value.
	 */
	public get bottom() : number
	{
		return this.#bottom;
	}

	/**
	 * Set the bottom value.
	 * @param {number} b - The new bottom value.
	 */
	public set bottom ( b: number )
	{
		if ( false === isFiniteNumber ( b ) )
		{
			throw new Error ( `Given bottom value '${b}' is not a finite number` );
		}
		this.#bottom = b;
	}

	/**
	 * Get the left value.
	 * @returns {number} The left value.
	 */
	public get left() : number
	{
		return this.#left;
	}

	/**
	 * Set the left value.
	 * @param {number} l - The new left value.
	 */
	public set left ( l: number )
	{
		if ( false === isFiniteNumber ( l ) )
		{
			throw new Error ( `Given left value '${l}' is not a finite number` );
		}
		this.#left = l;
	}

	/**
	 * Get the right value.
	 * @returns {number} The right value.
	 */
	public get right() : number
	{
		return this.#right;
	}

	/**
	 * Set the right value.
	 * @param {number} r - The new right value.
	 */
	public set right ( r: number )
	{
		if ( false === isFiniteNumber ( r ) )
		{
			throw new Error ( `Given right value '${r}' is not a finite number` );
		}
		this.#right = r;
	}

	/**
	 * Get the near distance.
	 * @returns {number} The near distance.
	 */
	public override get near() : number
	{
		// Prevent this from quietly failing:
		// const { near } = this;
		// Just inheriting the getter function is not enough.
		return super.near;
	}

	/**
	 * Get the far distance.
	 * @returns {number} The far distance.
	 */
	public override get far() : number
	{
		// Prevent this from quietly failing:
		// const { far } = this;
		// Just inheriting the getter function is not enough.
		return super.far;
	}

	/**
	 * Return the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public override get matrix() : Readonly<IMatrix44>
	{
		// Shortcuts.
		const { top, bottom, left, right, near, far } = this;

		// Make sure near is closer than far.
		if ( near >= far )
		{
			throw new Error ( `Invalid distances when making orthographic projection matrix, near: ${near}, far: ${far}` );
		}

		// Make sure top is above bottom.
		if ( bottom >= top )
		{
			throw new Error ( `Invalid vertical bounds when making orthographic projection matrix, top: ${top}, bottom: ${bottom}` );
		}

		// Make sure left is before right.
		if ( left >= right )
		{
			throw new Error ( `Invalid horizontal bounds when making orthographic projection matrix, left: ${left}, right: ${right}` );
		}

		// Initialize the answer.
		const answer: IMatrix44 = [ ...IDENTITY_MATRIX ];

		// Write the projection matrix to the answer.
		mat4.ortho ( answer, left, right, bottom, top, near, far );

		// Return the new matrix.
		return answer;
	}

	/**
	 * Update the projection's near and far distances.
	 * @param {Sphere} sphere - The bounding sphere to use when updating the distances.
	 */
	public override updateNearFar ( sphere: Readonly<Sphere> ) : void
	{
		// TODO: Update the distances.
		void sphere;
	}

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public set viewport ( vp: Readonly<IViewport> )
	{
		const { width, height } = vp;

		if ( false === isPositiveFiniteNumber ( width ) )
		{
			throw new Error ( `Given viewport width '${width}' is not a positive finite number` );
		}

		if ( false === isPositiveFiniteNumber ( height ) )
		{
			throw new Error ( `Given viewport height '${height}' is not a positive finite number` );
		}

		console.warn ( "TODO: Orthographic projection is ignoring the updated viewport" );
	}
}
