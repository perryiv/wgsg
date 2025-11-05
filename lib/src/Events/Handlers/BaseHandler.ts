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
import { IMouseEvent } from "../../Types";


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
	}

	/**
	 * Handle mouse move event.
	 * @param {IMouseEvent} event - The mouse move event.
	 */
	public mouseMove ( event: IMouseEvent ) : void
	{
	}

	/**
	 * Handle mouse drag event.
	 * @param {IMouseEvent} event - The mouse drag event.
	 */
	public mouseDrag ( event: IMouseEvent ) : void
	{
	}

	/**
	 * Handle mouse up event.
	 * @param {IMouseEvent} event - The mouse up event.
	 */
	public mouseUp ( event: IMouseEvent ) : void
	{
	}

	/**
	 * Handle mouse out event.
	 * @param {IMouseEvent} event - The mouse out event.
	 */
	public mouseOut ( event: IMouseEvent ) : void
	{
	}

	/**
	 * Handle mouse in event.
	 * @param {IMouseEvent} event - The mouse in event.
	 */
	public mouseIn ( event: IMouseEvent ) : void
	{
	}

	/**
	 * Handle mouse context menu event.
	 * @param {IMouseEvent} event - The mouse context menu event.
	 */
	public mouseContextMenu ( event: IMouseEvent ) : void
	{
	}
}
