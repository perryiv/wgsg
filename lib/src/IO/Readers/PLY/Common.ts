///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The parts of reading a PLY file that do not depend on its format.
//
//	A PLY file has all the vertices, then all the faces, which select the
//	vertices by index. The readers put the vertices into one big array, then
//	pass each face to the builder below. The builder splits the faces into
//	geometries of at most MeshBuilder.maxVerticesPerGeometry vertices, each
//	with its own copy of the vertices it uses. That keeps each GPU buffer
//	small. With up to PLY_MAX_VERTICES_FOR_16_BIT_INDICES vertices the indices
//	can be 16 bits, which halves their memory. More vertices per geometry
//	means fewer geometries to draw.
//
///////////////////////////////////////////////////////////////////////////////

import { ColorTool, DEVELOPER_BUILD } from "../../../Tools";
import { FlatShading, PhongShading } from "../../../Shaders";
import { findElement, type IPlyElement, type IPlyHeader } from "./Header";
import type { IVector4 } from "../../../Types";
import {
	ColorAttribute,
	Geometry,
	Group,
	Indexed,
	State,
	TwoSidedLight,
} from "../../../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// The most vertices in one geometry that can use 16-bit indices.
export const PLY_MAX_VERTICES_FOR_16_BIT_INDICES = 65536;

// The default for the most vertices in one geometry. This many uses 32-bit
// indices, and makes few geometries.
export const PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY = ( 1024 * 1024 );


///////////////////////////////////////////////////////////////////////////////
//
//	Where the needed values are in the records of the file.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPlyLayout
{
	vertex: IPlyElement;
	face: IPlyElement;

	// The positions of these properties in the vertex record.
	x: number;
	y: number;
	z: number;

	// The positions of nx, ny, and nz in the vertex record, or null if the
	// file does not have all three.
	normal: ( [ number, number, number ] | null );

	// The position of the list of vertex indices in the face record.
	faceIndices: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Find a property that is one number.
 * @param {IPlyElement} element The element.
 * @param {string} name The name of the property.
 * @returns {number} The position of the property, or -1 if there is none.
 */
///////////////////////////////////////////////////////////////////////////////

const findNumberProperty = ( element: Readonly<IPlyElement>, name: string ) : number =>
{
	const index = element.properties.findIndex ( ( p ) => ( name === p.name ) );
	if ( ( index >= 0 ) && ( "number" !== element.properties[index].kind ) )
	{
		throw new Error ( `PLY property '${name}' of element '${element.name}' should be a number, not a list` );
	}
	return index;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Find where the needed values are in the records of the file.
 * @param {IPlyHeader} header The header of the file.
 * @returns {IPlyLayout} The layout.
 */
///////////////////////////////////////////////////////////////////////////////

export const getLayout = ( header: Readonly<IPlyHeader> ) : IPlyLayout =>
{
	// We need the vertices.
	const vertex = findElement ( header, "vertex" );
	if ( !vertex )
	{
		throw new Error ( "The PLY file has no 'vertex' element" );
	}

	// We need the points.
	const [ x, y, z ] = [ "x", "y", "z" ].map ( ( name ) =>
	{
		const index = findNumberProperty ( vertex, name );
		if ( index < 0 )
		{
			throw new Error ( `The PLY vertices have no '${name}' property` );
		}
		return index;
	} );

	// Use the normals only if all three are there.
	const [ nx, ny, nz ] = [ "nx", "ny", "nz" ].map ( ( name ) => findNumberProperty ( vertex, name ) );
	const normal: IPlyLayout["normal"] = ( ( ( nx >= 0 ) && ( ny >= 0 ) && ( nz >= 0 ) ) ? [ nx, ny, nz ] : null );

	// We need the faces.
	// TODO: Draw files that are only points.
	const face = findElement ( header, "face" );
	if ( !face )
	{
		throw new Error ( "The PLY file has no 'face' element, and files with only points are not supported yet" );
	}

	// The faces select vertices that were already read, so they have to come
	// after the vertices.
	if ( header.elements.indexOf ( face ) < header.elements.indexOf ( vertex ) )
	{
		throw new Error ( "The PLY faces come before the vertices, which is not supported" );
	}

	// Find the list of vertex indices. Files use either name.
	const faceIndices = face.properties.findIndex ( ( p ) =>
		( ( "vertex_indices" === p.name ) || ( "vertex_index" === p.name ) ) );
	if ( faceIndices < 0 )
	{
		throw new Error ( "The PLY faces have no 'vertex_indices' property" );
	}
	const list = face.properties[faceIndices];
	if ( "list" !== list.kind )
	{
		throw new Error ( `PLY property '${list.name}' of element 'face' should be a list` );
	}
	if ( ( "float32" === list.itemType ) || ( "float64" === list.itemType ) )
	{
		throw new Error ( `PLY property '${list.name}' of element 'face' should be a list of integers` );
	}

	return { vertex, face, x, y, z, normal, faceIndices };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Builds the scene from the vertices and faces. The reader fills in the
 * points and normals, then calls addFace() for each face, then finish().
 */
///////////////////////////////////////////////////////////////////////////////

export class MeshBuilder
{
	// The setting for the most vertices in one geometry.
	static #maxVerticesPerGeometry = PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY;

	// All the vertices in the file, filled in by the reader.
	readonly #points: Float32Array;
	readonly #normals: ( Float32Array | null );
	readonly #numVertices: number;

	// The geometry being made. These arrays are reused for each one.
	readonly #maxVertices: number;
	readonly #maxTriangles: number;
	readonly #localPoints: Float32Array;
	readonly #localNormals: ( Float32Array | null );
	readonly #localIndices: ( Uint16Array | Uint32Array );
	readonly #localToGlobal: Uint32Array;
	#numLocalVertices = 0;
	#numLocalIndices = 0;

	// For each vertex in the file, its index in the geometry being made, or
	// -1 if that geometry does not use it yet.
	readonly #globalToLocal: Int32Array;

	// What we make.
	readonly #scene = new Group();
	readonly #hasNormals: boolean;
	readonly #state: ( State | null ); // Null when each geometry gets its own.

	/**
	 * Construct the class.
	 * @class
	 * @param {object} input The input.
	 * @param {number} input.numVertices The number of vertices in the file.
	 * @param {boolean} input.hasNormals Whether the file has normals.
	 * @param {IVector4} [input.color] The color. The default is gray, or a
	 * random color for each geometry in a developer build.
	 * @param {number} [input.maxVertices] The most vertices in one geometry.
	 * The default is the maxVerticesPerGeometry setting.
	 */
	constructor ( { numVertices, hasNormals, color, maxVertices = MeshBuilder.#maxVerticesPerGeometry } :
		{ numVertices: number, hasNormals: boolean, color?: Readonly<IVector4>, maxVertices?: number } )
	{
		if ( ( false === Number.isSafeInteger ( numVertices ) ) || ( numVertices < 0 ) )
		{
			throw new Error ( `Invalid number of vertices: ${numVertices}` );
		}
		MeshBuilder.checkMaxVertices ( maxVertices );

		this.#numVertices = numVertices;
		this.#points = new Float32Array ( numVertices * 3 );
		this.#normals = ( hasNormals ? new Float32Array ( numVertices * 3 ) : null );

		// A geometry never needs more vertices than the file has. A closed mesh
		// has about twice as many triangles as vertices, so room for four times
		// as many means the vertices are almost always what fills up first.
		this.#maxVertices = Math.min ( maxVertices, Math.max ( numVertices, 3 ) );
		this.#maxTriangles = ( this.#maxVertices * 4 );
		this.#localPoints = new Float32Array ( this.#maxVertices * 3 );
		this.#localNormals = ( hasNormals ? new Float32Array ( this.#maxVertices * 3 ) : null );
		this.#localIndices = ( ( this.#maxVertices <= PLY_MAX_VERTICES_FOR_16_BIT_INDICES ) ?
			new Uint16Array ( this.#maxTriangles * 3 ) :
			new Uint32Array ( this.#maxTriangles * 3 ) );
		this.#localToGlobal = new Uint32Array ( this.#maxVertices );
		this.#globalToLocal = new Int32Array ( numVertices ).fill ( -1 );

		// The geometries share one state, unless each gets its own random color
		// so that a developer can see them.
		this.#hasNormals = hasNormals;
		this.#state = ( ( ( !color ) && DEVELOPER_BUILD ) ? null :
			this.makeState ( color ?? [ 0.5, 0.5, 0.5, 1 ] ) );
	}

	/**
	 * Make the state for the geometries. With normals in the file the
	 * triangles are smooth, otherwise each one is flat.
	 * @param {IVector4} color The color.
	 * @returns {State} The state.
	 */
	protected makeState ( color: Readonly<IVector4> ) : State
	{
		const topology = "triangle-list";
		const state = ( this.#hasNormals ?
			PhongShading.makeState ( { topology } ) :
			FlatShading.makeState ( { topology } ) );
		state.addAttribute ( new ColorAttribute ( color ) );
		state.addAttribute ( new TwoSidedLight ( true ) );
		return state;
	}

	/**
	 * Get the most vertices in one geometry, for the builders made after this.
	 * @returns {number} The most vertices.
	 */
	public static get maxVerticesPerGeometry () : number
	{
		return MeshBuilder.#maxVerticesPerGeometry;
	}

	/**
	 * Set the most vertices in one geometry, for the builders made after
	 * this. Up to PLY_MAX_VERTICES_FOR_16_BIT_INDICES uses 16-bit indices, which take half the memory.
	 * More than that uses 32-bit indices, but makes fewer geometries, which
	 * means fewer draw calls.
	 * @param {number} maxVertices The most vertices, an integer of at least 3.
	 */
	public static set maxVerticesPerGeometry ( maxVertices: number )
	{
		MeshBuilder.checkMaxVertices ( maxVertices );
		MeshBuilder.#maxVerticesPerGeometry = maxVertices;
	}

	/**
	 * Throw if the most vertices in one geometry is not valid. It takes three
	 * to make a triangle.
	 * @param {number} maxVertices The most vertices.
	 */
	protected static checkMaxVertices ( maxVertices: number ) : void
	{
		if ( ( false === Number.isSafeInteger ( maxVertices ) ) || ( maxVertices < 3 ) )
		{
			throw new Error ( `The most vertices in one geometry has to be an integer of at least 3, not ${maxVertices}` );
		}
	}

	/**
	 * Get the array of all the points, for the reader to fill in.
	 * @returns {Float32Array} The points as [ x0, y0, z0, x1, y1, z1, ... ].
	 */
	public get points() : Float32Array
	{
		return this.#points;
	}

	/**
	 * Get the array of all the normals, for the reader to fill in.
	 * @returns {Float32Array | null} The normals, or null if there are none.
	 */
	public get normals() : ( Float32Array | null )
	{
		return this.#normals;
	}

	/**
	 * Add a face. Faces with more than three vertices are split into
	 * triangles that share the first vertex. Faces with fewer are ignored.
	 * @param {ArrayLike<number>} indices The indices of the face's vertices.
	 * @param {number} [count] How many of the indices to use.
	 */
	public addFace ( indices: ArrayLike<number>, count = indices.length ) : void
	{
		for ( let i = 2; i < count; ++i )
		{
			this.addTriangle ( indices[0], indices[i - 1], indices[i] );
		}
	}

	/**
	 * Add a triangle.
	 * @param {number} a The index of the first vertex.
	 * @param {number} b The index of the second vertex.
	 * @param {number} c The index of the third vertex.
	 */
	public addTriangle ( a: number, b: number, c: number ) : void
	{
		// Check the indices.
		const numVertices = this.#numVertices;
		for ( const index of [ a, b, c ] )
		{
			if ( ( false === Number.isInteger ( index ) ) || ( index < 0 ) || ( index >= numVertices ) )
			{
				throw new Error ( `PLY face has vertex index ${index}, but there are ${numVertices} vertices` );
			}
		}

		// How many new vertices does this geometry need?
		const g2l = this.#globalToLocal;
		const needed =
			( ( g2l[a] < 0 ) ? 1 : 0 ) +
			( ( ( g2l[b] < 0 ) && ( b !== a ) ) ? 1 : 0 ) +
			( ( ( g2l[c] < 0 ) && ( c !== a ) && ( c !== b ) ) ? 1 : 0 );

		// Start a new geometry if this one is full.
		if (
			( ( this.#numLocalVertices + needed ) > this.#maxVertices ) ||
			( ( this.#numLocalIndices + 3 ) > this.#localIndices.length ) )
		{
			this.flush();
		}

		// Add the triangle.
		const indices = this.#localIndices;
		indices[this.#numLocalIndices++] = this.getLocalIndex ( a );
		indices[this.#numLocalIndices++] = this.getLocalIndex ( b );
		indices[this.#numLocalIndices++] = this.getLocalIndex ( c );
	}

	/**
	 * Get the index of the vertex in the geometry being made. Add the vertex
	 * to the geometry if it is not there yet.
	 * @param {number} global The index of the vertex in the file.
	 * @returns {number} The index of the vertex in the geometry.
	 */
	protected getLocalIndex ( global: number ) : number
	{
		let local = this.#globalToLocal[global];
		if ( local >= 0 )
		{
			return local;
		}

		local = this.#numLocalVertices++;
		this.#globalToLocal[global] = local;
		this.#localToGlobal[local] = global;

		const from = global * 3;
		const to = local * 3;
		const points = this.#points;
		const localPoints = this.#localPoints;
		localPoints[to    ] = points[from    ];
		localPoints[to + 1] = points[from + 1];
		localPoints[to + 2] = points[from + 2];

		const normals = this.#normals;
		const localNormals = this.#localNormals;
		if ( normals && localNormals )
		{
			localNormals[to    ] = normals[from    ];
			localNormals[to + 1] = normals[from + 1];
			localNormals[to + 2] = normals[from + 2];
		}

		return local;
	}

	/**
	 * Make a geometry from the triangles added since the last one, and get
	 * ready for the next one.
	 */
	protected flush() : void
	{
		const numVertices = this.#numLocalVertices;
		const numIndices = this.#numLocalIndices;
		if ( numIndices <= 0 )
		{
			return;
		}

		// Copy the used part of the arrays, which we reuse for the next one.
		const points = this.#localPoints.slice ( 0, numVertices * 3 );
		const normals = this.#localNormals?.slice ( 0, numVertices * 3 );
		const indices = this.#localIndices.slice ( 0, numIndices );

		const primitives = new Indexed ( { topology: "triangle-list", indices } );
		const geom = new Geometry ( { points, normals, primitives } );
		geom.state = ( this.#state ?? this.makeState ( ColorTool.makeRandomColor ( 0.2, 0.8 ) ) );
		void geom.box; // Calculate the bounds now, to speed things up later.
		this.#scene.addChild ( geom );

		// Forget which vertices this geometry used.
		const g2l = this.#globalToLocal;
		const l2g = this.#localToGlobal;
		for ( let i = 0; i < numVertices; ++i )
		{
			g2l[l2g[i]] = -1;
		}
		this.#numLocalVertices = 0;
		this.#numLocalIndices = 0;
	}

	/**
	 * Make the last geometry and return the scene.
	 * @returns {Group} The scene, with one geometry for each part.
	 */
	public finish() : Group
	{
		this.flush();
		void this.#scene.bounds; // Calculate the bounds now, to speed things up later.
		return this.#scene;
	}
}
