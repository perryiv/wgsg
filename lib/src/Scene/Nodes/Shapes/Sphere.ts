
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Sphere geometry class.
//
///////////////////////////////////////////////////////////////////////////////

import { Geometry } from "./Geometry";
import { State } from "../../State";
import type { IVector3 } from "../../../Types";
import { vec3 } from "gl-matrix";


///////////////////////////////////////////////////////////////////////////////
/**
 * General class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Sphere extends Geometry
{
	#center: IVector3 = [ 0, 0, 0 ];
	#radius = 1

	/**
	 * Construct the class.
	 * @class
	 * @param {State | null} state - Optional state for this geometry.
	 */
	constructor ( state?: ( State | null ) )
	{
		super ( state );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Scene.Nodes.Shapes.Sphere";
	}

	/**
	 * Get the center.
	 * @returns {IVector3} Center of the sphere.
	 */
	public get center() : IVector3
	{
		return [ ...this.#center ];
	}

	/**
	 * Set the center.
	 * @param {IVector3} center - Center of the sphere.
	 */
	public set center ( center: IVector3 )
	{
		vec3.copy ( this.#center, center );
	}

	/**
	 * Get the radius.
	 * @returns {number} Radius of the sphere.
	 */
	public get radius() : number
	{
		return this.#radius;
	}

	/**
	 * Set the radius.
	 * @param {number} radius - Radius of the sphere.
	 */
	public set radius ( radius: number )
	{
		this.#radius = radius;
	}
}
