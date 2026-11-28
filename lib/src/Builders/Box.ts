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

import { Box } from "../Math";
import { Color as ColorTool } from "../Math/Color";
import { Multiply as BaseClass } from "../Visitors";
import { SolidColor } from "../Shaders";
import type { IVector3, IVector4 } from "../Types";
import {
	ColorAttribute,
	Geometry,
	Group,
	Indexed,
	Material,
	Node as SceneNode,
	State,
	Transform,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

type IBoxMap = Map < number, Readonly<Box> >;

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
				0, 2, 1, 1, 2, 3, // Every three numbers are a triangle, counter-
				4, 5, 6, 5, 7, 6, // clockwise when seen from outside the box.
				0, 4, 2, 4, 6, 2,
				1, 3, 5, 3, 7, 5,
				2, 6, 3, 6, 7, 3,
				0, 1, 4, 1, 5, 4
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
		const state = SolidColor.makeState ( { topology } );
		state.addAttribute ( new ColorAttribute ( input.color ) );
		geom.state = state;
	}

	// Return the new geometry.
	return geom;
}


///////////////////////////////////////////////////////////////////////////////
//
//	The colors of the bounding boxes, if given.
//
///////////////////////////////////////////////////////////////////////////////

export interface IBoundingBoxesInput
{
	shapeColor?: Readonly<IVector4>;
	groupColor?: Readonly<IVector4>;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the color of the state: its material's diffuse color, or else its
 * color attribute's, or gray if it has neither, or if there is no state.
 * @param {State | null} state - The state, if any.
 * @returns {IVector4} The color.
 */
///////////////////////////////////////////////////////////////////////////////

const getStateColor = ( state: ( Readonly<State> | null ) ) : Readonly<IVector4> =>
{
	const material = state?.getAttribute ( Material.getClassName() );
	if ( material instanceof Material )
	{
		return material.diffuse;
	}
	const color = state?.getAttribute ( ColorAttribute.getClassName() );
	if ( color instanceof ColorAttribute )
	{
		return color.color;
	}
	return ColorTool.gray;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Local visitor class that builds bounding boxes.
//
///////////////////////////////////////////////////////////////////////////////

class BuildBoxes extends BaseClass
{
	readonly #shapeColor: ( Readonly<IVector4> | null );
	readonly #groupColor: ( Readonly<IVector4> | null );
	#indices: number[] = [];
	#points: number[] = [];
	#colors: number[] = [];
	#geom: ( Geometry | null ) = null;
	#boxes: IBoxMap = new Map < number, Readonly<Box> > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IBoundingBoxesInput} [input] - The colors of the boxes, if any.
	 */
	constructor ( input?: Readonly<IBoundingBoxesInput> )
	{
		super();
		this.#shapeColor = ( input?.shapeColor ?? null );
		this.#groupColor = ( input?.groupColor ?? null );
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
		this.#boxes.clear();
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

			// Add a state. It's white, because the colors of the vertices
			// multiply it, and they are the colors of the boxes.
			const state = SolidColor.makeState ( { topology: "line-list" } );
			state.addAttribute ( new ColorAttribute ( [ ...ColorTool.white ] ) );
			geom.state = state;

			// Save for next time.
			this.#geom = geom;
		}

		// Return the geometry.
		return this.#geom;
	}

	/**
	 * Add the box.
	 * @param {Box} box - The box to add.
	 * @param {IVector4} color - The color of the box.
	 */
	protected addBox ( box: Readonly<Box>, color: Readonly<IVector4> ) : void
	{
		// Handle invalid box
		if ( false === box.valid )
		{
			return;
		}

		// Shortcuts.
		const { llb, llf, lrb, lrf, ulb, ulf, urb, urf } = box.corners;

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

		// The lines are opaque, so that they show for semi-transparent nodes too.
		const c: IVector4 = [ color[0], color[1], color[2], 1 ];

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
	 * Make a box that holds all the boxes of the child nodes.
	 * @param {Group} group - The group to get the box for.
	 * @returns {Box} The box holding the group's children's boxes.
	 */
	protected makeGroupBox ( group: Readonly<Group> ) : Box
	{
		// The box we make for the group.
		const box = new Box();

		// Loop through the group's children.
		group.forEachChild ( child =>
		{
			// Get this child's box from the map.
			const cb = this.#boxes.get ( child.id );

			// Grow our box by the child's box if we have it.
			if ( cb )
			{
				box.growByBox ( cb );
			}
		} );

		// Return the group's box.
		return box;
	}

	/**
	 * Visit the node.
	 * @param {Geometry} geom - The shape node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// Do this first to be consistent with the other visit methods.
		super.visitShape ( geom );

		// Transform the box to global space.
		const box = geom.box.clone();
		box.transform ( this.viewMatrix );

		// Add our box to the map.
		this.#boxes.set ( geom.id, box );

		// Make a box for this shape.
		this.addBox ( box, ( this.#shapeColor ?? getStateColor ( geom.state ) ) );
	}

	/**
	 * Visit the node.
	 * @param {Group} group - The group node.
	 */
	public override visitGroup ( group: Group ) : void
	{
		// Do this first so that the map of boxes gets populated.
		super.visitGroup ( group );

		// Make box for this group.
		const box = this.makeGroupBox ( group );

		// Add our box to the map.
		this.#boxes.set ( group.id, box );

		// Add our box geometry to the scene.
		this.addBox ( box, ( this.#groupColor ?? getStateColor ( group.state ) ) );
	}

	/**
	 * Visit the node.
	 * @param {Transform} tr - The transform node.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		// Do this first so that the map of boxes gets populated.
		super.visitTransform ( tr );

		// Make box for this group.
		const box = this.makeGroupBox ( tr );

		// Add our box to the map.
		this.#boxes.set ( tr.id, box );

		// Add our box geometry to the scene.
		// The box is already transformed so we pass identity.
		this.addBox ( box, ( this.#groupColor ?? getStateColor ( tr.state ) ) );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Build a geometry for the bounding boxes of the given scene. Each box is the
 * color of its node's state, its material's diffuse color or else its color
 * attribute, or gray when it has neither. The given colors are used instead,
 * for all the shapes or all the groups.
 * @param {SceneNode} scene - The scene to build the bounding boxes for.
 * @param {IBoundingBoxesInput} [input] - The colors to use, if any.
 * @param {IVector4} [input.shapeColor] - The color of every shape's box.
 * @param {IVector4} [input.groupColor] - The color of every group's box,
 * including transforms.
 * @returns {Geometry} The built bounding box geometry.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildBoundingBoxes = ( scene: SceneNode, input?: Readonly<IBoundingBoxesInput> ) : Geometry =>
{
	// Visit the scene.
	const visitor = new BuildBoxes ( input );
	scene.accept ( visitor );

	// Return the geometry.
	return visitor.geometry;
}
