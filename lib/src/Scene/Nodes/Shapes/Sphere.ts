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

import { Array1, Array3 } from "../../../Arrays";
import { Geometry } from "./Geometry";
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

export class Sphere extends Geometry
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
		const points = new Float32Array ( numPoints * 3 );
		const normals = new Float32Array ( numPoints * 3 );

		// Shortcuts.
		const [ cx, cy, cz ] = this.center;
		const r = this.radius;
		const pw = new Array3 ( points );
		const nw = new Array3 ( normals );
		const px = pw.x0;
		const py = pw.x1;
		const pz = pw.x2;
		const nx = nw.x0;
		const ny = nw.x1;
		const nz = nw.x2;

		// Initialize the point and index count.
		let pc = 0;
		let ic = 0;

		// Make the points on the sphere.
		generateUnitSphere ( ns, (
			x1: Readonly < number >, y1: Readonly < number >, z1: Readonly < number >,
			x2: Readonly < number >, y2: Readonly < number >, z2: Readonly < number >,
			x3: Readonly < number >, y3: Readonly < number >, z3: Readonly < number >,
			i1: Readonly < number >, i2: Readonly < number >, i3: Readonly < number > ) =>
		{
			px[pc] = cx + ( x1 * r );
			py[pc] = cy + ( y1 * r );
			pz[pc] = cz + ( z1 * r );
			nx[pc] = x1;
			ny[pc] = y1;
			nz[pc] = z1;
			++pc;

			px[pc] = cx + ( x2 * r );
			py[pc] = cy + ( y2 * r );
			pz[pc] = cz + ( z2 * r );
			nx[pc] = x2;
			ny[pc] = y2;
			nz[pc] = z2;
			++pc;

			px[pc] = cx + ( x3 * r );
			py[pc] = cy + ( y3 * r );
			pz[pc] = cz + ( z3 * r );
			nx[pc] = x3;
			ny[pc] = y3;
			nz[pc] = z3;
			++pc;

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
		this.setBounds ( null );

		// Call the base class's function.
		super.update();
	}
}
