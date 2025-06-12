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

import { IMatrix44, IViewport } from "../Types";
import { isPositiveFiniteNumber } from "../Math";
import { makeIdentity } from "../Tools";
import { mat4 } from "gl-matrix";
import { Projection } from "./Projection";


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
	#near   = -1;
	#far    =  1;

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
	public getClassName() : string
	{
		return "Projections.Orthographic";
	}

	/**
	 * Return the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public get matrix() : IMatrix44
	{
		// Shortcuts.
		const top = this.#top;
		const bottom = this.#bottom;
		const left = this.#left;
		const right = this.#right;
		const near = this.#near;
		const far = this.#far;

		// Make sure near is closer than far.
		if ( near >= far )
		{
			throw new Error ( `Invalid distances when making perspective matrix, near: ${near}, far: ${far}` );
		}

		// Make sure top is above bottom.
		if ( bottom >= top )
		{
			throw new Error ( `Invalid vertical bounds when making perspective matrix, top: ${top}, bottom: ${bottom}` );
		}

		// Make sure left is before right.
		if ( left >= right )
		{
			throw new Error ( `Invalid horizontal bounds when making perspective matrix, left: ${left}, right: ${right}` );
		}

		// Initialize the answer.
		const answer: IMatrix44 = makeIdentity();

		// Write the perspective matrix to the answer.
		mat4.ortho ( answer, left, right, bottom, top, near, far );

		// Return the new matrix.
		return answer;
	}

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public set viewport ( vp: IViewport )
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
