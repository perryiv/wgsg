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
import { IMouseData } from "../../Types";


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
	 * Handle mouse down data.
	 * @param {IMouseData} data - The mouse down data.
	 */
	public mouseDown ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse move data.
	 * @param {IMouseData} data - The mouse move data.
	 */
	public mouseMove ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse drag data.
	 * @param {IMouseData} data - The mouse drag data.
	 */
	public mouseDrag ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse up data.
	 * @param {IMouseData} data - The mouse up data.
	 */
	public mouseUp ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse out data.
	 * @param {IMouseData} data - The mouse out data.
	 */
	public mouseOut ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse in data.
	 * @param {IMouseData} data - The mouse in data.
	 */
	public mouseIn ( data: IMouseData ) : void
	{
	}

	/**
	 * Handle mouse context menu data.
	 * @param {IMouseData} data - The mouse context menu data.
	 */
	public mouseContextMenu ( data: IMouseData ) : void
	{
	}
}
