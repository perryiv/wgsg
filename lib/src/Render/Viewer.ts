
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

export class Viewer extends Surface
{
	#canvas: ( HTMLCanvasElement | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {HTMLCanvasElement | null} [input] -
	 * Input can be a canvas, null, or undefined.
	 */
	constructor ( canvas?: ( HTMLCanvasElement | null ) )
	{
		super(); // The next line will set the inherited context.
		this.canvas = ( canvas ?? null );
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
		// Do nothing if it's the same.
		if ( this.#canvas === canvas )
		{
			return;
		}

		// Set the canvas, which may be null.
		this.#canvas = ( canvas ?? null );

		// If we have a valid canvas then make a new context.
		if ( canvas )
		{
			this.context = canvas.getContext ( "webgpu" );
		}

		// Otherwise, destroy the context.
		else
		{
			this.context = null;
		}
	}
}
