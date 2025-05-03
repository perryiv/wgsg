///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Perspective projection class.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "../Tools";
import { Matrix44 } from "../Types";
import { Projection } from "./Projection";


///////////////////////////////////////////////////////////////////////////////
/**
 * Perspective projection class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Perspective extends Projection
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
		return "Perspective";
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
