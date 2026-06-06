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

import { Animation } from "./Animation";
import { BaseHandler } from "../Events/Handlers/BaseHandler";
import { Decorator, Grid } from "../Decorators";
import { Group, Node, Transform } from "../Scene";
import { Line, Sphere } from "../Math";
import { Listeners } from "../Events";
import { NavBase, Trackball } from "../Navigators";
import { vec2 } from "gl-matrix";
import {
	makeCommands,
	makeInput as makeInputAsString,
	makeInputToCommandMap
} from "./Commands";
import {
	type ISurfaceConstructor,
	Surface as BaseClass,
} from "./Surface";
import {
	DEVELOPER_BUILD,
	hasBits,
	makeLine as makeLineUnderScreenPoint,
	setBits,
} from "../Tools";
import type {
	IAnimations,
	ICommand,
	ICommandMap,
	IEvent,
	IEventType,
	IInputToCommandNameMap,
	IMatrix44,
	IMouseDistanceEvent,
	IMouseState,
	IVector2,
	IViewerOptions,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerConstructor extends ISurfaceConstructor
{
	noMouseEvents?: boolean;
	noKeyboardEvents?: boolean;
	noDecorators?: boolean;
}

interface IViewerSceneBranches
{
	root: Group;
	fixed: Group;
	nav: Transform;
	model: Group;
	extra: Group;
}

type IEventHandlerStack = BaseHandler[];
type IEventListenerName = ( keyof WindowEventMap );
type IKeyboardEventListener = ( ( event: KeyboardEvent ) => void );
type IMouseEventListener = ( ( event: MouseEvent ) => void );
type IKeyboardEventListenerMap = Map < IEventListenerName, IKeyboardEventListener >;
type IMouseEventListenerMap = Map < IEventListenerName, IMouseEventListener >;
type IDecorators = Map < string, Decorator >;
type IDecoratorCallback = ( decorator: Decorator ) => void;


///////////////////////////////////////////////////////////////////////////////
/**
 * An interactive viewer.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Viewer extends BaseClass
{
	#mouse: IMouseState = Viewer.makeMouseData();
	#navBase: ( NavBase | null ) = null;
	#eventHandlers: IEventHandlerStack = [];
	#keyboardListeners: IKeyboardEventListenerMap = new Map();
	#mouseListeners: IMouseEventListenerMap = new Map();
	#clientListeners: Listeners = new Listeners();
	#branches: IViewerSceneBranches = Viewer.makeBranches ( true );
	#keysDown: Set < string > = new Set < string > ();
	#animations: IAnimations = { nav: new Animation() };
	#options: IViewerOptions = Viewer.makeOptions();
	#decorators: IDecorators = new Map();
	static #commands: ICommandMap = makeCommands();
	static #inputToCommand: IInputToCommandNameMap = makeInputToCommandMap();

	/**
	 * The flags for the viewer.
	 */
	static Flags = class
	{
		static USE_KEYBOARD_INPUT = ( 1 << 0 );
	}

	/**
	 * Construct the class.
	 * @class
	 * @param {IViewerConstructor} input - The input for the constructor.
	 */
	constructor ( input : IViewerConstructor )
	{
		// We need these below.
		const { noMouseEvents, noKeyboardEvents, noDecorators } = input;

		// Have to call the super class constructor first.
		super ( input );

		// Set the scene.
		super.scene = this.#branches.root;

		// Register the event listeners if we should.
		if ( !noMouseEvents )
		{
			this.addMouseEventListeners();
		}

		// Register keyboard event listeners if we should.
		if ( !noKeyboardEvents )
		{
			this.addKeyboardEventListeners();
		}

		// Listen for mouse distance events.
		this.#clientListeners.add ( "mouse_distance", ( event: IEvent ) =>
		{
			const { distance } = ( event as IMouseDistanceEvent );

			// Did the mouse move far enough to be considered a "throw"?
			if ( ( distance >= this.options.distance.mouse_throw ) )
			{
				// Are we allowed to animate?
				if ( true === this.options.animations.allow )
				{
					// There has to be an animation function already set.
					// Otherwise, this doesn't do anything.
					this.animations.nav.start ( this.options.duration.mouse_throw );
				}
			}
		} );

		// Add the default decorators.
		if ( !noDecorators )
		{
			this.setDefaultDecorators();
		}
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		// Remove our event listeners.
		this.removeKeyboardEventListeners();
		this.removeMouseEventListeners();

		// Help the garbage collection by setting these to initial or null values.
		this.#mouse = Viewer.makeMouseData();
		this.#navBase = null;
		this.#eventHandlers = [];
		this.#keyboardListeners.clear();
		this.#mouseListeners.clear();
		this.#clientListeners.destroy();
		this.#branches = Viewer.makeBranches ( false );
		this.#keysDown.clear();
		this.#animations.nav.stop();
		this.#options = Viewer.makeOptions();

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
	 * Make the default mouse data.
	 * @returns {IMouseState} The default mouse data.
	 */
	protected static makeMouseData() : IMouseState
	{
		return {
			buttonsDown: new Set < number > (),
			current:  null,
			previous: null,
			pressed:  null,
			released: null,
		};
	}

	/**
	 * Make the branches.
	 * @param {boolean} buildScene - Whether or not to build the scene graph.
	 * @returns {IViewerSceneBranches} The branches.
	 */
	protected static makeBranches ( buildScene: boolean ) : IViewerSceneBranches
	{
		const root = new Group();
		const fixed = new Group();
		const nav = new Transform();
		const model = new Group();
		const extra = new Group();

		if ( buildScene )
		{
			root.addChild ( fixed );
			root.addChild ( nav );
			nav.addChild ( model );
			nav.addChild ( extra );
		}

		return { root, fixed, nav, model, extra };
	}

	/**
	 * Make the options.
	 * @returns {IViewerOptions} The options.
	 */
	protected static makeOptions() : IViewerOptions
	{
		return {
			animations: {
				allow: true
			},
			distance: {
				mouse_move_max: 150,
				mouse_throw: 2
			},
			duration: {
				mouse_throw: 1500,
				rotate_axis_angle: 500,
				view_reset: 1000
			}
		};
	}

	/**
	 * Add mouse event listeners.
	 */
	protected addMouseEventListeners() : void
	{
		const canvas = this.canvas;
		const lm = this.#mouseListeners;

		if ( lm.size > 0 )
		{
			return; // Can only add them once.
		}

		lm.set ( "mousedown", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseDown ( event );
			}
		} );

		lm.set ( "mousemove", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseMove ( event );
			}
		} );

		lm.set ( "wheel", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseWheel ( event );
			}
		} );

		lm.set ( "mouseup", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseUp ( event );
			}
		} );

		lm.set ( "mouseleave", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseOut ( event );
			}
		} );

		lm.set ( "mouseenter", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseIn ( event );
			}
		} );

		lm.set ( "contextmenu", ( event: MouseEvent ) =>
		{
			if ( false === this.isDestroyed() )
			{
				this.mouseContextMenu ( event );
			}
		} );

		lm.forEach ( ( handler, type ) =>
		{
			canvas.addEventListener ( type, ( handler as EventListener ), false );
		} );
	}

	/**
	 * Add keyboard event listeners.
	 */
	protected addKeyboardEventListeners() : void
	{
		const lm = this.#keyboardListeners;

		if ( lm.size > 0 )
		{
			return; // Can only add them once.
		}

		lm.set ( "keydown", ( event: KeyboardEvent ) =>
		{
			if ( ( false === this.isDestroyed() ) && ( true === this.useKeyboardInput ) && ( false === event.repeat ) )
			{
				this.keyDown ( event );
			}
		} );

		lm.set ( "keyup", ( event: KeyboardEvent ) =>
		{
			if ( ( false === this.isDestroyed() ) && ( true === this.useKeyboardInput ) )
			{
				this.keyUp ( event );
			}
		} );

		lm.forEach ( ( handler, type ) =>
		{
			globalThis.addEventListener ( type, ( handler as EventListener ), false );
		} );
	}

	/**
	 * Remove mouse event listeners.
	 */
	protected removeMouseEventListeners() : void
	{
		const canvas = this.canvas;
		const lm = this.#mouseListeners;

		lm.forEach ( ( handler, type ) =>
		{
			canvas.removeEventListener ( type, ( handler as EventListener ), false );
		} );

		lm.clear();
	}

	/**
	 * Remove keyboard event listeners.
	 */
	protected removeKeyboardEventListeners() : void
	{
		const lm = this.#keyboardListeners;

		lm.forEach ( ( handler, type ) =>
		{
			globalThis.removeEventListener ( type, ( handler as EventListener ), false );
		} );

		lm.clear();
	}

	/**
	 * Are we using keyboard input?
	 * @returns {boolean} True if we are using keyboard input, false if not.
	 */
	public get useKeyboardInput() : boolean
	{
		return hasBits ( this.flags, Viewer.Flags.USE_KEYBOARD_INPUT );
	}

	/**
	 * Set whether or not to use keyboard input.
	 * @param {boolean} use - True to use keyboard input, false to disable it.
	 */
	public set useKeyboardInput ( use: boolean )
	{
		this.flags = setBits ( this.flags, Viewer.Flags.USE_KEYBOARD_INPUT, use );
	}

	/**
	 * Add or replace a decorator.
	 * @param {Decorator} decorator - The decorator to add or replace.
	 */
	public setDecorator ( decorator: Decorator ) : void
	{
		this.#decorators.set ( decorator.type, decorator );
		decorator.viewer = this;
	}

	/**
	 * Get a decorator by type.
	 * @param {string} type - The type of the decorator.
	 * @returns {(Decorator | null)} The decorator or null if not found.
	 */
	public getDecorator ( type: string ) : ( Decorator | null )
	{
		return ( ( this.#decorators.get ( type ) ) ?? null );
	}

	/**
	 * Does the decorator exist?
	 * @param {string} type - The type of the decorator.
	 * @returns {boolean} True if the decorator exists, false if not.
	 */
	public hasDecorator ( type: string ) : boolean
	{
		return this.#decorators.has ( type );
	}

	/**
	 * Remove a decorator by type.
	 * @param {string} type - The type of the decorator to remove.
	 * @returns {boolean} True if the decorator was removed, false if it was not found.
	 */
	public removeDecorator ( type: string ) : boolean
	{
		// Look for the decorator.
		const decorator = this.getDecorator ( type );

		// If we don't have it then we're done.
		if ( !decorator )
		{
			return false;
		}

		// Tell the decorator that it no longer belongs to this viewer.
		decorator.viewer = null;

		// We assume this returns true.
		this.#decorators.delete ( type );

		// It worked.
		return true;
	}

	/**
	 * Clear all the decorators.
	 */
	public clearDecorators() : void
	{
		const keys = this.#decorators.keys();
		for ( const key of keys )
		{
			this.removeDecorator ( key );
		}
		this.#decorators.clear();
	}

	/**
	 * Loop through the decorators and call the given function.
	 * @param {IDecoratorCallback} cb - The callback function to call for each decorator.
	 */
	public forEachDecorator ( cb: IDecoratorCallback ) : void
	{
		const decorators = this.#decorators.values();
		for ( const decorator of decorators )
		{
			cb ( decorator );
		}
	}

	/**
	 * Set the default decorators.
	 */
	public setDefaultDecorators() : void
	{
		this.setDecorator ( new Grid() );
	}

	/**
	 * Get the view matrix.
	 * @returns {IMatrix44} The view matrix.
	 */
	public override get viewMatrix () : Readonly<IMatrix44>
	{
		return this.navBase.viewMatrix;
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
	 * Get the extra scene.
	 * @returns {Group} The extra scene.
	 */
	public get extraScene() : Group
	{
		return this.#branches.extra;
	}

	/**
	 * Get the fixed scene.
	 * @returns {Group} The fixed scene.
	 */
	public get fixedScene() : Group
	{
		return this.#branches.fixed;
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
	public get navBase() : NavBase
	{
		// Shortcut.
		let n = this.#navBase;

		// The first time we make it.
		if ( !n )
		{
			n = new Trackball();
			this.#navBase = n;
		}

		// Return the navigator.
		return n;
	}

	/**
	 * Set the navigator so that the sphere is completely within the view-volume.
	 * @param {object} input - The input.
	 * @param {Sphere} input.sphere - The sphere to view.
	 * @param {boolean} [input.resetRotation] - Whether or not to reset the rotation.
	 * @param {boolean} [input.animate] - Whether or not to animate the navigation.
	 */
	public viewSphere ( input: { sphere: Readonly<Sphere>, resetRotation?: boolean, animate?: boolean } ) : void
	{
		// Shortcuts.
		const { sphere, resetRotation, animate } = input;

		// If the animate option is not set then use the one from the options.
		const allowAnimations = ( animate ?? this.options.animations.allow );

		// If we are not animating then set it and return.
		if ( !allowAnimations )
		{
			// Have the navigator view the sphere.
			this.navBase.viewSphere ( { sphere, projection: this.projection, resetRotation } );

			// We're done.
			return;
		}

		// If we get to here then animate.

		// Get the current navigation state.
		const navState1 = this.navBase.getInternalState();

		// Have the navigator view the sphere.
		this.navBase.viewSphere ( { sphere, projection: this.projection, resetRotation } );

		// Get the new navigation state.
		const navState2 = this.navBase.getInternalState();

		// Return to the original state.
		this.navBase.setInternalState ( navState1 );

		// Set an animation function that blends between the two states.
		this.animations.nav.set ( `${this.type}.viewSphere()`, ( fraction: number ) : void =>
		{
			const newState = this.navBase.blend ( navState1, navState2, fraction );
			this.navBase.setInternalState ( newState );
			this.requestRender();
		} );

		// Start the animation and pass the duration in milliseconds.
		this.animations.nav.start ( this.options.duration.view_reset );
	}

	/**
	 * Set the navigator so that the model is completely within the view-volume.
	 * @param {object} [options] - The options.
	 * @param {boolean} [options.resetRotation] - Whether or not to reset the rotation.
	 * @param {boolean} [options.animate] - Whether or not to animate the navigation.
	 */
	public viewAll ( options?: { resetRotation?: boolean, animate?: boolean } ) : void
	{
		const sphere = this.modelScene?.bounds;
		if ( sphere )
		{
			const resetRotation = options?.resetRotation;
			const animate = options?.animate;
			this.viewSphere ( { sphere, resetRotation, animate } );
		}
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
		return ( handler ?? this.navBase );
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
	 * Make the command map key from the event.
	 * @param {IEvent} event - The event.
	 * @returns {string} The command map key.
	 */
	protected makeCommandMapKey ( event: IEvent ) : string
	{
		const { type, buttonsDown, keysDown } = event;
		return makeInputAsString ( type, Array.from ( buttonsDown ), Array.from ( keysDown ) );
	}

	/**
	 * Get the command from the event.
	 * @param {IEvent} event - The event.
	 * @returns {(ICommand | null)} The command or null if there is none.
	 */
	public getCommand ( event: IEvent ) : ( ICommand | null )
	{
		// Return early if no input because otherwise debugging is difficult.
		if ( DEVELOPER_BUILD )
		{
			const { type, keysDown, buttonsDown } = event;
			if ( ( "mouse_wheel" !== type ) && ( keysDown.size <= 0 ) && ( buttonsDown.size <= 0 ) )
			{
				return null;
			}
		}

		// Try to get the command name.
		const input = this.makeCommandMapKey ( event );
		const name = Viewer.#inputToCommand.get ( input );

		// Handle no command name.
		if ( !name )
		{
			return null;
		}

		// Get the command from the name.
		const command = Viewer.#commands.get ( name );

		// Return the command or null.
		return ( command ?? null );
	}

	/**
	 * Make the event.
	 * @param {IEventType} type - The event type.
	 * @param {MouseEvent | KeyboardEvent} [event] - The original event.
	 * @returns {IEvent} The event data.
	 */
	public makeEvent ( type: IEventType, event?: ( MouseEvent | KeyboardEvent ) ) : IEvent
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
	 * Get the client event listeners.
	 * @returns {Listeners} The client event listeners.
	 */
	public get clientListeners() : Listeners
	{
		return this.#clientListeners;
	}

	/**
	 * Handle the mouse down event.
	 * @param {MouseEvent} input - The mouse down event.
	 */
	public mouseDown ( input: MouseEvent ) : void
	{
		this.animations.nav.stop();

		input.preventDefault();
		const { button, offsetX, offsetY } = input;

		this.mouseButtonsDown.add ( button );

		this.mousePrevious = this.mouseCurrent;
		this.mouseCurrent = [ offsetX, offsetY ];

		this.mouseReleased = null;
		this.mousePressed = [ offsetX, offsetY ];

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_down", input );

		handler.handleEvent ( event );
		this.clientListeners.notify ( event );
	}

	/**
	 * Handle the mouse move event.
	 * @param {MouseEvent} input - The mouse move event.
	 */
	public mouseMove ( input: MouseEvent ) : void
	{
		input.preventDefault();
		const { buttons, offsetX, offsetY } = input;

		this.mousePrevious = this.mouseCurrent;
		this.mouseCurrent = [ offsetX, offsetY ];

		// If the distance is greater than the maximum allowed then do nothing.
		// This will (hopefully) prevent erroneous "jumps".
		if ( this.mousePrevious && this.mouseCurrent )
		{
			const d = vec2.distance ( this.mouseCurrent, this.mousePrevious );
			const mx = this.options.distance.mouse_move_max;
			if ( d > mx )
			{
				console.warn ( `Mouse move event ignored because distance ${d} > ${mx}` );
				return;
			}
		}

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_move", input );
		handler.handleEvent ( event );
		this.clientListeners.notify ( event );

		if ( buttons )
		{
			event.type = "mouse_drag"; // Use all the same event data.
			handler.handleEvent ( event );
			this.clientListeners.notify ( event );
		}
	}

	/**
	 * Handle mouse wheel event.
	 * @param {MouseEvent} input - The mouse wheel event.
	 */
	public mouseWheel ( input: MouseEvent ) : void
	{
		this.animations.nav.stop();
		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "mouse_wheel", input );
		handler.handleEvent ( event );
		this.clientListeners.notify ( event );
	}

	/**
	 * Handle the mouse up event.
	 * @param {MouseEvent} input - The mouse up event.
	 */
	public mouseUp ( input: MouseEvent ) : void
	{
		input.preventDefault();
		const { button, offsetX, offsetY } = input;

		this.mouseButtonsDown.delete ( button );

		// The previous mouse was already set in the mouse-move handler.
		// Setting it again here would make it the same as the current.
		this.mouseCurrent = [ offsetX, offsetY ];

		// Set the released point. The pressed point is unchanged.
		this.mouseReleased = [ offsetX, offsetY ];

		const handler = this.eventHandlerOrNavigator;

		// Always sent the mouse-up event.
		const event = this.makeEvent ( "mouse_up", input );
		handler.handleEvent ( event );
		this.clientListeners.notify ( event );

		// If there is a previous mouse coordinate...
		if ( this.mousePrevious )
		{
			// console.log ( "Mouse, current: ", this.mouseCurrent, ", previous: ", this.mousePrevious );

			// Send the mouse distance event.
			const distance = vec2.distance ( this.mouseCurrent, this.mousePrevious );
			const mouseEvent: IMouseDistanceEvent = { ...event,
				type: "mouse_distance",
				event: input,
				button: input.button,
				distance,
			};
			this.clientListeners.notify ( mouseEvent );
		}

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
		this.clientListeners.notify ( event );
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
		this.clientListeners.notify ( event );
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
		const { code } = input;
		this.keysDown.add ( code );

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "key_down", input );
		const result = handler.handleEvent ( event );
		this.clientListeners.notify ( event );
		this.maybePreventDefault ( event, result );
	}

	/**
	 * Handle the key up event.
	 * @param {KeyboardEvent} input - The key up event.
	 */
	public keyUp ( input: KeyboardEvent ) : void
	{
		const { code } = input;
		this.keysDown.delete ( code );

		const handler = this.eventHandlerOrNavigator;
		const event = this.makeEvent ( "key_up", input );
		const result = handler.handleEvent ( event );
		this.clientListeners.notify ( event );
		this.maybePreventDefault ( event, result );
	}

	/**
	 * Maybe prevent the default action for the event if it was handled.
	 * @param {IEvent} event - The event.
	 * @param {boolean} handled - Whether or not the event was handled.
	 */
	protected maybePreventDefault ( event: IEvent, handled: boolean ) : void
	{
		// If we handled the event then prevent other UI elements from responding
		// to this same event. This way a key that's probably not mapped to a
		// command, like F5, will still reload the page.
		if ( handled )
		{
			const { event: originalEvent } = event;
			if ( originalEvent )
			{
				originalEvent.preventDefault();
			}
		}
	}

	/**
	 * Make a line in model space under the screen point.
	 * @param {object} input - The input.
	 * @param {IVector2} input.screenPoint - The screen point.
	 * @param {IMatrix44} [input.viewMatrix] - The view matrix to use. If not provided, the viewer's view matrix is used.
	 * @returns {(Line | null)} The line under the screen point or null if there is none.
	 */
	public makeLine ( { screenPoint, viewMatrix }: { screenPoint: Readonly<IVector2>, viewMatrix?: Readonly<IMatrix44> } ) : ( Line | null )
	{
		// Shortcut.
		const { projMatrix, viewport } = this;

		// Use our view matrix if none was provided.
		const vm = ( viewMatrix ?? this.viewMatrix );

		// Get the line under the current mouse position.
		const line = makeLineUnderScreenPoint ( {
			screenPoint,
			viewMatrix: vm,
			projMatrix,
			viewport,
		} );

		// Return the line, which may be null.
		return line;
	}

	/**
	 * Get the navigation animation.
	 * @returns {IAnimations} The animations.
	 */
	public get animations() : IAnimations
	{
		return this.#animations;
	}

	/**
	 * Get the options.
	 * @returns {IViewerOptions} The options.
	 */
	public get options() : IViewerOptions
	{
		return this.#options;
	}

	/**
	 * Update the scene if its dirty. This gets called when the scene is
	 * rendered. It's public so that it can be called at other times, too.
	 */
	public override update ()
	{
		// Call this first.
		super.update();

		// Update the decorators.
		this.forEachDecorator ( ( decorator: Decorator ) =>
		{
			decorator.updateScene();
		} );
	}

	/**
	 * Render the scene.
	 */
	public override render() : void
	{
		// Set the transform from the navigator.
		this.#branches.nav.matrix = this.navBase.viewMatrix;

		// Notify the listeners.
		this.clientListeners.notify ( this.makeEvent ( "pre_render" ) );

		// Now call the base class.
		super.render();

		// Notify the listeners.
		this.clientListeners.notify ( this.makeEvent ( "post_render" ) );
	}
}
