
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
import { clamp, Device } from "../Tools";
import { IVector3, IVector4 } from "../Types";
import { Perspective, ProjectionBase as Projection } from "../Projections";
import { SolidColor } from "../Shaders";
import { vec4 } from "gl-matrix";
import type { ISize, IViewport } from "../Types/Math";
import {
	Node,
	State,
	type IStateApplyInput,
} from "../Scene";
import type {
	ILayer,
	ILayerMap,
} from "../Render";
import {
	Cull as CullVisitor,
	Draw as DrawVisitor,
	Update as UpdateVisitor,
} from "../Visitors";


///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISurfaceConstructor
{
	// These two are needed.
	canvas: HTMLCanvasElement;
	device: Device;

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
	update: UpdateVisitor;
	cull: CullVisitor;
	draw: DrawVisitor;
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
	#device: Device;
	#viewport: IViewport = { x: 0, y: 0, width: 0, height: 0 };
	#scene: ( Node | null ) = null;
	#projection: Projection = new Perspective();
	#handles: ITimeoutHandles = { render: 0 };
	#frame: IFrameInfo = { count: 0, start: 0 };
	#visitors: ( IVisitors | null ) = null;
	#layers: ILayerMap = new Map < number, ILayer > ();
	#defaultState: State = new State();
	#clearColor: IVector4 = [ 0.0, 0.0, 0.0, 0.0 ]; // Transparent black.

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
		if ( !context )
		{
			context = device.getContext ( canvas );
		}

		// This should be valid when we get to here.
		if ( !context )
		{
			throw new Error ( "Failed to get rendering context for canvas when constructing a surface" );
		}

		// Shortcuts.
		const state = this.#defaultState;

		// Now we can make the visitors.
		const update = new UpdateVisitor();
		const cull = new CullVisitor ( {
			layers: this.#layers,
			defaultState: state,
		} );
		const draw = new DrawVisitor ( {
			context,
			device
		} );
		this.#visitors = { update, cull, draw };

		// Set the default state's properties.
		state.name = `Default state for ${this.getClassName()} ${this.id}`;
		state.shader = new SolidColor ( { device } );
		state.apply = this.defaultApplyFunction.bind ( this );
		state.reset = this.defaultResetFunction.bind ( this );

		// Observe changes to the canvas size.
		// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html#a-resizing
		const observer = new ResizeObserver ( this.resizeHandler.bind ( this ) );
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
	public override getClassName() : string
	{
		return "Viewers.Surface";
	}

	/**
	 * Default state apply function.
	 * @param {IStateApplyInput} input - The input object.
	 * @returns {void}
	 */
	protected defaultApplyFunction ( { state }: IStateApplyInput ) : void
	{
		console.log ( `In default state apply function for ${this.type} ${this.id} with state '${state.name}'` );
	}

	/**
	 * Default state reset function.
	 * @param {IStateApplyInput} input - The input object.
	 * @returns {void}
	 */
	protected defaultResetFunction ( { state }: IStateApplyInput ) : void
	{
		console.log ( `In default state reset function for ${this.type} ${this.id} with state '${state.name}'` );
	}

	/**
	 * Handle resize events.
	 * @param {ResizeObserverEntry[]} items - The resize observer entries.
	 */
	protected resizeHandler ( items: ResizeObserverEntry[] ) : void
	{
		// There can be only one.
		const item = items[0];
		let { inlineSize: width, blockSize: height } = item.contentBoxSize[0];
		const { maxTextureDimension2D: maxDimension } = this.device.limits;

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
	}

	/**
	 * Get the clear color.
	 * @returns {IVector4} The clear color.
	 */
	public get clearColor () : IVector4
	{
		return [ ...this.#clearColor ];
	}

	/**
	 * Set the clear color.
	 * @param {IVector4} color - The clear color to use.
	 */
	public set clearColor ( color: ( IVector3 | IVector4 ) )
	{
		// If there is no alpha then add one.
		if ( 3 === color.length )
		{
			color = [ ...color, 1.0 ]; // Add an alpha.
		}

		// When we get to here this should be true.
		if ( 4 !== color.length )
		{
			throw new Error ( `Invalid color array length: ${( color as [] ).length}, expected 3 or 4` );
		}

		// Make a copy because we may change it below.
		color = [ ...color ];

		// Clamp the color values to [0, 1].
		clamp ( color, 0.0, 1.0 );

		// Now copy the values to our member.
		vec4.copy ( this.#clearColor, color );
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
	 * Get the update visitor.
	 * @returns {UpdateVisitor} The update visitor.
	 */
	public get updateVisitor () : UpdateVisitor
	{
		// Shortcut.
		const uv = this.#visitors?.update;

		// Make sure the update visitor is valid.
		if ( !uv )
		{
			throw new Error ( "Accessing invalid update visitor in surface class" );
		}

		// Return the update visitor.
		return uv;
	}

	/**
	 * Set the update visitor.
	 * @param {UpdateVisitor} uv - The update visitor.
	 */
	public set updateVisitor ( uv: UpdateVisitor )
	{
		// By the time we get to here this should be valid.
		if ( !this.#visitors )
		{
			throw new Error ( "Invalid visitors in surface class" );
		}

		// Make sure the visitor is valid.
		if ( !uv )
		{
			throw new Error ( "Invalid update visitor in surface class" );
		}

		// Make sure the visitor is an UpdateVisitor.
		if ( !( uv instanceof UpdateVisitor ) )
		{
			throw new Error ( "Trying to set surface update visitor with object of wrong type" );
		}

		// Set our member.
		this.#visitors.update = uv;
	}

	/**
	 * Get the cull visitor.
	 * @returns {CullVisitor} The cull visitor.
	 */
	public get cullVisitor () : CullVisitor
	{
		// Shortcut.
		const cv = this.#visitors?.cull;

		// Make sure the cull visitor is valid.
		if ( !cv )
		{
			throw new Error ( "Accessing invalid cull visitor in surface class" );
		}

		// Return the cull visitor.
		return cv;
	}

	/**
	 * Set the cull visitor.
	 * @param {CullVisitor} cv - The cull visitor.
	 */
	public set cullVisitor ( cv: CullVisitor )
	{
		// By the time we get to here this should be valid.
		if ( !this.#visitors )
		{
			throw new Error ( "Invalid visitors in surface class" );
		}

		// Make sure the visitor is valid.
		if ( !cv )
		{
			throw new Error ( "Invalid cull visitor in surface class" );
		}

		// Make sure the visitor is a CullVisitor.
		if ( !( cv instanceof CullVisitor ) )
		{
			throw new Error ( "Trying to set surface cull visitor with object of wrong type" );
		}

		// Set our member.
		this.#visitors.cull = cv;
	}

	/**
	 * Get the draw visitor.
	 * @returns {DrawVisitor} The draw visitor.
	 */
	public get drawVisitor () : DrawVisitor
	{
		// Shortcut.
		const dv = this.#visitors?.draw;

		// Make sure the draw visitor is valid.
		if ( !dv )
		{
			throw new Error ( "Accessing invalid draw visitor in surface class" );
		}

		// Return the draw visitor.
		return dv;
	}

	/**
	 * Set the draw visitor.
	 * @param {DrawVisitor} dv - The draw visitor.
	 */
	public set drawVisitor ( dv: DrawVisitor )
	{
		// By the time we get to here this should be valid.
		if ( !this.#visitors )
		{
			throw new Error ( "Invalid visitors in surface class" );
		}

		// Make sure the visitor is valid.
		if ( !dv )
		{
			throw new Error ( "Invalid draw visitor in surface class" );
		}

		// Make sure the visitor is a DrawVisitor.
		if ( !( dv instanceof DrawVisitor ) )
		{
			throw new Error ( "Trying to set surface draw visitor with object of wrong type" );
		}

		// Set our member.
		this.#visitors.draw = dv;
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
	 * @returns {Device} The GPU device wrapper.
	 */
	public get device () : Device
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
		// Handle no scene.
		const scene = this.#scene;
		if ( !scene )
		{
			return;
		}

		// Shortcuts.
		const uv = this.updateVisitor;

		// The update visitor does several things before and after visiting the
		// scene so call its function to handle that.
		uv.update ( scene );
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
		const cv = this.cullVisitor;

		// Make sure the visitor has our layers and default state.
		// Note: It probably already does.
		cv.layers = this.#layers;
		cv.defaultState = this.defaultState;
		cv.projMatrix = [ ...this.#projection.matrix ];

		// Tell the visitor that it should return to its initial state.
		// This will clear the layers.
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

		// Handle no render graph.
		const layers = this.#layers;
		if ( !layers )
		{
			return;
		}

		// Shortcuts.
		const dv = this.drawVisitor;

		// Set the visitor's properties.
		dv.clearColor = this.clearColor;

		// Tell the visitor that it should return to its initial state.
		dv.reset();

		// Draw the layers
		dv.drawLayers ( layers );
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
