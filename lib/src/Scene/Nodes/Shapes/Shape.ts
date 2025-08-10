///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for all shapes.
//
///////////////////////////////////////////////////////////////////////////////

import {
	Node,
	type INodeConstructorInput,
	type INodeTraverseCallback,
} from "../Node";


///////////////////////////////////////////////////////////////////////////////
/**
 * Shape class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Shape extends Node
{
	/**
	 * Construct the class.
	 * @class
	 * @param {INodeConstructorInput} [input] - The input for the node.
	 */
	constructor ( input?: INodeConstructorInput )
	{
		super ( input );
	}

	/**
	 * Traverse this node.
	 * @param {INodeTraverseCallback} cb - Callback function.
	 */
	public override traverse ( cb: INodeTraverseCallback ) : void
	{
		cb ( this );
	}

	/**
	 * Update the shape.
	 */
	public abstract update() : void;
}
