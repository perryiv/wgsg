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
import { makeCommands, makeInputToCommandMap } from "./Commands";
import { NavBase, Trackball } from "../Navigators";
import {
	type ISurfaceConstructor,
	Surface as BaseClass,
} from "./Surface";
import type {
	ICommandMap,
	IEvent,
	IEventType,
	IInputToCommandMap,
	IMatrix44,
	IMouseState,
	IVector2,
} from "../Types";


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
 * @returns {IMouseState} The default mouse data.
 */
///////////////////////////////////////////////////////////////////////////////

function makeMouseData() : IMouseState
{
	return {
		buttonsDown: new Set < number > (),
		current:  null,
		previous: null,
		pressed:  null,
		released: null,
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

export class Viewer extends BaseClass
{
	#mouse: IMouseState = makeMouseData();
	#navigator: ( NavBase | null ) = null;
	#eventHandlers: IEventHandlerStack = [];
	#branches: IViewerSceneBranches = makeBranches();
	#keysDown: Set < string > = new Set < string > ();
	static #commands: ICommandMap = makeCommands();
	static #inputToCommand: IInputToCommandMap = makeInputToCommandMap();

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
		canvas.onmouseup     = this.mouseUp.bind ( this );
		canvas.onmouseleave  = this.mouseOut.bind ( this );
		canvas.onmouseenter  = this.mouseIn.bind ( this );
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
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public override get viewMatrix () : IMatrix44
	{
		return this.navigator.viewMatrix;
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
	 * Get the keys that are currently down.
	 * @returns {Set<string>} The keys that are currently down.
	 */
	public get keysDown() : Set < string >
	{
		return this.#keysDown;
	}

	/**
	 * Get the mouse buttons that are currently down.
	 * @returns {Set<number>} The mouse buttons that are currently down.
	 */
	public get mouseButtonsDown() : Set < number >
	{
		return this.#mouse.buttonsDown;
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
	 * @param {IVector2 | null} pt - The current mouse position.
	 */
	public set mouseCurrent ( pt: ( IVector2 | null ) )
	{
		this.#mouse.current = ( pt ? [ pt[0], pt[1] ] : null );
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
	 * @param {IVector2 | null} pt - The previous mouse position.
	 */
	public set mousePrevious ( pt: ( IVector2 | null ) )
	{
		this.#mouse.previous = ( pt ? [ pt[0], pt[1] ] : null );
	}

	/**
	 * Get the mouse coordinate when the button was pressed.
	 * @returns {IVector2 | null} The mouse coordinate when the button was pressed.
	 */
	public get mousePressed() : ( IVector2 | null )
	{
		return this.#mouse.pressed;
	}

	/**
	 * Set the mouse coordinate when the button was pressed.
	 * @param {IVector2 | null} pt - The mouse coordinate when the button was pressed.
	 */
	public set mousePressed ( pt: ( IVector2 | null ) )
	{
		this.#mouse.pressed = ( pt ? [ pt[0], pt[1] ] : null );
	}

	/**
	 * Get the mouse coordinate when the button was released.
	 * @returns {IVector2 | null} The mouse coordinate when the button was released.
	 */
	public get mouseReleased() : ( IVector2 | null )
	{
		return this.#mouse.released;
	}

	/**
	 * Set the mouse coordinate when the button was released.
	 * @param {IVector2 | null} pt - The mouse coordinate when the button was released.
	 */
	public set mouseReleased ( pt: ( IVector2 | null ) )
	{
		this.#mouse.released = ( pt ? [ pt[0], pt[1] ] : null );
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
		return ( handler ?? this.navigator );
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
		return ( handler ?? null );
	}

	/**
	 * Make the event.
	 * @param {IEventType} type - The event type.
	 * @param {MouseEvent | KeyboardEvent} event - The original event.
	 * @returns {IEvent} The mouse event data.
	 */
	private makeEvent ( type: IEventType, event: ( MouseEvent | KeyboardEvent ) ) : IEvent
	{
		return {
			type, event, viewer: this,
			keysDown: new Set ( this.keysDown ),
			buttonsDown: new Set ( this.mouseButtonsDown ),
			current:  this.mouseCurrent,
			previous: this.mousePrevious,
			pressed:  this.mousePressed,
			released: this.mouseReleased,
		};
	}

	/**
	 * Handle the mouse down event.
	 * @param {MouseEvent} input - The mouse down event.
	 */
	public mouseDown ( input: MouseEvent ) : void
	{
		input.preventDefault();

		this.mousePrevious = this.mouseCurrent;
		this.mouseCurrent = [ input.clientX, input.clientY ];

		this.mouseReleased = null;
		this.mousePressed = [ input.clientX, input.clientY ];

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_down", input );

		handler.handleEvent ( event );
	}

	/**
	 * Handle the mouse move event.
	 * @param {MouseEvent} input - The mouse move event.
	 */
	public mouseMove ( input: MouseEvent ) : void
	{
		input.preventDefault();

		this.mousePrevious = this.mouseCurrent;
		this.mouseCurrent = [ input.clientX, input.clientY ];

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_move", input );
		handler.handleEvent ( event );

		if ( input.buttons )
		{
			event.type = "mouse_drag"; // It's really the same event.
			handler.handleEvent ( event );
		}
	}

	/**
	 * Handle the mouse up event.
	 * @param {MouseEvent} input - The mouse up event.
	 */
	public mouseUp ( input: MouseEvent ) : void
	{
		input.preventDefault();

		this.mousePrevious = this.mouseCurrent;
		this.mouseCurrent = [ input.clientX, input.clientY ];

		this.mouseReleased = [ input.clientX, input.clientY ];

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_up", input );

		handler.handleEvent ( event );

		// Reset these now that they've been used.
		this.mousePressed = null;
		this.mouseReleased = null;
	}

	/**
	 * Handle the mouse out event.
	 * @param {MouseEvent} input - The mouse out event.
	 */
	public mouseOut ( input: MouseEvent ) : void
	{
		input.preventDefault();

		this.mouseButtonsDown.clear();
		this.keysDown.clear();
		this.mouseCurrent = null;
		this.mousePrevious = null;

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_out", input );

		handler.handleEvent ( event );
	}

	/**
	 * Handle the mouse in event.
	 * @param {MouseEvent} input - The mouse in event.
	 */
	public mouseIn ( input: MouseEvent ) : void
	{
		input.preventDefault();

		this.mouseButtonsDown.clear();
		this.keysDown.clear();
		this.mouseCurrent = [ input.clientX, input.clientY ];
		this.mousePrevious = null;

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_in", input );
		handler.handleEvent ( event );
	}

	/**
	 * Handle the mouse context menu event.
	 * @param {MouseEvent} event - The mouse context menu event.
	 */
	public mouseContextMenu ( event: MouseEvent ) : void
	{
		// Prevent the context menu from showing.
		event.preventDefault();
	}

	/**
	 * Handle the key down event.
	 * @param {KeyboardEvent} input - The key down event.
	 */
	public keyDown ( input: KeyboardEvent ) : void
	{
		input.preventDefault();

		const { code } = input;
		this.keysDown.add ( code );

		const handler = this.currentEventHandler;

		if ( handler )
		{
			const event = this.makeEvent ( "key_down", input );
			handler.handleEvent ( event );
			return;
		}
	}

	/**
	 * Handle the key up event.
	 * @param {KeyboardEvent} input - The key up event.
	 */
	public keyUp ( input: KeyboardEvent ) : void
	{
		input.preventDefault();

		const { code } = input;
		this.keysDown.delete ( code );

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "key_up", input );
		handler.handleEvent ( event );
	}

	/**
	 * Render the scene.
	 */
	public override render() : void
	{
		// Set the transform from the navigator.
		this.#branches.nav.matrix = this.navigator.viewMatrix;

		// Now call the base class.
		super.render();
	}
}
