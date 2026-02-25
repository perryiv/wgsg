///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Collection of event listeners.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import type {
	IEvent,
	IEventType,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IEventListener = ( ( event: IEvent ) => void );
export type IEventListenerMap = Map < IEventType, IEventListener[] >;


///////////////////////////////////////////////////////////////////////////////
/**
 * A collection of event listeners.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Listeners extends BaseClass
{
	#eventListeners: IEventListenerMap = new Map < IEventType, IEventListener[] > ();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		// Clear the event listeners.
		this.clear();

		// Call the base class function.
		super.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Events.Listeners";
	}

	/**
	 * Clear the event listeners.
	 */
	public clear() : void
	{
		// Clear the event listeners.
		this.#eventListeners.clear();
	}

	/**
	 * Notify all the listeners of the event.
	 * @param {IEvent} event - The event.
	 */
	public notify ( event: IEvent ) : void
	{
		// Get the listeners for the event type.
		const { type } = event;
		let listeners = this.#eventListeners.get ( type );

		// Handle no listeners.
		if ( !listeners )
		{
			return;
		}

		// Make a copy of the listeners in case they get modified while iterating.
		listeners = [ ...listeners ];

		// Loop through the listeners and call them with the event.
		for ( const listener of listeners )
		{
			listener ( event );
		}
	}

	/**
	 * Add a listener for the given event type.
	 * @param {IEventType} type - The event type.
	 * @param {IEventListener} listener - The event listener.
	 */
	public add ( type: IEventType, listener: IEventListener ) : void
	{
		const listeners = this.get ( type );
		listeners.push ( listener );
	}

	/**
	 * Add listeners for the given event type that gets called only once.
	 * @param {IEventType} type - The event type.
	 * @param {IEventListener} listener - The event listener.
	 */
	public once ( type: IEventType, listener: IEventListener ) : void
	{
		const oneTimeListener = ( event: IEvent ) =>
		{
			this.remove ( type, oneTimeListener );
			listener ( event );
		}
		this.add ( type, oneTimeListener );
	}

	/**
	 * Remove a listener for the given event type.
	 * @param {IEventType} type - The event type.
	 * @param {IEventListener} listener - The event listener.
	 */
	public remove ( type: IEventType, listener: IEventListener ) : void
	{
		const listeners = this.#eventListeners.get ( type );

		if ( !listeners )
		{
			return;
		}

		const index = listeners.indexOf ( listener );

		if ( index >= 0 )
		{
			listeners.splice ( index, 1 );
		}
	}

	/**
	 * Remove all listeners for the given event type.
	 * @param {IEventType} type - The event type.
	 */
	public removeAll ( type: IEventType ) : void
	{
		this.#eventListeners.delete ( type );
	}

	/**
	 * Do listeners of the given type exist?
	 * This will not create any new arrays.
	 * @param {IEventType} type - The event type.
	 * @returns {boolean} True if listeners exist, false otherwise.
	 */
	public has ( type: IEventType ) : boolean
	{
		return this.#eventListeners.has ( type );
	}

	/**
	 * Get the event listeners for the given type.
	 * This could create a new, empty array of listeners.
	 * @param {IEventType} type - The event type.
	 * @returns {IEventListener[]} The event listeners.
	 */
	public get ( type: IEventType ) : IEventListener[]
	{
		let listeners = this.#eventListeners.get ( type );

		if ( !listeners )
		{
			listeners = [];
			this.#eventListeners.set ( type, listeners );
		}

		return listeners;
	}
}
