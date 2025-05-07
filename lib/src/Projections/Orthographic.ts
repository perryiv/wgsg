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

import { IDENTITY_MATRIX, isPositiveFiniteNumber } from "../Tools";
import { IMatrix44, IViewport } from "../Types";
import { Projection } from "./Projection";


///////////////////////////////////////////////////////////////////////////////
/**
 * Orthographic projection class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Orthographic extends Projection
{
	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Orthographic";
	}

	/**
	 * Return the projection matrix.
	 * @return {IMatrix44} The projection matrix.
	 */
	public get matrix() : IMatrix44
	{
		return IDENTITY_MATRIX;
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
