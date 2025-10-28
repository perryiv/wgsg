///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Contains the state and everything that gets rendered with it.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Shape } from "../Scene/Nodes/Shapes/Shape";
import { State } from "../Scene";
import type { IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for the state and everything that gets rendered with it.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class StateGroup extends BaseClass
{
	#state: State;
	#shapes: Shape[] = [];

	/**
	 * Construct the class.
	 * @class
	 * @param {State} state - The state.
	 */
	constructor ( state: State )
	{
		super();
		this.#state = state;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.StateGroup";
	}

	/**
	 * Get the state.
	 * @returns {State} The state.
	 */
	public get state() : State
	{
		return this.#state;
	}


	/**
	 * Add the shape to the state group.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {Shape} shape - The shape to add.
	 */
	public addShape ( info: IRenderGraphInfo, shape: Shape )
	{
		this.#shapes.push ( shape );
		info.numShapes++;
	}

	/**
	 * Call the given function for each shape.
	 * @param {Function} func - The function to call.
	 */
	public forEachShape ( func: ( shape: Shape, index: number ) => void )
	{
		this.#shapes.forEach ( func );
	}

	/**
	 * Get the number of shapes.
	 * @returns {number} The number of shapes.
	 */
	public get numShapes() : number
	{
		return this.#shapes.length;
	}
}
