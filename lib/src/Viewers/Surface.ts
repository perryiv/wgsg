
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
import { Node, Shape, State } from "../Scene";
import { Perspective, ProjectionBase as Projection } from "../Projections";
import type { ISize, IViewport } from "../Types/Math";
import type {
	IClipGroups,
	ILayerMap,
	IProjectionGroup,
	IShapesMap,
	IStateMap,
} from "../Render";


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
	#layers: ILayerMap = new Map < number, IClipGroups > ();
	#defaultState: State = new State();

	/**
	 * Construct the class.
	 * @class
	 * @param {ISurfaceConstructor} input - The constructor input object.
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
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Viewers.Surface";
	}

	/**
	 * Get the default state or throw an exception.
	 * @returns {State} The default state.
	 */
	public get defaultState () : State
	{
		const state = this.#defaultState;
		if ( !state )
		{
			throw new Error ( "Invalid default state" );
		}
		return state;
	}

	/**
	 * Set the default state.
	 * @param {State} state - The default state.
	 */
	public set defaultState ( state: State )
	{
		this.#defaultState = state;
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
	 * @returns {GPUCanvasContext} The rendering context.
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
	 * @returns {ISize} The size of the surface.
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
	 * @returns {number} The width of the surface.
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
	 * @returns {number} The height of the surface.
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
	 * @returns {IViewport} The viewport of the surface.
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
		// Handle no scene.
		const scene = this.#scene;
		if ( !scene )
		{
			return;
		}

		// Shortcuts.
		const cv = this.#visitors.cull;

		// Make sure the visitor has our layers and default state.
		// Note: It probably already does.
		cv.layers = this.#layers;
		cv.defaultState = this.defaultState;

		// Tell the visitor that it should return to its initial state.
		// This will clear the layers.
		cv.reset();

		// Have the scene accept the visitor.
		scene.accept ( cv );
	}

	/**
	 * Draw the list of shapes.
	 * @param {Shape[]} shapes - The list of shapes to draw.
	 */
	private _drawShapeList ( shapes: Shape[] )
	{
		// Loop through the list of shapes and draw them.
		for ( const shape of shapes )
		{
			shape.draw();
		}
	}

	/**
	 * Draw the map of shapes.
	 * @param {State} state - The current state.
	 * @param {IShapesMap} sm - The map of shapes to draw.
	 */
	private _drawShapesMap ( state: State, sm: IShapesMap )
	{
		// Loop through the map of shapes.
		for ( const [ matrix, shapes ] of sm )
		{
			state.modelMatrix = matrix;
			this._drawShapeList ( shapes );
		}
	}

	/**
	 * Draw the projection group.
	 * @param {State} state - The current state.
	 * @param {IProjectionGroup} proj - The projection group to draw.
	 */
	private _drawProjectionGroup ( state: State, proj: IProjectionGroup )
	{
		// Loop through the projection group.
		for ( const [ matrix, sm ] of proj )
		{
			state.projMatrix = matrix;
			this._drawShapesMap ( state, sm );
		}
	}

	/**
	 * Draw the clip group.
	 * @param {IStateMap} sm - The state-map containing the projection groups to draw.
	 */
	private _drawStateMap ( sm: IStateMap )
	{
		// Loop through the state map.
		for ( const { state, proj } of sm.values() )
		{
			state.apply();
			this._drawProjectionGroup ( state, proj );
			state.reset();
		}
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

		// Make an array of layers.
		const layers = Array.from ( this.#layers, ( [ layer, clipGroups ] ) =>
		{
			return { layer, clipGroups };
		} );

		// Sort the array using the key.
		layers.sort ( ( a, b ) =>
		{
			return ( a.layer - b.layer );
		} );

		// Loop through the array of layers.
		for ( const { clipGroups } of layers )
		{
			const { clipped, unclipped } = clipGroups;
			this._drawStateMap ( clipped );
			this._drawStateMap ( unclipped );
		}
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
