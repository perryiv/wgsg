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
import { NavBase, Trackball } from "../Navigators";
import { type ISurfaceConstructor, Surface } from "./Surface";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

type IEventHandlerStack = BaseHandler[];
export type IViewerConstructor = ISurfaceConstructor;


///////////////////////////////////////////////////////////////////////////////
/**
 * An interactive viewer.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Viewer extends Surface
{
	#navigator: ( NavBase | null ) = null;
	#eventHandlers: IEventHandlerStack = [];

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

		// Register the event listeners.
		canvas.onmousedown = this.mouseDown.bind ( this );
		canvas.onmousemove = this.mouseMove.bind ( this );
		canvas.onmouseup   = this.mouseUp.bind   ( this );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
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
	 * Handle the mouse down event.
	 * @param {MouseEvent} event - The mouse down event.
	 */
	public mouseDown ( event: MouseEvent ) : void
	{
		const handler = this.currentEventHandler;
		if ( handler )
		{
			handler.mouseDown ( event );
		}
		else
		{
			this.navigator.mouseDown ( event );
		}
	}

	/**
	 * Handle the mouse move event.
	 * @param {MouseEvent} event - The mouse move event.
	 */
	public mouseMove ( event: MouseEvent ) : void
	{
		const handler = this.currentEventHandler;
		if ( handler )
		{
			handler.mouseMove ( event );
		}
		else
		{
			this.navigator.mouseMove ( event );
		}
	}

	/**
	 * Handle the mouse up event.
	 * @param {MouseEvent} event - The mouse up event.
	 */
	public mouseUp ( event: MouseEvent ) : void
	{
		const handler = this.currentEventHandler;
		if ( handler )
		{
			handler.mouseUp ( event );
		}
		else
		{
			this.navigator.mouseUp ( event );
		}
	}
}
