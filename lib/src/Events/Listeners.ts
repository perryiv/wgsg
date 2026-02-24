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
		const { type } = event;
		const listeners = this.#eventListeners.get ( type );

		if ( !listeners )
		{
			return;
		}

		for ( const listener of listeners )
		{
			listener ( event );
		}
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
