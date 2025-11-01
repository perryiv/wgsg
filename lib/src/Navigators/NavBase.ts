///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base navigator class.
//
///////////////////////////////////////////////////////////////////////////////

import { BaseHandler as BaseClass } from "../Events/Handlers/BaseHandler";
import { Node } from "../Scene";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base navigator class.
 * @abstract
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class NavBase extends BaseClass
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
	 * Get the model matrix.
	 * @returns The model matrix.
	 */
	public abstract get matrix () : IMatrix44;

	/**
	 * Reset the navigator to its default state.
	 */
	public abstract reset() : void;

	/**
	 * Set the navigator so that the model is completely within the view-volume.
	 * If the given model is null then reset the navigator to its default state.
	 * @param {Node | null} model - The model node.
	 */
	public abstract viewAll ( model: Node | null ) : void;
}
