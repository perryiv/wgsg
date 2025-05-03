///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Orthographic projection class.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "../Tools";
import { Matrix44 } from "../Types";
import { Projection } from "./Projection";


///////////////////////////////////////////////////////////////////////////////
/**
 * Orthographic projection class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Orthographic extends Projection
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
		return "Orthographic";
	}

	/**
	 * Return the projection matrix.
	 * @return {Matrix44} The projection matrix.
	 */
	public get matrix() : Matrix44
	{
		return IDENTITY_MATRIX;
	}
}
