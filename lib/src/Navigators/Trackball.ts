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

import { NavBase as BaseClass } from "./NavBase";


///////////////////////////////////////////////////////////////////////////////
/**
 * Viewer event handler that prints the events.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Trackball extends BaseClass
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
		return "Navigators.Trackball";
	}

	/**
	 * Handle mouse down event.
	 * @param {MouseEvent} event - The mouse down event.
	 */
	public override mouseDown ( event: MouseEvent ) : void
	{
		console.log ( "Mouse down:", event );
	}

	/**
	 * Handle mouse move event.
	 * @param {MouseEvent} event - The mouse move event.
	 */
	public override mouseMove ( event: MouseEvent ) : void
	{
		console.log ( "Mouse move:", event );
	}

	/**
	 * Handle mouse up event.
	 * @param {MouseEvent} event - The mouse up event.
	 */
	public override mouseUp ( event: MouseEvent ) : void
	{
		console.log ( "Mouse up:", event );
	}
}
