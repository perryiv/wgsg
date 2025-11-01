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

import { BaseHandler } from "../Events/Handlers/BaseHandler";
import { Group, Node, Transform } from "../Scene";
import { NavBase, Trackball } from "../Navigators";
import { type ISurfaceConstructor, Surface } from "./Surface";
import type { IMouseData, IVector2 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IViewerConstructor = ISurfaceConstructor;

type IEventHandlerStack = BaseHandler[];

interface IViewerSceneBranches
{
	root: Group;
	fixed: Group;
	nav: Transform;
	model: Group;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the default mouse data.
 * @param {Viewer} viewer - The viewer.
 * @returns {IMouseData} The default mouse data.
 */
///////////////////////////////////////////////////////////////////////////////

function makeMouseData ( viewer: Viewer ) : IMouseData
{
	return {
		current: null,
		previous: null,
		event: null,
		requestRender: ( () => { viewer.requestRender() } )
	};
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the branches.
 * @returns {IViewerSceneBranches} The branches.
 */
///////////////////////////////////////////////////////////////////////////////

function makeBranches() : IViewerSceneBranches
{
	const root = new Group();
	const fixed = new Group();
	const nav = new Transform();
	const model = new Group();

	root.addChild ( fixed );
	root.addChild ( nav );
	nav.addChild ( model );

	return { root, fixed, nav, model };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * An interactive viewer.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Viewer extends Surface
{
	#mouse: IMouseData = makeMouseData ( this );
	#navigator: ( NavBase | null ) = null;
	#eventHandlers: IEventHandlerStack = [];
	#branches: IViewerSceneBranches = makeBranches();

	/**
	 * Construct the class.
	 * @class
	 * @param {IViewerConstructor} input - The input for the constructor.
	 */
	constructor ( input : IViewerConstructor )
	{
		// We need the canvas below.
		const { canvas } = input;

		// Have to call the super class constructor first.
		super ( input );

		// Set the scene.
		super.scene = this.#branches.root;

		// Register the event listeners.
		canvas.onmousedown   = this.mouseDown.bind ( this );
		canvas.onmousemove   = this.mouseMove.bind ( this );
		canvas.onmouseup     = this.mouseUp.bind   ( this );
		canvas.onmouseleave  = this.mouseOut.bind  ( this );
		canvas.onmouseenter  = this.mouseIn.bind   ( this );
		canvas.oncontextmenu = this.mouseContextMenu.bind ( this );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		// Shortcut.
		const canvas = this.canvas;

		// Remove our event listeners.
		canvas.onmousedown   = null;
		canvas.onmousemove   = null;
		canvas.onmouseup     = null;
		canvas.onmouseleave  = null;
		canvas.onmouseenter  = null;
		canvas.oncontextmenu = null;

		// Call the base class function.
		super.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Viewer";
	}

	/**
	 * Get the model scene.
	 * @returns {(Node | null)} The model scene or null if there is none.
	 */
	public get modelScene() : ( Node | null )
	{
		const model = this.#branches.model;
		return ( ( false === model.empty ) ? ( model.getChild ( 0 ) ) : null );
	}

	/**
	 * Set the model scene.
	 * @param {(Node | null)} scene - The model scene or null to clear it.
	 */
	public set modelScene ( scene: ( Node | null ) )
	{
		const model = this.#branches.model;
		model.clear();
		model.addChild ( scene ); // This handles null.
	}

	/**
	 * Get the current mouse position.
	 * @returns {IVector2 | null} The current mouse position.
	 */
	public get mouseCurrent() : ( IVector2 | null )
	{
		return this.#mouse.current;
	}

	/**
	 * Set the current mouse position.
	 * @param {IVector2 | null} pos - The current mouse position.
	 */
	public set mouseCurrent( pos: ( IVector2 | null ) )
	{
		this.#mouse.current = pos;
	}

	/**
	 * Get the previous mouse position.
	 * @returns {IVector2 | null} The previous mouse position.
	 */
	public get mousePrevious() : ( IVector2 | null )
	{
		return this.#mouse.previous;
	}

	/**
	 * Set the previous mouse position.
	 * @param {IVector2 | null} pos - The previous mouse position.
	 */
	public set mousePrevious( pos: ( IVector2 | null ) )
	{
		this.#mouse.previous = pos;
	}

	/**
	 * Get the navigator.
	 * @returns {NavBase} The navigator.
	 */
	public get navigator() : NavBase
	{
		// Shortcut.
		let n = this.#navigator;

		// The first time we make it.
		if ( !n )
		{
			n = new Trackball();
			this.#navigator = n;
		}

		// Return the navigator.
		return n;
	}

	/**
	 * Set the navigator so that the model is completely within the view-volume.
	 */
	public viewAll() : void
	{
		this.navigator.viewAll ( this.modelScene );
		this.requestRender();
	}

	/**
	 * Get the current event handler.
	 * @returns {(BaseHandler | null)} The current event handler or null if there are none.
	 */
	public get currentEventHandler() : ( BaseHandler | null )
	{
		// Shortcut.
		const handlers = this.#eventHandlers;

		// Handle when the stack is empty. This is not an error.
		if ( handlers.length < 1 )
		{
			return null;
		}

		// Return the top of the stack, which is the last element in the array.
		const last = handlers.length - 1;
		return handlers[last];
	}

	/**
	 * Get the current event handler or the navigator.
	 * @returns {BaseHandler} The current event handler or the navigator.
	 */
	public get eventHandlerOrNavigator() : BaseHandler
	{
		const handler = this.currentEventHandler;
		return ( handler ? handler : this.navigator );
	}

	/**
	 * Push a new event handler onto the stack.
	 * @param {BaseHandler} handler - The event handler to push.
	 */
	public pushEventHandler ( handler: BaseHandler ) : void
	{
		this.#eventHandlers.push ( handler );
	}

	/**
	 * Pop the current event handler off the stack.
	 * @returns {(BaseHandler | null)} The event handler that was popped or null if there were none.
	 */
	public popEventHandler () : ( BaseHandler | null )
	{
		// Shortcuts.
		const handlers = this.#eventHandlers;

		// Get the top of the stack, which is the last element in the array.
		const handler = ( ( handlers.length > 0 ) ? handlers.pop() : null );

		// Do not return undefined.
		return ( handler ? handler : null );
	}

	/**
	 * Make the mouse data.
	 * @param {MouseEvent | undefined} event - The mouse event.
	 * @returns {IMouseData} The mouse data.
	 */
	private makeMouseData ( event?: MouseEvent ) : IMouseData
	{
		let current = this.mouseCurrent;
		let previous = this.mousePrevious;

		current  = ( current  ? [ ...current  ] : null );
		previous = ( previous ? [ ...previous ] : null );

		const requestRender = this.requestRender.bind ( this );
		return { event, current, previous, requestRender };
	}

	/**
	 * Handle the mouse down event.
	 * @param {MouseEvent} event - The mouse down event.
	 */
	public mouseDown ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event );
		handler.mouseDown ( data );
	}

	/**
	 * Handle the mouse move event.
	 * @param {MouseEvent} event - The mouse move event.
	 */
	public mouseMove ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event )
		handler.mouseMove ( data );
		if ( event.buttons )
		{
			handler.mouseDrag ( data );
		}
	}

	/**
	 * Handle the mouse up event.
	 * @param {MouseEvent} event - The mouse up event.
	 */
	public mouseUp ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event );
		handler.mouseUp ( data );
	}

	/**
	 * Handle the mouse out event.
	 * @param {MouseEvent} event - The mouse out event.
	 */
	public mouseOut ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event );
		handler.mouseOut ( data );
	}

	/**
	 * Handle the mouse in event.
	 * @param {MouseEvent} event - The mouse in event.
	 */
	public mouseIn ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event );
		handler.mouseIn ( data );
	}

	/**
	 * Handle the mouse context menu event.
	 * @param {MouseEvent} event - The mouse context menu event.
	 */
	public mouseContextMenu ( event: MouseEvent ) : void
	{
		event.preventDefault();
		const handler = this.eventHandlerOrNavigator;
		const data = this.makeMouseData ( event );
		handler.mouseContextMenu ( data );
	}

	/**
	 * Render the scene.
	 */
	public override render() : void
	{
		// Set the transform from the navigator.
		this.#branches.nav.matrix = this.navigator.matrix;

		// Now call the base class.
		super.render();
	}
}
