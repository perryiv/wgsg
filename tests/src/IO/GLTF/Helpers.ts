///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helpers for the glTF tests. They make small glTF files in memory.
//
///////////////////////////////////////////////////////////////////////////////

import { decodePng } from "../../Helpers/Png";
import { getReader } from "../../../../lib/src/IO";
import { GLTF } from "../../../../lib/src/IO/Readers/GLTF";
import { Geometry, Node as SceneNode } from "../../../../lib/src/Scene";
import type { IProgressCallback } from "../../../../lib/src/Types";
import {
	GLB_CHUNK_TYPE_BIN,
	GLB_CHUNK_TYPE_JSON,
	GLB_MAGIC_NUMBER,
	GLTF_BYTE,
	GLTF_FLOAT,
	GLTF_SHORT,
	GLTF_UNSIGNED_BYTE,
	GLTF_UNSIGNED_INT,
	GLTF_UNSIGNED_SHORT,
	type IGltfAccessor,
	type IGltfImage,
	type IGltfJson,
	type IGltfMaterial,
	type IGltfNode,
	type IGltfPrimitive,
	type IGltfSampler,
	type IGltfTexture,
} from "../../../../lib/src/IO/Readers/GLTF/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a typed array of the component type.
//
///////////////////////////////////////////////////////////////////////////////

export const toTyped = ( values: number[], componentType: number ) : Uint8Array < ArrayBuffer > =>
{
	let array: ( Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array );
	switch ( componentType )
	{
		case GLTF_BYTE: array = new Int8Array ( values ); break;
		case GLTF_UNSIGNED_BYTE: array = new Uint8Array ( values ); break;
		case GLTF_SHORT: array = new Int16Array ( values ); break;
		case GLTF_UNSIGNED_SHORT: array = new Uint16Array ( values ); break;
		case GLTF_UNSIGNED_INT: array = new Uint32Array ( values ); break;
		case GLTF_FLOAT: array = new Float32Array ( values ); break;
		default: throw new Error ( `Unknown component type ${componentType}` );
	}
	return new Uint8Array ( array.buffer as ArrayBuffer, array.byteOffset, array.byteLength );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Pad to a multiple of 4 bytes.
//
///////////////////////////////////////////////////////////////////////////////

const pad4 = ( length: number ) : number => ( ( length + 3 ) & ~3 );


///////////////////////////////////////////////////////////////////////////////
/**
 * Makes the JSON and the binary data of a glTF file.
 */
///////////////////////////////////////////////////////////////////////////////

export class GltfMaker
{
	public json: IGltfJson = { asset: { version: "2.0" } };
	#bytes: number[] = [];

	/**
	 * Add bytes to the buffer, and a buffer view of them.
	 * @param {Uint8Array} bytes The bytes.
	 * @param {number} [byteStride] The stride of the buffer view.
	 * @returns {number} The index of the buffer view.
	 */
	public addView ( bytes: Uint8Array, byteStride?: number ) : number
	{
		// Start on a multiple of 4 bytes.
		while ( 0 !== ( this.#bytes.length % 4 ) )
		{
			this.#bytes.push ( 0 );
		}
		const byteOffset = this.#bytes.length;
		this.#bytes.push ( ...bytes );
		const views = ( this.json.bufferViews ??= [] );
		views.push ( { buffer: 0, byteOffset, byteLength: bytes.length, ...( byteStride ? { byteStride } : {} ) } );
		return ( views.length - 1 );
	}

	/**
	 * Add an accessor, with a buffer view of its own values.
	 * @param {number[]} values The values.
	 * @param {number} componentType The component type.
	 * @param {string} type The type, like "VEC3".
	 * @param {Partial<IGltfAccessor>} [extra] More of the accessor.
	 * @returns {number} The index of the accessor.
	 */
	public addAccessor ( values: number[], componentType: number, type: string, extra?: Partial<IGltfAccessor> ) : number
	{
		const sizes: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
		const bufferView = this.addView ( toTyped ( values, componentType ) );
		return this.addRawAccessor ( { bufferView, componentType, type, count: ( values.length / sizes[type] ), ...extra } );
	}

	/**
	 * Add an accessor as it is.
	 * @param {IGltfAccessor} accessor The accessor.
	 * @returns {number} The index of the accessor.
	 */
	public addRawAccessor ( accessor: IGltfAccessor ) : number
	{
		const accessors = ( this.json.accessors ??= [] );
		accessors.push ( accessor );
		return ( accessors.length - 1 );
	}

	/**
	 * Add the points of the accessor as floats.
	 * @param {number[]} points The points.
	 * @returns {number} The index of the accessor.
	 */
	public addPoints ( points: number[] ) : number
	{
		return this.addAccessor ( points, GLTF_FLOAT, "VEC3" );
	}

	/**
	 * Add a mesh.
	 * @param {IGltfPrimitive[]} primitives The primitives.
	 * @returns {number} The index of the mesh.
	 */
	public addMesh ( primitives: IGltfPrimitive[] ) : number
	{
		const meshes = ( this.json.meshes ??= [] );
		meshes.push ( { primitives } );
		return ( meshes.length - 1 );
	}

	/**
	 * Add a material.
	 * @param {IGltfMaterial} material The material.
	 * @returns {number} The index of the material.
	 */
	public addMaterial ( material: IGltfMaterial ) : number
	{
		const materials = ( this.json.materials ??= [] );
		materials.push ( material );
		return ( materials.length - 1 );
	}

	/**
	 * Add an image in a buffer view.
	 * @param {Uint8Array} bytes The bytes of the image file.
	 * @param {string} [mimeType] The type. The default is PNG.
	 * @returns {number} The index of the image.
	 */
	public addImage ( bytes: Uint8Array, mimeType = "image/png" ) : number
	{
		return this.addRawImage ( { bufferView: this.addView ( bytes ), mimeType } );
	}

	/**
	 * Add an image as it is.
	 * @param {IGltfImage} image The image.
	 * @returns {number} The index of the image.
	 */
	public addRawImage ( image: IGltfImage ) : number
	{
		const images = ( this.json.images ??= [] );
		images.push ( image );
		return ( images.length - 1 );
	}

	/**
	 * Add a sampler.
	 * @param {IGltfSampler} sampler The sampler.
	 * @returns {number} The index of the sampler.
	 */
	public addSampler ( sampler: IGltfSampler ) : number
	{
		const samplers = ( this.json.samplers ??= [] );
		samplers.push ( sampler );
		return ( samplers.length - 1 );
	}

	/**
	 * Add a texture.
	 * @param {IGltfTexture} texture The texture.
	 * @returns {number} The index of the texture.
	 */
	public addTexture ( texture: IGltfTexture ) : number
	{
		const textures = ( this.json.textures ??= [] );
		textures.push ( texture );
		return ( textures.length - 1 );
	}

	/**
	 * Add a node.
	 * @param {IGltfNode} node The node.
	 * @returns {number} The index of the node.
	 */
	public addNode ( node: IGltfNode ) : number
	{
		const nodes = ( this.json.nodes ??= [] );
		nodes.push ( node );
		return ( nodes.length - 1 );
	}

	/**
	 * Add a scene.
	 * @param {number[]} nodes The nodes at the top of the scene.
	 * @returns {number} The index of the scene.
	 */
	public addScene ( nodes: number[] ) : number
	{
		const scenes = ( this.json.scenes ??= [] );
		scenes.push ( { nodes } );
		return ( scenes.length - 1 );
	}

	/**
	 * Add a mesh in a node in the scene. This is the usual small file.
	 * @param {IGltfPrimitive[]} primitives The primitives.
	 * @returns {number} The index of the node.
	 */
	public addMeshNode ( primitives: IGltfPrimitive[] ) : number
	{
		const node = this.addNode ( { mesh: this.addMesh ( primitives ) } );
		this.addScene ( [ node ] );
		return node;
	}

	/**
	 * Get the binary data.
	 * @returns {Uint8Array} The bytes.
	 */
	public get bytes () : Uint8Array < ArrayBuffer >
	{
		return new Uint8Array ( this.#bytes );
	}

	/**
	 * Set the buffer in the JSON, if there is data.
	 * @param {string} [uri] The URI of the buffer.
	 */
	protected setBuffer ( uri?: string ) : void
	{
		if ( this.#bytes.length > 0 )
		{
			this.json.buffers = [ { byteLength: this.#bytes.length, ...( uri ? { uri } : {} ) } ];
		}
	}

	/**
	 * Make a .glb file.
	 * @returns {File} The file.
	 */
	public glb () : File
	{
		this.setBuffer();
		return makeGlb ( JSON.stringify ( this.json ), ( ( this.#bytes.length > 0 ) ? this.bytes : null ) );
	}

	/**
	 * Make a .gltf file with the data embedded.
	 * @param {string} [name] The file name.
	 * @returns {File} The file.
	 */
	public gltf ( name = "test.gltf" ) : File
	{
		const text = String.fromCharCode ( ...this.#bytes );
		this.setBuffer ( `data:application/octet-stream;base64,${btoa ( text )}` );
		return new File ( [ JSON.stringify ( this.json ) ], name );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a .glb file from the JSON text and the binary data.
 * @param {string} text The JSON text.
 * @param {Uint8Array | null} bin The binary data, or null for none.
 * @param {object} [options] Options for making broken files.
 * @param {number} [options.magic] The magic number.
 * @param {number} [options.version] The version.
 * @param {number} [options.lengthChange] Added to the length in the header.
 * @param {number} [options.firstType] The type of the first chunk.
 * @returns {File} The file.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeGlb = ( text: string, bin: ( Uint8Array | null ), { magic = GLB_MAGIC_NUMBER, version = 2, lengthChange = 0, firstType = GLB_CHUNK_TYPE_JSON } :
	{ magic?: number, version?: number, lengthChange?: number, firstType?: number } = {} ) : File =>
{
	// The JSON is padded with spaces, the binary data with zeros.
	const json = new TextEncoder().encode ( text );
	const jsonLength = pad4 ( json.length );
	const binLength = ( bin ? pad4 ( bin.length ) : 0 );
	const length = 12 + 8 + jsonLength + ( bin ? ( 8 + binLength ) : 0 );

	const bytes = new Uint8Array ( length );
	const view = new DataView ( bytes.buffer );
	view.setUint32 ( 0, magic, true );
	view.setUint32 ( 4, version, true );
	view.setUint32 ( 8, ( length + lengthChange ), true );
	view.setUint32 ( 12, jsonLength, true );
	view.setUint32 ( 16, firstType, true );
	bytes.fill ( 0x20, 20, 20 + jsonLength );
	bytes.set ( json, 20 );
	if ( bin )
	{
		const start = 20 + jsonLength;
		view.setUint32 ( start, binLength, true );
		view.setUint32 ( start + 4, GLB_CHUNK_TYPE_BIN, true );
		bytes.set ( bin, start + 8 );
	}
	return new File ( [ bytes ], "test.glb" );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the file with the glTF reader.
 * @param {File} file The file.
 * @param {IProgressCallback} [progress] The progress callback.
 * @returns {Promise<SceneNode>} The scene.
 */
///////////////////////////////////////////////////////////////////////////////

export const read = async ( file: File, progress?: IProgressCallback ) : Promise < SceneNode > =>
{
	const ext = file.name.split ( "." ).pop()!;
	const reader = getReader ( ext )!();

	// Where there is no browser image decoder, like in Node, decode the PNGs
	// the tests make.
	if ( ( reader instanceof GLTF ) && ( "function" !== typeof createImageBitmap ) )
	{
		reader.imageDecoder = async ( bytes: Uint8Array ) => Promise.resolve ( decodePng ( bytes ) );
	}
	if ( progress )
	{
		reader.progress = progress;
	}
	return await reader.read ( file );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the error that the promise rejects with.
 * @param {Promise<unknown>} promise The promise.
 * @returns {Promise<Error>} The error.
 */
///////////////////////////////////////////////////////////////////////////////

export const getError = async ( promise: Promise < unknown > ) : Promise < Error > =>
{
	try
	{
		await promise;
	}
	catch ( error )
	{
		return ( error as Error );
	}
	throw new Error ( "Expected the promise to reject" );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the geometries in the scene, each one once.
 * @param {SceneNode} scene The scene.
 * @returns {Geometry[]} The geometries.
 */
///////////////////////////////////////////////////////////////////////////////

export const getGeometries = ( scene: SceneNode ) : Geometry[] =>
{
	const answer = new Set < Geometry > ();
	scene.traverse ( ( node ) =>
	{
		if ( node instanceof Geometry )
		{
			answer.add ( node );
		}
	} );
	return [ ...answer ];
};

// A triangle's points and indices.
export const TRIANGLE_POINTS = [ 0, 0, 0,   1, 0, 0,   0, 1, 0 ];
export const TRIANGLE_INDICES = [ 0, 1, 2 ];
