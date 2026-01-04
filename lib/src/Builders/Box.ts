///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for one or more boxes.
//
///////////////////////////////////////////////////////////////////////////////

import { makeSolidColorState } from "./State";
import { Multiply as BaseClass } from "../Visitors";
import { SolidColor } from "../Shaders";
import { vec3, vec4 } from "gl-matrix";
import type { IVector3, IVector4 } from "../Types";
import {
	Geometry,
	Group,
	Indexed,
	Node as SceneNode
} from "../Scene";
import { IDENTITY_MATRIX } from "../Tools";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IBoxBuilderTopologyInput
{
	color?: IVector4;
	topology?: GPUPrimitiveTopology;
}

export interface IBoxBuilderInput1 extends IBoxBuilderTopologyInput
{
	center: IVector3;
	size: IVector3;
}

export interface IBoxBuilderInput2 extends IBoxBuilderTopologyInput
{
	min: IVector3;
	max: IVector3;
}

export type IBoxBuilderInput = ( IBoxBuilderInput1 | IBoxBuilderInput2 )


///////////////////////////////////////////////////////////////////////////////
//
//	Get the input.
//
///////////////////////////////////////////////////////////////////////////////

const getInput = ( mn: IVector3, mx: IVector3, input: IBoxBuilderInput ) : void =>
{
	if ( ( "center" in input ) && ( "size" in input ) )
	{
		const { center: c, size: s } = input;

		const hx = s[0] * 0.5;
		const hy = s[1] * 0.5;
		const hz = s[2] * 0.5;

		mn[0] = c[0] - hx;
		mn[1] = c[1] - hy;
		mn[2] = c[2] - hz;

		mx[0] = c[0] + hx;
		mx[1] = c[1] + hy;
		mx[2] = c[2] + hz;
	}

	else if ( "min" in input && "max" in input )
	{
		const { min: imn, max: imx } = input;

		mn[0] = imn[0];
		mn[1] = imn[1];
		mn[2] = imn[2];

		mx[0] = imx[0];
		mx[1] = imx[1];
		mx[2] = imx[2];
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Build a box.
 * @param {IBoxBuilderInput} [input] - Input for building the box.
 * @returns {Geometry} The built box geometry.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildBox = ( input?: IBoxBuilderInput ) : Geometry =>
{
	// Initialize.
	const mn: IVector3 = [ -1, -1, -1 ];
	const mx: IVector3 = [ 1, 1, 1 ];

	// Get the input if we should.
	if ( input )
	{
		getInput ( mn, mx, input );
	}

	// Make the corner points.
	const points = [
		mn[0], mn[1], mn[2],
		mx[0], mn[1], mn[2],
		mn[0], mx[1], mn[2],
		mx[0], mx[1], mn[2],
		mn[0], mn[1], mx[2],
		mx[0], mn[1], mx[2],
		mn[0], mx[1], mx[2],
		mx[0], mx[1], mx[2],
	];

	// Get the topology.
	const topology: GPUPrimitiveTopology = ( ( input?.topology ) ?? "triangle-list" );

	// Make the indices based on the topology.
	let indices: ( Uint16Array | null ) = null;
	switch ( topology )
	{
		case "line-list":
		{
			indices = new Uint16Array ( [
				0, 1, 1, 3, 3, 2, 2, 0, // Every two numbers are a line segment.
				0, 4, 1, 5, 3, 7, 2, 6,
				4, 5, 5, 7, 7, 6, 6, 4
			] );
			break;
		}
		case "triangle-list":
		{
			indices = new Uint16Array ( [
				0, 1, 2, 1, 3, 2, // Every three numbers are a triangle.
				4, 6, 5, 5, 6, 7,
				0, 2, 4, 4, 2, 6,
				1, 5, 3, 3, 5, 7,
				2, 3, 6, 6, 3, 7,
				0, 4, 1, 1, 4, 5
			] );
			break;
		}
	}

	// Handle unsupported topology.
	if ( !indices )
	{
		throw new Error ( `Unsupported topology '${topology}' when building box` );
	}

	// Make the primitives.
	const primitives = new Indexed ( { topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( input?.color )
	{
		geom.state = makeSolidColorState ( { color: input.color, topology } );
	}

	// Return the new geometry.
	return geom;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Local visitor class that builds bounding boxes.
//
///////////////////////////////////////////////////////////////////////////////

class BuildBoxes extends BaseClass
{
	#indices: number[] = [];
	#points: number[] = [];
	#colors: number[] = [];
	#geom: ( Geometry | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Builders.Box.BuildBoxes";
	}

	/**
	 * Reset the builder.
	 */
	public reset() : void
	{
		this.#indices = [];
		this.#points = [];
		this.#colors = [];
		this.#geom = null;
	}

	/**
	 * Get the built geometry.
	 * @returns {Geometry} The built geometry.
	 */
	public get geometry() : Geometry
	{
		// If we don't have the geometry yet then make it.
		if ( !this.#geom )
		{
			// Make the necessary arrays.
			const indices = new Uint32Array ( this.#indices );
			const points = new Float32Array ( this.#points );
			const colors = new Float32Array ( this.#colors );

			// Make the primitives.
			const primitives = new Indexed ( { topology: "line-list", indices } );

			// Make the geometry.
			const geom = new Geometry ( { points, colors, primitives } );

			// Add a state.
			geom.state = makeSolidColorState ( { color: [ 0.5, 0.5, 0.5, 1 ], topology: "line-list" } );

			// Save for next time.
			this.#geom = geom;
		}

		// Return the geometry.
		return this.#geom;
	}

	/**
	 * Add the box.
	 * @param {SceneNode} node - The scene node.
	 */
	protected addBox ( node: SceneNode ) : void
	{
		// Get the bounding box in local space.
		const box = geom.getBoundingBox();

		// Handle invalid box
		if ( false === box.valid )
		{
			return;
		}

		// You need the bounding boxes in local space because you transform the
		// corner points here to top-level model space. However, when
		// you get a bounding box from a transform node, it gets transformed.

		// Shortcuts.
		const viewMatrix = this.viewMatrix;
		const corners = { ...box.corners };

		// Transform the corner points.
		const { llb, llf, lrb, lrf, ulb, ulf, urb, urf } = corners;
		vec3.transformMat4 ( llb as IVector3, llb, viewMatrix );
		vec3.transformMat4 ( llf as IVector3, llf, viewMatrix );
		vec3.transformMat4 ( lrb as IVector3, lrb, viewMatrix );
		vec3.transformMat4 ( lrf as IVector3, lrf, viewMatrix );
		vec3.transformMat4 ( ulb as IVector3, ulb, viewMatrix );
		vec3.transformMat4 ( ulf as IVector3, ulf, viewMatrix );
		vec3.transformMat4 ( urb as IVector3, urb, viewMatrix );
		vec3.transformMat4 ( urf as IVector3, urf, viewMatrix );

		// Shortcuts.
		const points = this.#points;
		const colors = this.#colors;
		const indices = this.#indices;

		// Add indices to connect the new box corners with line segments.
		const base = ( points.length / 3 );
		indices.push (
			base + 0, base + 1,
			base + 1, base + 3,
			base + 3, base + 2,
			base + 2, base + 0,
			base + 0, base + 4,
			base + 1, base + 5,
			base + 3, base + 7,
			base + 2, base + 6,
			base + 4, base + 5,
			base + 5, base + 7,
			base + 7, base + 6,
			base + 6, base + 4,
		);

		// Append the box corners to the array of points.
		points.push (
			llb[0], llb[1], llb[2],
			llf[0], llf[1], llf[2],
			lrb[0], lrb[1], lrb[2],
			lrf[0], lrf[1], lrf[2],
			ulb[0], ulb[1], ulb[2],
			ulf[0], ulf[1], ulf[2],
			urb[0], urb[1], urb[2],
			urf[0], urf[1], urf[2],
		);

		// Initialize the color.
		const c: IVector4 = [ 0.5, 0.5, 0.5, 1 ];

		// Try to get the color.
		const state = node.state;
		if ( state )
		{
			const shader = state.shader;
			if ( shader instanceof SolidColor )
			{
				vec4.copy ( c, shader.color );
			}
		}

		// Append a color for each new point.
		colors.push (
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
			c[0], c[1], c[2], c[3],
		);
	}

	/**
	 * Visit the geometry node.
	 * @param {Geometry} geom - The geometry node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		this.addBox ( geom );
		super.visitGeometry ( geom );
	}

	/**
	 * Visit the group node.
	 * @param {Group} group - The group node.
	 */
	public override visitGroup ( group: Group ) : void
	{
		this.addBox ( group );
		super.visitGroup ( group );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Build a geometry for the bounding boxes of the given scene.
 * @param {SceneNode} scene - The scene to build the bounding boxes for.
 * @returns {Geometry} The built bounding box geometry.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildBoundingBoxes = ( scene: SceneNode ) : Geometry =>
{
	// Visit the scene.
	const visitor = new BuildBoxes();
	scene.accept ( visitor );

	// Return the geometry.
	return visitor.geometry;
}
