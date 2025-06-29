
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
//
//	Input for the sphere constructor.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISphereInput
{
	center?: IVector3;
	radius?: number;
	state?: State;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Sphere class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Sphere extends Geometry
{
	#center: IVector3 = [ 0, 0, 0 ];
	#radius = 1.0;

	/**
	 * Construct the class.
	 * @class
	 * @param {ISphereInput} input - Input for the sphere.
	 * @param {State} [input.state] - The state of the sphere.
	 * @param {IVector3} [input.center] - Center of the sphere.
	 * @param {number} [input.radius] - Radius of the sphere.
	 */
	constructor ( input?: ISphereInput )
	{
		super ( input?.state ?? null );

		if ( input )
		{
			const { center, radius } = input;
			if ( center )
			{
				this.center = center;
			}

			// Make undefined, null, and zero set a radius of zero.
			// Other numbers are set as is.
			this.radius = ( radius ? radius : 0 );
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
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
		this.#radius = radius; // We permit negative and zero radii.
	}

	/**
	 * Update this node.
	 */
	public override update() : void
	{
		console.log ( `Updating ${this.type} ${this.id}` );
	}
}
