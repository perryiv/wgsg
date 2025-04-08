
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

import { Size, Viewport } from "../Types/Math";


///////////////////////////////////////////////////////////////////////////////
/**
 * A surface to render on.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Surface
{
	#context: ( GPUCanvasContext | null ) = null;
	#viewport: Viewport = { x: 0, y: 0, width: 0, height: 0 };

	/**
	 * Construct the class.
	 * @constructor
	 * @param {GPUCanvasContext | null} [input] -
	 * Input can be a rendering context, null, or undefined.
	 */
	constructor ( context?: ( GPUCanvasContext | null ) )
	{
		this.#context = ( context ?? null );
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
	 * Get the surface size.
	 * @return {Size} The size of the surface.
	 */
	public get size() : Size
	{
		const { width, height } = this.viewport;
		return { width, height };
	}

	/**
	 * Set the surface size.
	 * @param {Size} size - The new size of the surface.
	 */
	public set size ( size: Size )
	{
		const { x, y } = this.viewport;
		const { width, height } = size;
		this.viewport = { x, y, width, height };
	}

	/**
	 * Get the surface viewport.
	 * @return {Viewport} The viewport of the surface.
	 */
	public get viewport() : Viewport
	{
		return this.#viewport;
	}

	/**
	 * Set the surface viewport.
	 * @param {Viewport} viewport - The new viewport of the surface.
	 */
	public set viewport ( viewport: Viewport )
	{
		const { x, y, width, height } = viewport;
		if ( width < 0 )
		{
			throw new Error ( "Viewport width must be >= zero." );
		}
		if ( height < 0 )
		{
			throw new Error ( "Viewport height must be >= zero." );
		}
		if ( x < 0 )
		{
			throw new Error ( "Viewport x must be >= zero." );
		}
		if ( y < 0 )
		{
			throw new Error ( "Viewport y must be >= zero." );
		}
		this.#viewport = { x, y, width, height };
	}
}
