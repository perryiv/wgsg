///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Viewer event handler that prints the events.
//
///////////////////////////////////////////////////////////////////////////////


import { BaseHandler as BaseClass } from "./BaseHandler";
import type { IEvent } from "../../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Viewer event handler that prints the events.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class PrintEvents extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName () : string
	{
		return "Viewers.EventHandlers.PrintEvents";
	}

	/**
	 * Handle the event.
	 * @param {IEvent} event - The event.
	 */
	public override handleEvent ( event: IEvent ) : void
	{
		console.log ( "Event:", event );
	}
}
