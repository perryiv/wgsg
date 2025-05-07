///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base visitor class.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base/Base";
import { Group, Node, Shape, Transform } from "../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Visitor extends Base
{
	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor()
	{
		// Call this first.
		super();
	}

	/**
	 * Visit the group.
	 */
	public visitGroup ( group: Group ) : void
	{
		group.forEachChild ( ( child: Node ) =>
		{
			child.accept ( this );
		} );
	}

	/**
	 * Visit the transform.
	 */
	public visitTransform ( transform: Transform ) : void
	{
		this.visitGroup ( transform );
	}

	/* eslint-disable @typescript-eslint/no-empty-function */
	/* eslint-disable @typescript-eslint/no-unused-vars */

	/**
	 * Overload as needed.
	 */
	public visitNode ( _: Node ) : void	{}
	public visitShape ( _: Shape ) : void	{}
}
