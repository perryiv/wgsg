
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	An interactive viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { Surface } from "./Surface";


///////////////////////////////////////////////////////////////////////////////
/**
 * An interactive viewer.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Viewer
{
	#canvas: ( HTMLCanvasElement | null ) = null;
	#surface: ( Surface | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {HTMLCanvasElement | null} [input] -
	 * Input can be a canvas, null, or undefined.
	 */
	constructor ( canvas?: ( HTMLCanvasElement | null ) )
	{
		this.canvas = ( canvas ?? null );
	}

	/**
	 * Get the surface.
	 * @returns {Surface | null} The surface, or null.
	 */
	public get surface () : ( Surface | null )
	{
		return this.#surface;
	}

	/**
	 * Get the canvas.
	 * @returns {HTMLCanvasElement | null} The HTML canvas element, or null.
	 */
	public get canvas () : ( HTMLCanvasElement | null )
	{
		return this.#canvas;
	}

	/**
	 * Set the canvas.
	 * @param {HTMLCanvasElement | null} canvas - The HTML canvas element, or null.
	 */
	public set canvas ( canvas: ( HTMLCanvasElement | null ) )
	{
		// Set the canvas, which may be null.
		this.#canvas = ( canvas ?? null );

		// If we have a valid canvas then make a new surface.
		if ( canvas )
		{
			this.#surface = new Surface ( canvas.getContext ( "webgpu" ) );
		}
		// Otherwise, destroy the surface.
		else
		{
			this.#surface = null;
		}
	}
}
