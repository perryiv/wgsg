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
//	Each material becomes a state with a Material attribute: the base color
//	is its diffuse and ambient color, and the emissive color, times the
//	KHR_materials_emissive_strength if there is one, is its emission. The
//	metallic and roughness become its specular color and shininess (see
//	Specular.ts), unless they're in a texture, which isn't read yet. A
//	double-sided material gets two-sided lighting, and the others get their
//	back faces culled, as glTF says. Textures are ignored.
//
//	A base color texture goes in the state's texture set, as its diffuse
//	texture, and an emissive texture as its emissive texture, which
//	multiplies the emissive color. They're sampled with the texture
//	coordinates (TEXCOORD_0). Their images are
//	decoded before the nodes are built. A texture that can't be read, or that
//	uses other texture coordinates, is skipped with a warning, and the model
//	is drawn without it.
//
//	The vertex colors (COLOR_0) multiply the material's color when they are
//	drawn, as glTF says. Their alpha is only kept for BLEND materials, like
//	the base color's.
//
//	A material with alphaMode BLEND is semi-transparent: its state goes in
//	TRANSPARENT_BIN, without depth writes, so it's drawn after the opaque
//	shapes and doesn't hide what's behind it. A double-sided one is drawn
//	with buildTransparentScene(), back faces first and then front faces.
//	Transparent shapes are not sorted by depth. A MASK material draws only
//	the pixels whose alpha is at least its cutoff, and draws them opaque. An
//	OPAQUE one draws every pixel opaque, ignoring the alpha of its textures
//	and vertex colors.
//
//	A material with KHR_materials_transmission, like glass, lets light
//	through. This reader can't draw that, so it draws the material as
//	semi-transparent instead, like BLEND, with its alpha multiplied by one
//	minus the transmission factor. The alpha is kept from going below
//	MIN_TRANSMISSION_ALPHA, so that clear glass still shows. The
//	transmission texture is ignored.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../../Arrays";
import { buildTransparentScene } from "../../../Builders/Transparent";
import { Cancelled } from "../../Cancelled";
import { FlatShading, PhongShading } from "../../../Shaders";
import { decodeImage, getImageBytes, getSamplerSettings, type IImageDecoder } from "./Images";
import { getErrorMessage } from "../../Functions";
import { getSpecular } from "./Specular";
import { readFloats, readIndices } from "./Accessors";
import { Texture, type ITextureImage } from "../../../Textures/Texture";
import { DEFAULT_ALPHA_CUTOFF, TRANSPARENT_BIN } from "../../../Tools/Constants";
import { yieldToEventLoop } from "../../Functions";
import type { IProgressCallback, IVector4 } from "../../../Types";
import {
	Arrays,
	CullFace,
	Depth,
	Geometry,
	Group,
	Indexed,
	Material,
	Node as SceneNode,
	TextureSet,
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
	type IGltfTextureInfo,
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

// The smallest alpha that transmission makes, so that clear glass still
// shows. It's a guess at what looks right.
const MIN_TRANSMISSION_ALPHA = 0.25;

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
 * Get how much light the material lets through, from its
 * KHR_materials_transmission extension. It's zero without one.
 * @param {IGltfMaterial | null} material The material, if any.
 * @param {number | undefined} index The index of the material, for errors.
 * @returns {number} The transmission factor, from 0 to 1.
 */
///////////////////////////////////////////////////////////////////////////////

const getTransmission = ( material: ( Readonly<IGltfMaterial> | null ), index: ( number | undefined ) ) : number =>
{
	const factor = ( material?.extensions?.KHR_materials_transmission?.transmissionFactor ?? 0 );
	if ( !( ( factor >= 0 ) && ( factor <= 1 ) ) )
	{
		throw new Error ( `Material ${index} has a transmission factor of ${factor}, which is not from 0 to 1` );
	}
	return factor;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the material uses the alpha of its colors: it blends or masks.
 * @param {IGltfMaterial | null} material The material, if any.
 * @returns {boolean} Whether the alpha is used.
 */
///////////////////////////////////////////////////////////////////////////////

const hasAlpha = ( material: ( Readonly<IGltfMaterial> | null ) ) : boolean =>
{
	return ( ( "BLEND" === material?.alphaMode ) || ( "MASK" === material?.alphaMode ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * See if the material is drawn semi-transparent: it blends, or it lets
 * light through.
 * @param {IGltfMaterial | null} material The material, if any.
 * @param {number | undefined} index The index of the material, for errors.
 * @returns {boolean} Whether it's semi-transparent.
 */
///////////////////////////////////////////////////////////////////////////////

const isTransparent = ( material: ( Readonly<IGltfMaterial> | null ), index: ( number | undefined ) ) : boolean =>
{
	return ( ( "BLEND" === material?.alphaMode ) || ( getTransmission ( material, index ) > 0 ) );
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
	readonly #texCoords = new Map < number, Array1 < Float32Array > > ();
	readonly #colors = new Map < string, Array1 < Float32Array > > ();
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

	// The textures by their index, or null if they can't be read, and the
	// images by their index, decoded once each.
	readonly #decoder: IImageDecoder;
	readonly #textures = new Map < number, ( Texture | null ) > ();
	readonly #images = new Map < number, Promise < ITextureImage > > ();
	readonly #warnings = new Set < string > ();

	/**
	 * Construct the class.
	 * @class
	 * @param {IGltfData} data The JSON and the buffers.
	 * @param {IProgressCallback} onProgress Called with the number of
	 * primitives done and the total. Return false to stop.
	 * @param {IImageDecoder} [decoder] Decodes the images of the textures.
	 * The default is the browser's createImageBitmap().
	 */
	constructor ( data: IGltfData, onProgress: IProgressCallback, decoder: IImageDecoder = decodeImage )
	{
		this.#data = data;
		this.#onProgress = onProgress;
		this.#decoder = decoder;
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

		// Read the textures that the materials use.
		await this.loadTextures();

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
		this.#warnings.forEach ( ( warning ) => { console.warn ( warning ); } );

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
		const { POSITION: position, NORMAL: normal, COLOR_0: color, TEXCOORD_0: texCoord } = primitive.attributes;
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

		// Get the colors, if any. Their alpha is only used when blending or
		// masking.
		const keepAlpha = hasAlpha ( this.getMaterial ( primitive.material ) );
		const colors = ( ( undefined === color ) ? null : this.getColors ( color, keepAlpha ) );
		if ( colors && ( colors.values?.length !== ( numVertices * 4 ) ) )
		{
			throw new Error ( `There are ${( colors.values?.length ?? 0 ) / 4} colors but ${numVertices} points` );
		}

		// Get the texture coordinates, if any.
		const texCoords = ( ( undefined === texCoord ) ? null : this.getTexCoords ( texCoord ) );
		if ( texCoords && ( texCoords.values?.length !== ( numVertices * 2 ) ) )
		{
			throw new Error ( `There are ${( texCoords.values?.length ?? 0 ) / 2} texture coordinates but ${numVertices} points` );
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
		const geom = new Geometry ( { points, normals, colors, texCoords, primitives } );
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
	 * Get the colors of an accessor, as red, green, blue, and alpha. They
	 * are shared by primitives that use the same accessor, and keep or drop
	 * the alpha the same way.
	 * @param {number} index The index of the accessor.
	 * @param {boolean} keepAlpha Whether to keep the alpha. If not, or if
	 * there is none, it's 1.
	 * @returns {Array1<Float32Array>} The array.
	 */
	protected getColors ( index: number, keepAlpha: boolean ) : Array1 < Float32Array >
	{
		const key = `${index} ${keepAlpha}`;
		let array = this.#colors.get ( key );
		if ( !array )
		{
			// They have three or four numbers each.
			const { type } = getItem ( this.#data.json.accessors, index, "accessor" );
			if ( ( "VEC3" !== type ) && ( "VEC4" !== type ) )
			{
				throw new Error ( `Accessor ${index} has colors, so it should be a VEC3 or VEC4, not a ${type}` );
			}
			const size = ( ( "VEC3" === type ) ? 3 : 4 );
			const values = readFloats ( this.#data, index, type );

			// Make four of each.
			const count = ( values.length / size );
			const rgba = new Float32Array ( count * 4 );
			for ( let i = 0; i < count; ++i )
			{
				const from = ( i * size );
				const to = ( i * 4 );
				rgba[to]     = values[from];
				rgba[to + 1] = values[from + 1];
				rgba[to + 2] = values[from + 2];
				rgba[to + 3] = ( ( keepAlpha && ( 4 === size ) ) ? values[from + 3] : 1 );
			}
			array = new Array1 ( rgba );
			this.#colors.set ( key, array );
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
	 * Get the texture coordinates of an accessor, which can be shared.
	 * @param {number} index The index of the accessor.
	 * @returns {Array1<Float32Array>} The array.
	 */
	protected getTexCoords ( index: number ) : Array1 < Float32Array >
	{
		let array = this.#texCoords.get ( index );
		if ( !array )
		{
			array = new Array1 ( readFloats ( this.#data, index, "VEC2" ) );
			this.#texCoords.set ( index, array );
		}
		return array;
	}

	/**
	 * Read the textures that the materials use, so that they're ready when
	 * the states are made.
	 * @returns {Promise<void>} Resolves when they're read.
	 */
	protected async loadTextures () : Promise < void >
	{
		for ( const material of ( this.#data.json.materials ?? [] ) )
		{
			for ( const info of [ material.pbrMetallicRoughness?.baseColorTexture, material.emissiveTexture ] )
			{
				if ( !info )
				{
					continue;
				}
				if ( 0 !== ( info.texCoord ?? 0 ) )
				{
					this.#warnings.add ( "Skipped glTF textures that use texture coordinates other than TEXCOORD_0, which are not supported yet" );
					continue;
				}
				if ( !this.#textures.has ( info.index ) )
				{
					this.#textures.set ( info.index, await this.loadTexture ( info.index ) );
				}
			}
		}
	}

	/**
	 * Read a texture: decode its image, and use its sampler's settings.
	 * @param {number} index The index of the texture.
	 * @returns {Promise<Texture | null>} The texture, or null if it can't be read.
	 */
	protected async loadTexture ( index: number ) : Promise < Texture | null >
	{
		const texture = getItem ( this.#data.json.textures, index, "texture" );
		const { source, sampler } = texture;
		if ( undefined === source )
		{
			this.#warnings.add ( `Skipped glTF texture ${index}, which has no image that's supported` );
			return null;
		}
		try
		{
			const image = await this.getImage ( source );
			const settings = getSamplerSettings ( ( undefined === sampler ) ? undefined : getItem ( this.#data.json.samplers, sampler, "sampler" ) );
			return new Texture ( { image, ...settings } );
		}
		catch ( error )
		{
			this.#warnings.add ( `Skipped glTF texture ${index}: ${getErrorMessage ( error )}` );
			return null;
		}
	}

	/**
	 * Get an image, decoding it the first time.
	 * @param {number} index The index of the image.
	 * @returns {Promise<ITextureImage>} The image.
	 */
	protected getImage ( index: number ) : Promise < ITextureImage >
	{
		let image = this.#images.get ( index );
		if ( !image )
		{
			const { bytes, mimeType } = getImageBytes ( this.#data, index );
			image = this.#decoder ( bytes, mimeType );
			this.#images.set ( index, image );
		}
		return image;
	}

	/**
	 * Get a texture of a material, if it was read, and it uses TEXCOORD_0.
	 * @param {IGltfTextureInfo | undefined} info The material's texture, if any.
	 * @returns {Texture | null} The texture, if any.
	 */
	protected getTexture ( info: ( Readonly<IGltfTextureInfo> | undefined ) ) : ( Texture | null )
	{
		if ( ( !info ) || ( 0 !== ( info.texCoord ?? 0 ) ) )
		{
			return null;
		}
		return ( this.#textures.get ( info.index ) ?? null );
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
	 * material's state, for BLEND or transmission, goes in TRANSPARENT_BIN,
	 * without depth writes.
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
		if ( ( true !== material?.doubleSided ) || ( false === isTransparent ( material, index ) ) )
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
	 * Get the color of a material: its base color, with the alpha only when
	 * it blends, and made more see-through by transmission. The default
	 * material is white.
	 * @param {number | undefined} index The index of the material, if any.
	 * @returns {IVector4} The color.
	 */
	protected getMaterialColor ( index: ( number | undefined ) ) : IVector4
	{
		// The base color. Without blending or masking, the alpha is ignored.
		const material = this.getMaterial ( index );
		const keepAlpha = hasAlpha ( material );
		let color: IVector4 = [ 1, 1, 1, 1 ];
		const factor = material?.pbrMetallicRoughness?.baseColorFactor;
		if ( factor )
		{
			if ( 4 !== factor.length )
			{
				throw new Error ( `Material ${index} has a base color with ${factor.length} numbers instead of 4` );
			}
			color = [ factor[0], factor[1], factor[2], ( keepAlpha ? factor[3] : 1 ) ];
		}

		// Light that goes through the material makes it more see-through,
		// but not invisible.
		const transmission = getTransmission ( material, index );
		if ( transmission > 0 )
		{
			color[3] *= Math.max ( MIN_TRANSMISSION_ALPHA, ( 1 - transmission ) );
		}
		return color;
	}

	/**
	 * Get the specular color and shininess like a material's metallic and
	 * roughness, which glTF says are 1 when they're left out. When they're
	 * in a texture, which isn't read yet, there is no highlight.
	 * @param {IGltfMaterial | null} material The material, if any.
	 * @param {number | undefined} index The index of the material, for errors.
	 * @param {IVector4} baseColor The base color.
	 * @returns {object} The specular color and the shininess.
	 */
	protected getSpecularOf ( material: ( Readonly<IGltfMaterial> | null ), index: ( number | undefined ), baseColor: Readonly<IVector4> ) : { specular: IVector4, shininess: number }
	{
		const pbr = material?.pbrMetallicRoughness;
		if ( pbr?.metallicRoughnessTexture )
		{
			return { specular: [ 0, 0, 0, 1 ], shininess: 0 };
		}
		const metallic = ( pbr?.metallicFactor ?? 1 );
		const roughness = ( pbr?.roughnessFactor ?? 1 );
		for ( const [ name, value ] of [ [ "metallic", metallic ], [ "roughness", roughness ] ] as const )
		{
			if ( !( ( value >= 0 ) && ( value <= 1 ) ) )
			{
				throw new Error ( `Material ${index} has a ${name} of ${value}, which is not from 0 to 1` );
			}
		}
		return getSpecular ( baseColor, metallic, roughness );
	}

	/**
	 * Get the alpha mask of a material. A MASK material draws the pixels
	 * whose alpha is at least its cutoff, which is 0.5 by default, and an
	 * opaque one draws every pixel, with a cutoff of 0, so that the alpha of
	 * textures and vertex colors is ignored, as glTF says. Semi-transparent
	 * materials, which blend or let light through, have no mask.
	 * @param {IGltfMaterial | null} material The material, if any.
	 * @param {number | undefined} index The index of the material, for errors.
	 * @returns {object} The material's alpha mask settings.
	 */
	protected getAlphaMask ( material: ( Readonly<IGltfMaterial> | null ), index: ( number | undefined ) ) : { alphaMask: boolean, alphaCutoff: number }
	{
		if ( isTransparent ( material, index ) )
		{
			return { alphaMask: false, alphaCutoff: DEFAULT_ALPHA_CUTOFF };
		}
		if ( "MASK" !== material?.alphaMode )
		{
			return { alphaMask: true, alphaCutoff: 0 };
		}
		const cutoff = ( material.alphaCutoff ?? DEFAULT_ALPHA_CUTOFF );
		if ( !( ( cutoff >= 0 ) && ( cutoff <= 1 ) ) )
		{
			throw new Error ( `Material ${index} has an alpha cutoff of ${cutoff}, which is not from 0 to 1` );
		}
		return { alphaMask: true, alphaCutoff: cutoff };
	}

	/**
	 * Get the emission of a material: its emissive color, times its emissive
	 * strength if it has one. The default is black.
	 * @param {number | undefined} index The index of the material, if any.
	 * @returns {IVector4} The emission, with an alpha of 1.
	 */
	protected getEmission ( index: ( number | undefined ) ) : IVector4
	{
		const material = this.getMaterial ( index );
		const factor = ( material?.emissiveFactor ?? [ 0, 0, 0 ] );
		if ( 3 !== factor.length )
		{
			throw new Error ( `Material ${index} has an emissive color with ${factor.length} numbers instead of 3` );
		}
		const strength = ( material?.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1 );
		if ( !( strength >= 0 ) )
		{
			throw new Error ( `Material ${index} has an emissive strength of ${strength}, which is less than 0` );
		}
		return [ factor[0] * strength, factor[1] * strength, factor[2] * strength, 1 ];
	}

	/**
	 * Make a new state for a material, as getState() describes.
	 * @param {number | undefined} index The index of the material, if any.
	 * @param {boolean} hasNormals Whether the primitive has normals.
	 * @returns {State} The state.
	 */
	protected makeState ( index: ( number | undefined ), hasNormals: boolean ) : State
	{
		// The color. The default material is white and one-sided.
		const material = this.getMaterial ( index );
		const doubleSided = ( true === material?.doubleSided );
		const color = this.getMaterialColor ( index );
		const emission = this.getEmission ( index );

		// Make the state.
		const topology = "triangle-list";
		const state = ( hasNormals ? PhongShading.makeState ( { topology } ) : FlatShading.makeState ( { topology } ) );
		const { specular, shininess } = this.getSpecularOf ( material, index, color );
		state.addAttribute ( new Material ( {
			ambient: color,
			diffuse: color,
			emission,
			specular,
			shininess,
			...this.getAlphaMask ( material, index ),
		} ) );
		const diffuse = this.getTexture ( material?.pbrMetallicRoughness?.baseColorTexture );
		const emissive = this.getTexture ( material?.emissiveTexture );
		if ( diffuse || emissive )
		{
			state.addAttribute ( new TextureSet ( { diffuse, emissive } ) );
		}
		state.addAttribute ( new TwoSidedLight ( doubleSided ) );
		if ( false === doubleSided )
		{
			state.addAttribute ( new CullFace ( "back" ) );
		}

		// Semi-transparent shapes are drawn after the opaque ones, and don't
		// hide what's drawn after them.
		if ( isTransparent ( material, index ) )
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
