///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types and constants for the glTF reader. These are the parts of the glTF
//	2.0 JSON that the reader uses.
//	See: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// The GLB container.
export const GLB_FILE_HEADER_SIZE = 12;
export const GLB_CHUNK_HEADER_SIZE = 8;
export const GLB_MAGIC_NUMBER = 0x46546C67; // ASCII for "glTF".
export const GLB_CHUNK_TYPE_JSON = 0x4E4F534A; // ASCII for "JSON".
export const GLB_CHUNK_TYPE_BIN = 0x004E4942; // ASCII for "BIN".

// The component types of accessors.
export const GLTF_BYTE = 5120;
export const GLTF_UNSIGNED_BYTE = 5121;
export const GLTF_SHORT = 5122;
export const GLTF_UNSIGNED_SHORT = 5123;
export const GLTF_UNSIGNED_INT = 5125;
export const GLTF_FLOAT = 5126;

// The primitive modes.
export const GLTF_POINTS = 0;
export const GLTF_LINES = 1;
export const GLTF_LINE_LOOP = 2;
export const GLTF_LINE_STRIP = 3;
export const GLTF_TRIANGLES = 4;
export const GLTF_TRIANGLE_STRIP = 5;
export const GLTF_TRIANGLE_FAN = 6;

// The filters of samplers, which are OpenGL's.
export const GLTF_NEAREST = 9728;
export const GLTF_LINEAR = 9729;
export const GLTF_NEAREST_MIPMAP_NEAREST = 9984;
export const GLTF_LINEAR_MIPMAP_NEAREST = 9985;
export const GLTF_NEAREST_MIPMAP_LINEAR = 9986;
export const GLTF_LINEAR_MIPMAP_LINEAR = 9987;

// The wrap modes of samplers, which are OpenGL's.
export const GLTF_CLAMP_TO_EDGE = 33071;
export const GLTF_MIRRORED_REPEAT = 33648;
export const GLTF_REPEAT = 10497;

// The number of components for each accessor type.
export const GLTF_NUM_COMPONENTS: Readonly<Record<string, number>> = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

// The extensions that files can require and still be read. The reader
// handles quantized vertices (KHR_mesh_quantization). The others only
// change lights, materials, or textures, which it ignores.
export const GLTF_SUPPORTED_EXTENSIONS: Readonly<Set<string>> = new Set ( [
	"KHR_lights_punctual",
	"KHR_mesh_quantization",
	"KHR_texture_basisu",
	"KHR_texture_transform",
	"EXT_texture_avif",
	"EXT_texture_webp",
] );

// Any extension that starts with this only changes the materials.
export const GLTF_MATERIAL_EXTENSION_PREFIX = "KHR_materials_";


///////////////////////////////////////////////////////////////////////////////
//
//	The JSON.
//
///////////////////////////////////////////////////////////////////////////////

export interface IGltfAsset
{
	version: string;
	minVersion?: string;
}

export interface IGltfBuffer
{
	uri?: string;
	byteLength: number;
}

export interface IGltfBufferView
{
	buffer: number;
	byteOffset?: number;
	byteLength: number;
	byteStride?: number;
}

export interface IGltfSparse
{
	count: number;
	indices: { bufferView: number, byteOffset?: number, componentType: number };
	values: { bufferView: number, byteOffset?: number };
}

export interface IGltfAccessor
{
	bufferView?: number;
	byteOffset?: number;
	componentType: number;
	normalized?: boolean;
	count: number;
	type: string;
	sparse?: IGltfSparse;
}

export interface IGltfPrimitive
{
	attributes: Record<string, number>;
	indices?: number;
	material?: number;
	mode?: number;
}

export interface IGltfMesh
{
	name?: string;
	primitives: IGltfPrimitive[];
}

export interface IGltfTextureInfo
{
	index: number;
	texCoord?: number;
}

export interface IGltfMaterial
{
	name?: string;
	pbrMetallicRoughness?: {
		baseColorFactor?: number[];
		baseColorTexture?: IGltfTextureInfo;
		metallicFactor?: number;
		roughnessFactor?: number;
		metallicRoughnessTexture?: IGltfTextureInfo;
	};
	emissiveFactor?: number[];
	emissiveTexture?: IGltfTextureInfo;
	alphaMode?: string;
	alphaCutoff?: number;
	doubleSided?: boolean;
	extensions?: {
		KHR_materials_clearcoat?: { clearcoatFactor?: number, clearcoatRoughnessFactor?: number };
		KHR_materials_emissive_strength?: { emissiveStrength?: number };
		KHR_materials_transmission?: { transmissionFactor?: number };
	};
}

export interface IGltfImage
{
	name?: string;
	uri?: string;
	mimeType?: string;
	bufferView?: number;
}

export interface IGltfSampler
{
	magFilter?: number;
	minFilter?: number;
	wrapS?: number;
	wrapT?: number;
}

export interface IGltfTexture
{
	name?: string;
	sampler?: number;
	source?: number;
}

export interface IGltfNode
{
	name?: string;
	children?: number[];
	mesh?: number;
	matrix?: number[];
	translation?: number[];
	rotation?: number[];
	scale?: number[];
}

export interface IGltfScene
{
	name?: string;
	nodes?: number[];
}

export interface IGltfJson
{
	asset: IGltfAsset;
	buffers?: IGltfBuffer[];
	bufferViews?: IGltfBufferView[];
	accessors?: IGltfAccessor[];
	meshes?: IGltfMesh[];
	materials?: IGltfMaterial[];
	textures?: IGltfTexture[];
	images?: IGltfImage[];
	samplers?: IGltfSampler[];
	nodes?: IGltfNode[];
	scenes?: IGltfScene[];
	scene?: number;
	extensionsUsed?: string[];
	extensionsRequired?: string[];
}


///////////////////////////////////////////////////////////////////////////////
//
//	The JSON and the binary data of its buffers, which is what both kinds of
//	files hold once they are unpacked.
//
///////////////////////////////////////////////////////////////////////////////

export interface IGltfData
{
	json: IGltfJson;
	buffers: Uint8Array[];
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get an item from one of the arrays in the JSON, and throw a helpful error
 * if it is not there.
 * @param {T[] | undefined} array The array, which may be missing.
 * @param {number} index The index of the item.
 * @param {string} what The name of the array, for the error.
 * @returns {T} The item.
 */
///////////////////////////////////////////////////////////////////////////////

export const getItem = < T > ( array: ( readonly T[] | undefined ), index: number, what: string ) : T =>
{
	if ( ( false === Number.isInteger ( index ) ) || ( index < 0 ) || ( !array ) || ( index >= array.length ) )
	{
		throw new Error ( `There is no ${what} ${index}, there are ${array?.length ?? 0}` );
	}
	return array[index];
};
