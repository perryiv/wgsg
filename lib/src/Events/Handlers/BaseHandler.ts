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
	 * @param {MouseEvent} event - The mouse down event.
	 * @abstract
	 */
	public abstract mouseDown ( event: MouseEvent ) : void;

	/**
	 * Handle mouse move event.
	 * @param {MouseEvent} event - The mouse move event.
	 * @abstract
	 */
	public abstract mouseMove ( event: MouseEvent ) : void;

	/**
	 * Handle mouse up event.
	 * @param {MouseEvent} event - The mouse up event.
	 * @abstract
	 */
	public abstract mouseUp ( event: MouseEvent ) : void;
}
