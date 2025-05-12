
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

import { Base } from "../Base/Base";
import { Cull as CullVisitor } from "../Visitors";
import { getRenderingContext } from "../Tools/WebGPU";
import { Node } from "../Scene";
import { Perspective, ProjectionBase as Projection } from "../Projections";
import type { ISize, IViewport } from "../Types/Math";


///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISurfaceConstructor
{
	// These two are needed.
	canvas: HTMLCanvasElement;
	device: GPUDevice;

	// The user can configure this if desired.
	context?: ( GPUCanvasContext | null );
}

export interface ITimeoutHandles
{
	render: number;
}

export interface IFrameInfo
{
	count: number;
	start: number;
	end?: number;
}

interface IVisitors
{
	cull: CullVisitor;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * A surface to render on.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Surface extends Base
{
	#canvas: HTMLCanvasElement;
	#context: GPUCanvasContext;
	#device: GPUDevice;
	#viewport: IViewport = { x: 0, y: 0, width: 0, height: 0 };
	#scene: ( Node | null ) = null;
	#projection: Projection = new Perspective();
	#handles: ITimeoutHandles = { render: 0 };
	#frame: IFrameInfo = { count: 0, start: 0 };
	#visitors: IVisitors = { cull: new CullVisitor() };

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ( { canvas, device, context } : ISurfaceConstructor )
	{
		// Call this first.
		super();

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
			let { inlineSize: width, blockSize: height } = item.contentBoxSize[0];
			const { maxTextureDimension2D: maxDimension } = device.limits;

			// Ignore when one or both are zero.
			if ( ( width <= 0 ) || ( height <= 0 ) )
			{
				return;
			}

			// Make sure it's within the device's range.
			width  = Math.max ( 1, Math.min ( width,  maxDimension ) );
			height = Math.max ( 1, Math.min ( height, maxDimension ) );

			// console.log ( `New surface size: ${width}, ${height}` );

			// Set the canvas size.
			const canvas = ( item.target as HTMLCanvasElement );
			canvas.width  = width;
			canvas.height = height;

			// Set this surface's size, which sets our viewport.
			this.size = { width, height };

			// Set the projection's viewport.
			this.projection.viewport = { ...this.#viewport };

			// Request a render in the near future.
			this.requestRender();
		} );
		observer.observe ( canvas );

		// Set our members.
		this.#canvas = canvas;
		this.#context = context;
		this.#device = device;
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Viewers.Surface";
	}

	/**
	 * Get the scene.
	 * @returns {string | null} The scene that gets rendered on the surface.
	 */
	public get scene () : ( Node | null )
	{
		return this.#scene;
	}

	/**
	 * Set the scene.
	 * @param {Node | null} scene - The scene that gets rendered on the surface.
	 */
	public set scene ( scene: ( Node | null ) )
	{
		this.#scene = scene;
	}

	/**
	 * Get the projection.
	 * @returns {Projection} The projection object.
	 */
	public get projection () : Projection
	{
		return this.#projection;
	}

	/**
	 * Set the projection.
	 * @param {Projection | null} projection - The projection object, or null.
	 * Setting to null will restore the default projection.
	 */
	public set projection ( projection: ( Projection | null ) )
	{
		// Make a new projection if we have to.
		if ( !projection )
		{
			const pp = new Perspective();
			pp.aspect = ( this.width / this.height );
			projection = pp;
		}

		// Set our member.
		this.#projection = projection;
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
		const { width, height } = this.#viewport;
		return { width, height };
	}

	/**
	 * Set the surface size.
	 * @param {ISize} size - The new size of the surface.
	 */
	public set size ( size: ISize )
	{
		const { x, y } = this.#viewport;
		const { width, height } = size;
		this.viewport = { x, y, width, height };
	}

	/**
	 * Get the surface width.
	 * @return {number} The width of the surface.
	 */
	public get width() : number
	{
		return this.#viewport.width;
	}

	/**
	 * Set the surface width.
	 * @param {number} width - The width of the surface.
	 */
	public set width ( width: number )
	{
		const { x, y, height } = this.#viewport;
		this.viewport = { x, y, width, height };
	}

	/**
	 * Get the surface height.
	 * @return {number} The height of the surface.
	 */
	public get height() : number
	{
		return this.#viewport.height;
	}

	/**
	 * Set the surface height.
	 * @param {number} height - The height of the surface.
	 */
	public set height ( height: number )
	{
		const { x, y, width } = this.#viewport;
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
		// Get the properties.
		const { x, y, width, height } = viewport;

		// Check for errors.
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

		// Set our member from a copy.
		this.#viewport = { x, y, width, height };
	}

	/**
	 * Update the scene if its dirty. This gets called when the scene is
	 * rendered. It's public so that it can be called at other times, too.
	 */
	public update ()
	{
		console.log ( "Updating scene" );
	}

	/**
	 * Cull the scene using the view frustum, generating the render-graph.
	 * This gets called when the scene is rendered so it's not necessary
	 * to explicitly call it. However, its public for unexpected use cases.
	 * Use with caution.
	 */
	public cull ()
	{
		console.log ( "Culling scene" );

		// Shortcuts.
		const cv = this.#visitors.cull;
		const scene = this.#scene;

		// Is there a scene?
		if ( !scene )
		{
			return;
		}

		// Tell the visitor that it should return to its initial state.
		cv.reset();

		// Have the scene accept the visitor.
		scene.accept ( cv );
	}

	/**
	 * Draw the render-graph, generating pixels that paint the canvas.
	 * This gets called when the scene is rendered so it's not necessary
	 * to explicitly call it. However, its public for unexpected use cases.
	 * Use with caution.
	 */
	public draw ()
	{
		console.log ( "Drawing render-graph" );
	}

	/**
	 * Get the frame information.
	 * @returns {IFrameInfo} The frame information.
	 */
	public get frame () : IFrameInfo
	{
		return { ...this.#frame };
	}

	/**
	 * Cancel any pending render.
	 */
	public cancelRender ()
	{
		const handle = this.#handles.render;
		this.#handles.render = 0;

		if ( handle > 0 )
		{
			cancelAnimationFrame ( handle );
		}
	}

	/**
	 * Request a render in the near future.
	 */
	public requestRender ()
	{
		// Cancel any pending renders that we might have.
		this.cancelRender();

		// Schedule another one.
		const handle = requestAnimationFrame ( () =>
		{
			this.render();
		} );

		// Set our member.
		this.#handles.render = handle;
	}

	/**
	 * Render immediately.
	 */
	public render ()
	{
		// Initialize the frame information.
		this.#frame = {
			start: performance.now(),
			count: ( this.#frame.count + 1 )
		};

		// Update the scene.
		this.update();

		// Cull the scene and make the render-graph.
		this.cull();

		// Draw the render-graph.
		this.draw();

		// Finish the frame.
		this.#frame.end = performance.now();

		console.log ( `Rendering frame ${this.#frame.count} took ${this.#frame.end - this.#frame.start} milliseconds` );
	}
}
