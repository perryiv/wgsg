///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Build the scene from the glTF JSON and buffers.
//
//	Each glTF node becomes a group, or a transform if it moves its children.
//	The transforms only rotate and translate. Scale is multiplied into the
//	points and normals instead, as explained in Transforms.ts.
//	Each mesh becomes a geometry for each of its primitives, and a mesh used
//	by more than one node is shared, unless the nodes scale it differently.
//	Accessors used by more than one primitive share their arrays.
//
//	Only triangle lists are read for now. Points, lines, triangle strips, and
//	triangle fans are skipped with a warning.
//
//	Each material becomes a state with its base color. A double-sided
//	material gets two-sided lighting, and the others get their back faces
//	culled, as glTF says. Textures are ignored.
//
//	A material with alphaMode BLEND is semi-transparent: its state goes in
//	TRANSPARENT_BIN, without depth writes, so it's drawn after the opaque
//	shapes and doesn't hide what's behind it. A double-sided one is drawn
//	with buildTransparentScene(), back faces first and then front faces.
//	Transparent shapes are not sorted by depth. The other alpha modes are
//	drawn opaque, including MASK for now.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../../Arrays";
import { buildTransparentScene } from "../../../Builders/Transparent";
import { Cancelled } from "../../Cancelled";
import { FlatShading, PhongShading } from "../../../Shaders";
import { readFloats, readIndices } from "./Accessors";
import { TRANSPARENT_BIN } from "../../../Tools/Constants";
import { yieldToEventLoop } from "../../Functions";
import type { IProgressCallback, IVector4 } from "../../../Types";
import {
	Arrays,
	ColorAttribute,
	CullFace,
	Depth,
	Geometry,
	Group,
	Indexed,
	Node as SceneNode,
	State,
	Transform,
	TwoSidedLight,
	type IIndexArray,
} from "../../../Scene";
import {
	getItem,
	GLTF_MATERIAL_EXTENSION_PREFIX,
	GLTF_SUPPORTED_EXTENSIONS,
	GLTF_LINE_LOOP,
	GLTF_LINE_STRIP,
	GLTF_LINES,
	GLTF_POINTS,
	GLTF_TRIANGLE_FAN,
	GLTF_TRIANGLE_STRIP,
	GLTF_TRIANGLES,
	type IGltfData,
	type IGltfMaterial,
	type IGltfPrimitive,
} from "./Types";
import {
	determinant33,
	flipTriangles,
	type IMatrix33,
	splitNodeTransform,
	transformNormals,
	transformPoints,
} from "./Transforms";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// The most vertices that can use 16-bit indices.
const MAX_VERTICES_FOR_16_BIT_INDICES = 65536;

// How long to work before letting the page update, in milliseconds.
const WORK_TIME = 50;

// The names of the primitive modes that are skipped, for the warning.
const SKIPPED_MODE_NAMES: Readonly<Record<number, string>> = {
	[GLTF_POINTS]: "points",
	[GLTF_LINES]: "lines",
	[GLTF_LINE_LOOP]: "line loops",
	[GLTF_LINE_STRIP]: "line strips",
	[GLTF_TRIANGLE_STRIP]: "triangle strips",
	[GLTF_TRIANGLE_FAN]: "triangle fans",
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Throw if the file requires an extension that the reader can't handle.
 * @param {IGltfData} data The JSON and the buffers.
 */
///////////////////////////////////////////////////////////////////////////////

export const checkExtensions = ( data: Readonly<IGltfData> ) : void =>
{
	const unsupported = ( data.json.extensionsRequired ?? [] ).filter ( ( name ) =>
		( ( false === GLTF_SUPPORTED_EXTENSIONS.has ( name ) ) &&
		( false === name.startsWith ( GLTF_MATERIAL_EXTENSION_PREFIX ) ) ) );
	if ( unsupported.length > 0 )
	{
		throw new Error ( `The file requires glTF extensions that are not supported: ${unsupported.join ( ", " )}` );
	}
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the key for something built with a leftover matrix.
 * @param {number} index The index of what is built.
 * @param {IMatrix33 | null} leftover The leftover matrix, if any.
 * @returns {string} The key.
 */
///////////////////////////////////////////////////////////////////////////////

const makeKey = ( index: number, leftover: ( Readonly<IMatrix33> | null ) ) : string =>
{
	return ( leftover ? `${index} ${leftover.join ( " " )}` : `${index}` );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Builds the scene. Make one, then call build().
 */
///////////////////////////////////////////////////////////////////////////////

export class Builder
{
	readonly #data: IGltfData;
	readonly #onProgress: IProgressCallback;

	// What we made, so that it can be shared. Most keys are the index, plus
	// the leftover matrix if there is one.
	readonly #nodes = new Map < string, ( SceneNode | null ) > ();
	readonly #meshes = new Map < string, ( SceneNode | null ) > ();
	readonly #floats = new Map < string, Array1 < Float32Array > > ();
	readonly #indices = new Map < number, IIndexArray > ();
	readonly #flipped = new Map < string, IIndexArray > ();
	readonly #states = new Map < string, State > ();
	readonly #transparentStates = new Map < string, { back: State, front: State } > ();

	// The nodes being built, to find cycles.
	readonly #building = new Set < number > ();

	// For the progress.
	readonly #numPrimitives: number;
	#numPrimitivesDone = 0;
	#lastYield = 0;

	// The meshes counted in the progress. A mesh can be built more than once.
	readonly #meshesDone = new Set < number > ();

	// The number of primitives skipped for each mode.
	readonly #skipped = new Map < number, number > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IGltfData} data The JSON and the buffers.
	 * @param {IProgressCallback} onProgress Called with the number of
	 * primitives done and the total. Return false to stop.
	 */
	constructor ( data: IGltfData, onProgress: IProgressCallback )
	{
		this.#data = data;
		this.#onProgress = onProgress;
		this.#numPrimitives = ( data.json.meshes ?? [] ).reduce (
			( sum, mesh ) => ( sum + ( mesh.primitives?.length ?? 0 ) ), 0 );
	}

	/**
	 * Get the number of primitives that were skipped because they are not
	 * triangle lists.
	 * @returns {number} The number of primitives.
	 */
	public get numSkipped () : number
	{
		let answer = 0;
		this.#skipped.forEach ( ( count ) => { answer += count; } );
		return answer;
	}

	/**
	 * Build the scene.
	 * @returns {Promise<Group>} The scene.
	 */
	public async build () : Promise < Group >
	{
		// Make sure we can read it.
		checkExtensions ( this.#data );

		// Get the nodes at the top of the scene.
		const roots = this.getRootNodes();

		// Build them.
		this.#lastYield = performance.now();
		const scene = new Group();
		for ( const index of roots )
		{
			const node = await this.buildNode ( index, null );
			if ( node )
			{
				scene.addChild ( node );
			}
		}

		// Say if anything was skipped.
		if ( this.#skipped.size > 0 )
		{
			const counts = [ ...this.#skipped ].map ( ( [ mode, count ] ) =>
				`${count} ${SKIPPED_MODE_NAMES[mode] ?? `with mode ${mode}`}` );
			console.warn ( `Skipped glTF primitives that are not supported yet: ${counts.join ( ", " )}` );
		}

		// There has to be something to draw.
		if ( scene.empty )
		{
			throw new Error ( "The glTF file has no triangles to draw" );
		}

		// The final progress.
		this.reportProgress ( this.#numPrimitives );

		// Calculate the bounds now, to speed things up later.
		void scene.bounds;
		return scene;
	}

	/**
	 * Get the nodes at the top of the scene to show.
	 * @returns {number[]} The indices of the nodes.
	 */
	protected getRootNodes () : number[]
	{
		const { json } = this.#data;

		// Use the scene the file says to, or the first one.
		if ( ( json.scenes ) && ( json.scenes.length > 0 ) )
		{
			const scene = getItem ( json.scenes, ( json.scene ?? 0 ), "scene" );
			return ( scene.nodes ?? [] );
		}

		// Without scenes, use all the nodes that are not children.
		const nodes = ( json.nodes ?? [] );
		const children = new Set ( nodes.flatMap ( ( node ) => ( node.children ?? [] ) ) );
		return nodes.map ( ( _, index ) => index ).filter ( ( index ) => ( false === children.has ( index ) ) );
	}

	/**
	 * Report the progress, and throw if the callback says to stop.
	 * @param {number} done The number of primitives done.
	 */
	protected reportProgress ( done: number ) : void
	{
		if ( false === this.#onProgress ( done, this.#numPrimitives ) )
		{
			throw new Cancelled ( "File reading was cancelled by the progress callback" );
		}
	}

	/**
	 * Every so often, report the progress and let the page update.
	 * @returns {Promise<void>} A promise that resolves when it's time to continue.
	 */
	protected async pause () : Promise < void >
	{
		const now = performance.now();
		if ( ( now - this.#lastYield ) < WORK_TIME )
		{
			return;
		}
		this.reportProgress ( this.#numPrimitivesDone );
		await yieldToEventLoop();
		this.#lastYield = performance.now();
	}

	/**
	 * Build the node and its children. A node used again is shared, if the
	 * leftover matrix is the same.
	 * @param {number} index The index of the node.
	 * @param {IMatrix33 | null} above The leftover matrix from the nodes above, if any.
	 * @returns {Promise<SceneNode | null>} The node, or null if it has nothing to draw.
	 */
	protected async buildNode ( index: number, above: ( IMatrix33 | null ) ) : Promise < SceneNode | null >
	{
		// Did we already build it?
		const key = makeKey ( index, above );
		const existing = this.#nodes.get ( key );
		if ( undefined !== existing )
		{
			return existing;
		}

		// A node can't be inside itself.
		if ( this.#building.has ( index ) )
		{
			throw new Error ( `glTF node ${index} is inside itself` );
		}
		this.#building.add ( index );

		// Make the group, or a transform if it moves its children. What the
		// transform can't do is left over for the mesh and the children.
		const node = getItem ( this.#data.json.nodes, index, "node" );
		const { matrix, leftover } = splitNodeTransform ( node, index, above );
		const group = ( matrix ? new Transform ( matrix ) : new Group() );

		// Add the mesh.
		if ( undefined !== node.mesh )
		{
			const mesh = await this.buildMesh ( node.mesh, leftover );
			if ( mesh )
			{
				group.addChild ( mesh );
			}
		}

		// Add the children.
		for ( const child of ( node.children ?? [] ) )
		{
			const built = await this.buildNode ( child, leftover );
			if ( built )
			{
				group.addChild ( built );
			}
		}

		// Don't keep a node with nothing to draw.
		const answer = ( group.empty ? null : group );
		this.#building.delete ( index );
		this.#nodes.set ( key, answer );
		return answer;
	}

	/**
	 * Build the mesh. A mesh used again is shared, if the leftover matrix is
	 * the same.
	 * @param {number} index The index of the mesh.
	 * @param {IMatrix33 | null} leftover The matrix to multiply the points by, if any.
	 * @returns {Promise<SceneNode | null>} The mesh, or null if it has nothing to draw.
	 */
	protected async buildMesh ( index: number, leftover: ( IMatrix33 | null ) ) : Promise < SceneNode | null >
	{
		// Did we already build it?
		const key = makeKey ( index, leftover );
		const existing = this.#meshes.get ( key );
		if ( undefined !== existing )
		{
			return existing;
		}

		// Make a geometry for each primitive.
		const mesh = getItem ( this.#data.json.meshes, index, "mesh" );
		const geometries: SceneNode[] = [];
		const first = ( false === this.#meshesDone.has ( index ) );
		this.#meshesDone.add ( index );
		for ( const [ i, primitive ] of ( mesh.primitives ?? [] ).entries() )
		{
			try
			{
				const geom = this.buildPrimitive ( primitive, leftover );
				if ( geom )
				{
					geometries.push ( geom );
				}
			}
			catch ( error )
			{
				throw new Error ( `${( error instanceof Error ) ? error.message : String ( error )}, in primitive ${i} of mesh ${index}` );
			}
			if ( first )
			{
				++this.#numPrimitivesDone;
			}
			await this.pause();
		}

		// Use the geometry itself if there's only one.
		let answer: ( SceneNode | null ) = null;
		if ( 1 === geometries.length )
		{
			answer = geometries[0];
		}
		else if ( geometries.length > 1 )
		{
			const group = new Group();
			geometries.forEach ( ( geom ) => { group.addChild ( geom ); } );
			answer = group;
		}

		this.#meshes.set ( key, answer );
		return answer;
	}

	/**
	 * Build the geometry of a primitive. For a double-sided, semi-transparent
	 * material, it's put in a scene that draws its back faces first and then
	 * its front faces.
	 * @param {IGltfPrimitive} primitive The primitive.
	 * @param {IMatrix33 | null} leftover The matrix to multiply the points by, if any.
	 * @returns {SceneNode | null} The geometry or scene, or null if it is not triangles.
	 */
	protected buildPrimitive ( primitive: Readonly<IGltfPrimitive>, leftover: ( IMatrix33 | null ) ) : ( SceneNode | null )
	{
		// Skip what isn't a triangle list.
		const mode = ( primitive.mode ?? GLTF_TRIANGLES );
		if ( GLTF_TRIANGLES !== mode )
		{
			this.#skipped.set ( mode, ( ( this.#skipped.get ( mode ) ?? 0 ) + 1 ) );
			return null;
		}

		// Get the points.
		const { POSITION: position, NORMAL: normal } = primitive.attributes;
		if ( undefined === position )
		{
			throw new Error ( "There are no points" );
		}
		const points = this.getFloats ( position, leftover, false );
		const numVertices = ( points.values?.length ?? 0 ) / 3;

		// Get the normals, if any.
		const normals = ( ( undefined === normal ) ? null : this.getFloats ( normal, leftover, true ) );
		if ( normals && ( normals.values?.length !== points.values?.length ) )
		{
			throw new Error ( `There are ${( normals.values?.length ?? 0 ) / 3} normals but ${numVertices} points` );
		}

		// Make the list of triangles. Without indices, every three vertices
		// are a triangle. A mirror turns the triangles around, so they are
		// turned back to keep the front on the same side.
		const topology = "triangle-list";
		const flip = ( ( null !== leftover ) && ( determinant33 ( leftover ) < 0 ) );
		let primitives: ( Arrays | Indexed );
		if ( undefined === primitive.indices )
		{
			const count = ( numVertices - ( numVertices % 3 ) );
			primitives = ( flip ?
				new Indexed ( { topology, indices: new Array1 ( flipTriangles ( makeSequence ( count, numVertices ) ) ) } ) :
				new Arrays ( { topology, first: 0, count } ) );
		}
		else
		{
			const indices = this.getIndices ( primitive.indices, numVertices );
			primitives = new Indexed ( { topology, indices: ( flip ? this.getFlippedIndices ( primitive.indices, indices ) : indices ) } );
		}

		// Make the geometry.
		const hasNormals = ( null !== normals );
		const geom = new Geometry ( { points, normals, primitives } );
		void geom.box; // Calculate the bounds now, to speed things up later.

		// A double-sided, semi-transparent material draws the back faces and
		// then the front faces.
		const sides = this.getTransparentStates ( primitive.material, hasNormals );
		if ( sides )
		{
			return buildTransparentScene ( { geometry: geom, ...sides } );
		}

		// Otherwise the geometry has the material's state.
		geom.state = this.getState ( primitive.material, hasNormals );
		return geom;
	}

	/**
	 * Get the points or normals of an accessor, multiplied by the leftover
	 * matrix if there is one. They are shared by primitives that use the same
	 * accessor and leftover.
	 * @param {number} index The index of the accessor.
	 * @param {IMatrix33 | null} leftover The matrix to multiply them by, if any.
	 * @param {boolean} areNormals Whether they are normals, which are transformed differently.
	 * @returns {Array1<Float32Array>} The array.
	 */
	protected getFloats ( index: number, leftover: ( IMatrix33 | null ), areNormals: boolean ) : Array1 < Float32Array >
	{
		const key = ( leftover ? `${makeKey ( index, leftover )} ${areNormals ? "normals" : "points"}` : `${index}` );
		let array = this.#floats.get ( key );
		if ( !array )
		{
			if ( leftover )
			{
				const values = this.getFloats ( index, null, areNormals ).values!;
				array = new Array1 ( areNormals ? transformNormals ( values, leftover ) : transformPoints ( values, leftover ) );
			}
			else
			{
				array = new Array1 ( readFloats ( this.#data, index, "VEC3" ) );
			}
			this.#floats.set ( key, array );
		}
		return array;
	}

	/**
	 * Get the indices of an accessor, which can be shared. They are checked
	 * the first time.
	 * @param {number} index The index of the accessor.
	 * @param {number} numVertices The number of vertices they can use.
	 * @returns {IIndexArray} The array.
	 */
	protected getIndices ( index: number, numVertices: number ) : IIndexArray
	{
		let array = this.#indices.get ( index );
		if ( !array )
		{
			array = new Array1 ( readIndices ( this.#data, index ) );
			this.#indices.set ( index, array );
		}

		// Check them, because another primitive can share the indices with
		// fewer vertices.
		const values = array.values!;
		let largest = 0;
		for ( const value of values )
		{
			largest = Math.max ( largest, value );
		}
		if ( ( values.length > 0 ) && ( largest >= numVertices ) )
		{
			throw new Error ( `Index accessor ${index} has vertex index ${largest}, but there are ${numVertices} vertices` );
		}
		return array;
	}

	/**
	 * Get the indices of an accessor with each triangle turned around. They
	 * are shared like the other indices.
	 * @param {number} index The index of the accessor.
	 * @param {IIndexArray} indices The indices, already checked.
	 * @returns {IIndexArray} The array.
	 */
	protected getFlippedIndices ( index: number, indices: IIndexArray ) : IIndexArray
	{
		const key = `${index}`;
		let array = this.#flipped.get ( key );
		if ( !array )
		{
			array = new Array1 ( flipTriangles ( indices.values! ) );
			this.#flipped.set ( key, array );
		}
		return array;
	}

	/**
	 * Get the material, or null if there is none.
	 * @param {number | undefined} index The index of the material, if any.
	 * @returns {IGltfMaterial | null} The material.
	 */
	protected getMaterial ( index: ( number | undefined ) ) : ( IGltfMaterial | null )
	{
		return ( ( undefined === index ) ? null : getItem ( this.#data.json.materials, index, "material" ) );
	}

	/**
	 * Get the state for a material. Primitives with the same material share
	 * it. With normals the triangles are smooth, otherwise each one is flat.
	 * A double-sided material has two-sided lighting. Otherwise the back faces
	 * are culled, as glTF says, which some files need because they have
	 * triangles on top of each other, facing opposite ways. A semi-transparent
	 * material's state goes in TRANSPARENT_BIN, without depth writes.
	 * @param {number | undefined} index The index of the material, if any.
	 * @param {boolean} hasNormals Whether the primitive has normals.
	 * @returns {State} The state.
	 */
	protected getState ( index: ( number | undefined ), hasNormals: boolean ) : State
	{
		const key = `${index ?? "none"} ${hasNormals}`;
		let state = this.#states.get ( key );
		if ( !state )
		{
			state = this.makeState ( index, hasNormals );
			this.#states.set ( key, state );
		}
		return state;
	}

	/**
	 * Get the states for the back and front faces of a double-sided,
	 * semi-transparent material, for buildTransparentScene(). Primitives
	 * with the same material share them.
	 * @param {number | undefined} index The index of the material, if any.
	 * @param {boolean} hasNormals Whether the primitive has normals.
	 * @returns {object | null} The states, or null if the material is not
	 * double-sided and semi-transparent.
	 */
	protected getTransparentStates ( index: ( number | undefined ), hasNormals: boolean ) : ( { back: State, front: State } | null )
	{
		const material = this.getMaterial ( index );
		if ( ( "BLEND" !== material?.alphaMode ) || ( true !== material.doubleSided ) )
		{
			return null;
		}

		const key = `${index} ${hasNormals}`;
		let sides = this.#transparentStates.get ( key );
		if ( !sides )
		{
			sides = { back: this.makeState ( index, hasNormals ), front: this.makeState ( index, hasNormals ) };
			this.#transparentStates.set ( key, sides );
		}
		return sides;
	}

	/**
	 * Make a new state for a material, as getState() describes.
	 * @param {number | undefined} index The index of the material, if any.
	 * @param {boolean} hasNormals Whether the primitive has normals.
	 * @returns {State} The state.
	 */
	protected makeState ( index: ( number | undefined ), hasNormals: boolean ) : State
	{
		// The color. The default material is white and one-sided. Without
		// blending, the alpha is ignored.
		const material = this.getMaterial ( index );
		const blend = ( "BLEND" === material?.alphaMode );
		const doubleSided = ( true === material?.doubleSided );
		let color: IVector4 = [ 1, 1, 1, 1 ];
		const factor = material?.pbrMetallicRoughness?.baseColorFactor;
		if ( factor )
		{
			if ( 4 !== factor.length )
			{
				throw new Error ( `Material ${index} has a base color with ${factor.length} numbers instead of 4` );
			}
			color = [ factor[0], factor[1], factor[2], ( blend ? factor[3] : 1 ) ];
		}

		// Make the state.
		const topology = "triangle-list";
		const state = ( hasNormals ? PhongShading.makeState ( { topology } ) : FlatShading.makeState ( { topology } ) );
		state.addAttribute ( new ColorAttribute ( color ) );
		state.addAttribute ( new TwoSidedLight ( doubleSided ) );
		if ( false === doubleSided )
		{
			state.addAttribute ( new CullFace ( "back" ) );
		}

		// Semi-transparent shapes are drawn after the opaque ones, and don't
		// hide what's drawn after them.
		if ( blend )
		{
			state.addAttribute ( new Depth ( { write: false } ) );
			state.bin = TRANSPARENT_BIN;
		}
		return state;
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the indices 0, 1, 2, and so on.
 * @param {number} count The number of indices.
 * @param {number} numVertices The number of vertices, which decides the index size.
 * @returns {Uint16Array | Uint32Array} The indices.
 */
///////////////////////////////////////////////////////////////////////////////

const makeSequence = ( count: number, numVertices: number ) : ( Uint16Array | Uint32Array ) =>
{
	const answer = ( ( numVertices <= MAX_VERTICES_FOR_16_BIT_INDICES ) ? new Uint16Array ( count ) : new Uint32Array ( count ) );
	for ( let i = 0; i < count; ++i )
	{
		answer[i] = i;
	}
	return answer;
};
