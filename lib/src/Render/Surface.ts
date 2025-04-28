
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

import { getRenderingContext } from "../Tools/WebGPU";
import { ISize, IViewport } from "../Types/Math";


///////////////////////////////////////////////////////////////////////////////
/**
 * The input for the constructor.
 */
///////////////////////////////////////////////////////////////////////////////

export interface ISurfaceConstructor
{
	// These two are needed.
	canvas: HTMLCanvasElement;
	device: GPUDevice;

	// The user can configure this if desired.
	context?: ( GPUCanvasContext | null );

	// This is also optional.
	name?: ( string | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * A surface to render on.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Surface
{
	#name: ( string | null ) = null;
	#canvas: HTMLCanvasElement;
	#context: GPUCanvasContext;
	#device: GPUDevice;
	#viewport: IViewport = { x: 0, y: 0, width: 0, height: 0 };

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ( { name, canvas, device, context } : ISurfaceConstructor )
	{
		// This should be valid.
		if ( !canvas )
		{
			throw new Error ( "Invalid canvas when constructing a surface" );
		}

		// This should be valid.
		if ( !device )
		{
			throw new Error ( "Invalid device when constructing a surface" );
		}

		// This one is optional. Make it if we have to.
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if ( !context )
		{
			context = getRenderingContext ( { device, canvas } );
		}

		// This should be valid when we get to here.
		if ( !context )
		{
			throw new Error ( "Failed to get rendering context for canvas when constructing a surface" );
		}

		// Observe changes to the canvas size.
		// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html#a-resizing
		const observer = new ResizeObserver ( ( items ) =>
		{
			// There can be only one.
			const item = items[0];
			const { inlineSize: width, blockSize: height } = item.contentBoxSize[0];
			const { maxTextureDimension2D: maxDimension } = device.limits;

			// Set the canvas size and make sure it's within the device's range.
			const canvas = ( item.target as HTMLCanvasElement );
			canvas.width  = Math.max ( 1, Math.min ( width,  maxDimension ) );
			canvas.height = Math.max ( 1, Math.min ( height, maxDimension ) );

			// Set the viewer's size.
			this.size = { width, height };

			console.log ( `New viewer size: ${width}, ${height}` );
		} );
		observer.observe ( canvas );

		// Set our members.
		this.#name = ( name ?? null );
		this.#canvas = canvas;
		this.#context = context;
		this.#device = device;
	}

	/**
	 * Get the name.
	 * @returns {string | null} The name of the surface.
	 */
	public get name () : ( string | null )
	{
		return this.#name;
	}

	/**
	 * Set the name.
	 * @param {string | null} name - The name of the surface.
	 */
	public set name ( name: ( string | null ) )
	{
		this.#name = name;
	}

	/**
	 * Get the device.
	 * @returns {GPUDevice} The GPU device.
	 */
	public get device () : GPUDevice
	{
		// Get a shortcut to the device.
		const device = this.#device;

		// Given how we construct the class, this is probably unnecessary.
		if ( !device )
		{
			throw new Error ( "Invalid GPU device in surface class" );
		}

		// Return the device.
		return device;
	}

	/**
	 * Get the canvas.
	 * @returns {HTMLCanvasElement} The HTML canvas element.
	 */
	public get canvas () : HTMLCanvasElement
	{
		// Get a shortcut to the canvas.
		const canvas = this.#canvas;

		// Given how we construct the class, this is probably unnecessary.
		if ( !canvas )
		{
			throw new Error ( "Invalid canvas element in surface class" );
		}

		// Return the canvas.
		return canvas;
	}

	/**
	 * Get the rendering context.
	 * @return {GPUCanvasContext} The rendering context.
	 */
	public get context() : GPUCanvasContext
	{
		// Get a shortcut to the canvas.
		const context = this.#context;

		// Make sure it is valid.
		if ( !context )
		{
			throw new Error ( "Invalid rendering context in surface class" );
		}

		// Return the context.
		return context;
	}

	/**
	 * Get the surface size.
	 * @return {ISize} The size of the surface.
	 */
	public get size() : ISize
	{
		const { width, height } = this.viewport;
		return { width, height };
	}

	/**
	 * Set the surface size.
	 * @param {ISize} size - The new size of the surface.
	 */
	public set size ( size: ISize )
	{
		const { x, y } = this.viewport;
		const { width, height } = size;
		this.viewport = { x, y, width, height };
	}

	/**
	 * Get the surface viewport.
	 * @return {IViewport} The viewport of the surface.
	 */
	public get viewport() : IViewport
	{
		return { ...this.#viewport };
	}

	/**
	 * Set the surface viewport.
	 * @param {IViewport} viewport - The new viewport of the surface.
	 */
	public set viewport ( viewport: IViewport )
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
