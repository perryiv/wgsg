///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Cull visitor class.
//
///////////////////////////////////////////////////////////////////////////////

import { Group, Node, Shape, Transform } from "../Scene";
import { Multiply } from "./Multiply";


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Cull extends Multiply
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
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Cull";
	}

	/**
	 * Visit these node types.
	 */
	public visitTransform ( tr: Transform ) : void
	{
		super.visitTransform ( tr );
	}
	public visitGroup ( group: Group ) : void
	{
		super.visitGroup ( group );
	}
	public visitNode ( node: Node ) : void
	{
		super.visitNode ( node );
	}
	public visitShape ( shape: Shape ) : void
	{
		super.visitShape ( shape );
	}
}
