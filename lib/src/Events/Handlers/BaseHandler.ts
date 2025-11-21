///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all viewer event handlers.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../../Base";
import { discardEvent } from "../../Tools";
import type { IKeyboardEvent, IMouseEvent } from "../../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all viewer event handlers.
 * @abstract
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class BaseHandler extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	protected constructor ()
	{
		super();
	}

	/**
	 * Handle mouse down event.
	 * @param {IMouseEvent} event - The mouse down event.
	 */
	public mouseDown ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse move event.
	 * @param {IMouseEvent} event - The mouse move event.
	 */
	public mouseMove ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse drag event.
	 * @param {IMouseEvent} event - The mouse drag event.
	 */
	public mouseDrag ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse up event.
	 * @param {IMouseEvent} event - The mouse up event.
	 */
	public mouseUp ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse out event.
	 * @param {IMouseEvent} event - The mouse out event.
	 */
	public mouseOut ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse in event.
	 * @param {IMouseEvent} event - The mouse in event.
	 */
	public mouseIn ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle mouse context menu event.
	 * @param {IMouseEvent} event - The mouse context menu event.
	 */
	public mouseContextMenu ( event: IMouseEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle key down event.
	 * @param {IKeyboardEvent} event - The key down event.
	 */
	public keyDown ( event: IKeyboardEvent ) : void
	{
		discardEvent ( event );
	}

	/**
	 * Handle key up event.
	 * @param {IKeyboardEvent} event - The key up event.
	 */
	public keyUp ( event: IKeyboardEvent ) : void
	{
		discardEvent ( event );
	}
}
