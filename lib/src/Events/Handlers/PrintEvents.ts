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
import type { IMouseData } from "../../Types";


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
	public getClassName () : string
	{
		return "Viewers.EventHandlers.PrintEvents";
	}

	/**
	 * Handle mouse down event.
	 * @param {IMouseData} data - The mouse down data.
	 */
	public override mouseDown ( data: IMouseData ) : void
	{
		console.log ( "Mouse down:", data );
	}

	/**
	 * Handle mouse move event.
	 * @param {IMouseData} data - The mouse move data.
	 */
	public override mouseMove ( data: IMouseData ) : void
	{
		console.log ( "Mouse move:", data );
	}

	/**
	 * Handle mouse up event.
	 * @param {IMouseData} data - The mouse up data.
	 */
	public override mouseUp ( data: IMouseData ) : void
	{
		console.log ( "Mouse up:", data );
	}
}
