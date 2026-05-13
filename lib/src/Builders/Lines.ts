///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for lines.
//
///////////////////////////////////////////////////////////////////////////////

import { IVector4 } from "../Types";
import { Line } from "../Math";
import { makeTriangleEdges } from "../Algorithms";
import { Multiply as BaseClass } from "../Visitors/Multiply";
import { SolidColor } from "../Shaders";
import { Color } from "../Tools";
import {
	Geometry,
	Group,
	Indexed,
	Node as SceneNode,
	Transform,
} from "../Scene";
import { vec3 } from "gl-matrix";


///////////////////////////////////////////////////////////////////////////////
/**
 * Build the scene for a line segment.
 * @param {object} params The parameters.
 * @param {Line} params.line The line segment.
 * @param {IVector4} [params.color] The color of the line.
 * @returns {Geometry} The geometry representing the line.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildLine = ( { line, color }: { line: Readonly<Line>, color?: IVector4 } ) : ( Geometry | null ) =>
{
	// Handle invalid line.
	if ( !line.valid )
	{
		return null;
	}

	// Get the end points from the line.
	const { start, end } = line;

	// Make the points.
	const points = [
		start[0], start[1], start[2],
		end[0], end[1], end[2],
	];

	// Make the indices.
	const indices = new Uint16Array ( [
		0, 1, // Just one segment.
	] );

	// The topology is a line-list.
	const topology = "line-list";

	// Make the primitives.
	const primitives = new Indexed ( { topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( color )
	{
		geom.state = SolidColor.makeState ( { color, topology } );
	}

	// Return the new geometry.
	return geom;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Given a geometry with one indexed triangle-list, return a geometry with
 * an indexed line-list for the triangle edges.
 * @param {Geometry} geom The input geometry.
 * @returns {(Geometry | null)} The new geometry or null on failure.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildTriangleEdges = ( geom: Geometry ) : ( Geometry | null ) =>
{
	// Get the points.
	const points = geom.points?.values;

	// Make sure.
	if ( !points )
	{
		return null;
	}

	// Shortcut.
	const arrayLength = points.length;

	// Make sure.
	if ( arrayLength <= 0 )
	{
		return null;
	}

	// The array of points is [ x0, y0, z0, x1, y1, z1, ... ],
	// so the length should be evenly divisible by 3.
	if ( 0 !== ( arrayLength % 3 ) )
	{
		return null;
	}

	// Shortcut.
	const prims = geom.primitives;

	// Make sure.
	if ( !prims )
	{
		return null;
	}

	// Make sure.
	if ( 1 !== prims.length )
	{
		return null;
	}

	// Shortcut.
	const prim = prims[0];

	// TODO: For now we only handle triangle-lists.
	if ( "triangle-list" !== prim.topology )
	{
		return null;
	}

	// TODO: For now we only handle indexed triangles.
	if ( false === ( prim instanceof Indexed ) )
	{
		return null;
	}

	// The indices that select the points that make the triangles.
	const triIndices = prim.indices?.values;

	// Make sure.
	if ( !triIndices )
	{
		return null;
	}

	// Make sure.
	if ( triIndices.length <= 0 )
	{
		return null;
	}

	// This should be true because it's a list of triangles, not a strip.
	if ( 0 !== ( triIndices.length % 3 ) )
	{
		return null;
	}

	// Now we know this will be an integer.
	const numTriangles = triIndices.length / 3;

	// Given what we did above, this should always be true.
	if ( numTriangles < 1 )
	{
		throw new Error ( "Internal logic error when making triangle edges" );
	}

	// Make the indices for the lines that are the edges.
	const lineIndices = makeTriangleEdges ( points, triIndices );

	// Make the line-list primitive.
	const lineList = new Indexed ( {
		indices: new Uint32Array ( lineIndices ),
		topology: "line-list"
	} );

	// Make a geometry using the same points and the new indices.
	const answer = new Geometry ( { points, primitives: [ lineList ] } );

	// Return the new geometry.
	return answer;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Local visitor class that builds triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

class BuildEdges extends BaseClass
{
	#scene: Group = new Group();
	#current: Group = this.#scene;
	#color: IVector4 = [ ...Color.black ];

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
		return "Builders.Lines.BuildEdges";
	}

	/**
	 * Get the scene.
	 * @returns {Group} The scene.
	 */
	public get scene() : Group
	{
		return this.#scene;
	}

	/**
	 * Get the current group.
	 * @returns {Group} The current group.
	 */
	public get current() : Group
	{
		const current = this.#current;
		if ( !current )
		{
			throw new Error ( "No current group when building triangle edges" );
		}
		return current;
	}

	/**
	 * Set the current group.
	 * @param {Group} group - The current group.
	 */
	public set current ( group: Group )
	{
		this.#current = group;
	}

	/**
	 * Set the color.
	 */
	public set color ( color: Readonly<IVector4> )
	{
		vec3.copy ( this.#color, color );
	}

	/**
	 * Get the color.
	 * @returns {IVector4} The color.
	 */
	public get color() : Readonly<IVector4>
	{
		return this.#color;
	}

	/**
	 * Reset the builder.
	 */
	public reset() : void
	{
		this.#scene.clear();
		this.#current = this.#scene;
		vec3.copy ( this.#color, Color.black );
	}

	/**
	 * Visit the node.
	 * @param {Geometry} geom - The shape node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// Do this first.
		super.visitShape ( geom );

		// Add the edges for the given triangles.
		const edges = buildTriangleEdges ( geom );
		if ( edges )
		{
			edges.state = SolidColor.makeState ( {
				color: [ ...Color.black ],
				topology: "line-list"
			} );
			this.current.addChild ( edges );
		}
	}

	/**
	 * Visit the node.
	 * @param {Group} group - The group node.
	 */
	public override visitGroup ( group: Group ) : void
	{
		// Shortcut.
		const current = this.current;

		// Make a new group that parallels the given one.
		const newGroup = new Group();

		// Add the new group to the current one.
		current.addChild ( newGroup );

		// Save the original.
		const original = current;

		// Make the new group the current one.
		this.current = newGroup;

		// Now visit the group.
		super.visitGroup ( group );

		// Restore the original current group.
		this.current = original;
	}

	/**
	 * Visit the node.
	 * @param {Transform} tr - The transform node.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		// Shortcut.
		const current = this.current;

		// Make a new transform that parallels the given one.
		const newTr = new Transform ( tr.matrix );

		// Add the new transform to the current group.
		current.addChild ( newTr );

		// Save the original.
		const original = current;

		// Make the new transform the current group.
		this.current = newTr;

		// Now visit the transform.
		super.visitTransform ( tr );

		// Restore the original current group.
		this.current = original;
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Traverse the given scene and build a wireframe scene.
 * @param {SceneNode} scene The scene to traverse.
 * @returns {(Group | null)} The group holding the wireframe scene or null on failure.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildWireframeScene = ( scene: SceneNode ) : ( Group | null ) =>
{
	// Visit the scene.
	const visitor = new BuildEdges();
	scene.accept ( visitor );

	// Return the scene. Do not return an empty group.
	const answer = visitor.scene;
	return ( ( false === answer.empty ) ? answer : null );
}
