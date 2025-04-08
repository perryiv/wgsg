
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	A surface to render on.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * A surface to render on.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Surface
{
	#context: ( GPUCanvasContext | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {HTMLCanvasElement | GPUCanvasContext | null} [input] -
	 * Input can be a canvas, rendering context, null, or undefined.
	 * If it is anything else, an error will be thrown.
	 */
	constructor ( input?: ( HTMLCanvasElement | GPUCanvasContext | null ) )
	{
		// Is the input a canvas?
		if ( input instanceof HTMLCanvasElement )
		{
			this.canvas = input;
		}

		// Is the input a rendering context?
		else if ( input instanceof GPUCanvasContext )
		{
			this.#context = input;
		}

		// When we get to here it should be undefined or null.
		else if ( ( null !== input ) && ( "undefined" !== ( typeof input ) ) )
		{
			throw new Error ( "Invalid input type in render surface constructor: " + ( typeof input ) );
		}
	}

	/**
	 * Get the rendering context.
	 * @return {GPUCanvasContext | null} The rendering context, or null.
	 */
	public get context() : ( GPUCanvasContext | null )
	{
		return this.#context;
	}

	/**
	 * Set the rendering context.
	 *
	 * @param {GPUCanvasContext | null} context - The rendering context, or null.
	 */
	public set context ( context: ( GPUCanvasContext | null ) )
	{
		this.#context = context;
	}

	/**
	 * Set the rendering context from the given canvas.
	 *
	 * @param {HTMLCanvasElement | null} canvas - The HTML canvas element, or null.
	 */
	public set canvas ( canvas: ( HTMLCanvasElement | null ) )
	{
		this.#context = ( canvas ? canvas.getContext ( "webgpu" ) : null );
	}
}
