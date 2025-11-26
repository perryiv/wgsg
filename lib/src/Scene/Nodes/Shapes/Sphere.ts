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

import { Array1 } from "../../../Arrays";
import { Geometry as BaseClass } from "./Geometry";
import { Indexed } from "../../Primitives";
import { vec3 } from "gl-matrix";
import type { INodeConstructorInput } from "../Node";
import type { IVector3 } from "../../../Types";
import {
	estimateSphereSizes,
	generateUnitSphere
} from "../../../Algorithms";


///////////////////////////////////////////////////////////////////////////////
//
//	Input for the sphere constructor.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISphereInput extends INodeConstructorInput
{
	center?: IVector3;
	radius?: number;
	numSubdivisions?: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Sphere class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Sphere extends BaseClass
{
	#center: IVector3 = [ 0, 0, 0 ];
	#radius = 1.0;
	#numSubdivisions = 2;

	/**
	 * Construct the class.
	 * @class
	 * @param {ISphereInput} input - Input for the sphere.
	 * @param {IVector3} [input.center] - Center of the sphere.
	 * @param {number} [input.radius] - Radius of the sphere.
	 * @param {number} [input.numSubdivisions] - Number of subdivisions for the sphere.
	 */
	constructor ( input?: Readonly<ISphereInput> )
	{
		super ( input );

		// Get the input.
		if ( input )
		{
			// Get the input's properties.
			const { center, radius, numSubdivisions } = input;

			// If we have a valid center then set it.
			if ( center )
			{
				this.center = [ center[0], center[1], center[2] ];
			}

			// If we have a valid radius then set it.
			if ( "undefined" !== typeof radius )
			{
				this.radius = radius;
			}

			// If we have a valid number of subdivisions then set it.
			if ( "undefined" !== typeof numSubdivisions )
			{
				this.numSubdivisions = numSubdivisions;
			}
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
	public set center ( center: Readonly<IVector3> )
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
	public set radius ( radius: Readonly<number> )
	{
		if ( false === Number.isFinite ( radius ) )
		{
			throw new Error ( "Sphere radius has to be a finite number" );
		}

		// Note: We permit negative and zero radii.
		this.#radius = radius;
	}

	/**
	 * Get the number of subdivisions.
	 * @returns {number} Number of subdivisions.
	 */
	public get numSubdivisions() : number
	{
		return this.#numSubdivisions;
	}

	/**
	 * Set the number of subdivisions.
	 * @param {number} num - Number of subdivisions.
	 */
	public set numSubdivisions ( num: Readonly<number> )
	{
		if ( false === Number.isFinite ( num ) )
		{
			throw new Error ( "Number of sphere subdivisions has to be a finite number" );
		}

		if ( num < 0 )
		{
			throw new Error ( "Number of sphere subdivisions has to be >= 0" );
		}

		this.#numSubdivisions = num;
	}

	/**
	 * Update this node.
	 */
	public override update() : void
	{
		// Do nothing if we're not dirty.
		if ( false === this.dirty )
		{
			return;
		}

		// If we get to here then rebuild the geometry.

		// Determine how big the arrays need to be.
		const ns = this.numSubdivisions;
		const { numPoints, numIndices } = estimateSphereSizes ( ns );

		// Make the arrays.
		const indices = new Uint32Array ( numIndices );
		const points  = new Float32Array ( numPoints * 3 );
		const normals = new Float32Array ( numPoints * 3 );

		// Shortcuts.
		const [ cx, cy, cz ] = this.center;
		const r = this.radius;

		// Initialize the point and index count.
		let tc = 0; // Triangle count.
		let pc = 0; // Point count.
		let ic = 0; // Index count.
		let ix = 0; // For speed.
		let iy = 0;
		let iz = 0;

		// Make the points on the sphere.
		generateUnitSphere ( ns, (
			x1: Readonly<number>, y1: Readonly<number>, z1: Readonly<number>,
			x2: Readonly<number>, y2: Readonly<number>, z2: Readonly<number>,
			x3: Readonly<number>, y3: Readonly<number>, z3: Readonly<number>,
			i1: Readonly<number>, i2: Readonly<number>, i3: Readonly<number> ) =>
		{
			pc = tc * 3;
			ix = pc + 0;
			iy = pc + 1;
			iz = pc + 2;
			points [ix] = cx + ( x1 * r );
			points [iy] = cy + ( y1 * r );
			points [iz] = cz + ( z1 * r );
			normals[ix] = x1;
			normals[iy] = y1;
			normals[iz] = z1;
			++tc;

			pc = tc * 3;
			ix = pc + 0;
			iy = pc + 1;
			iz = pc + 2;
			points [ix] = cx + ( x2 * r );
			points [iy] = cy + ( y2 * r );
			points [iz] = cz + ( z2 * r );
			normals[ix] = x2;
			normals[iy] = y2;
			normals[iz] = z2;
			++tc;

			pc = tc * 3;
			ix = pc + 0;
			iy = pc + 1;
			iz = pc + 2;
			points [ix] = cx + ( x3 * r );
			points [iy] = cy + ( y3 * r );
			points [iz] = cz + ( z3 * r );
			normals[ix] = x3;
			normals[iy] = y3;
			normals[iz] = z3;
			++tc;

			indices[ic++] = i1;
			indices[ic++] = i2;
			indices[ic++] = i3;
		} );

		// Set the new arrays.
		this.points = new Array1 ( points );
		this.normals = new Array1 ( normals );

		// Set the primitive list.
		this.primitives = new Indexed ( { mode: "triangle-list", indices } );

		// The bounds is now dirty.
		this.setBoundingBox ( null );

		// Call the base class's function.
		super.update();

		// We are no longer dirty.
		this.dirty = false;
	}
}
