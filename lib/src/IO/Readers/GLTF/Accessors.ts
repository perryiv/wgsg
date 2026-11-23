///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Read the values of glTF accessors. An accessor says where its values are
//	in a buffer view, which says where it is in a buffer. The values of one
//	accessor can be interleaved with others, so there can be bytes between
//	them. A sparse accessor replaces some of its values with others.
//
//	This assumes that the computer is little-endian, like glTF and all the
//	computers that run web browsers.
//
///////////////////////////////////////////////////////////////////////////////

import {
	getItem,
	GLTF_BYTE,
	GLTF_FLOAT,
	GLTF_NUM_COMPONENTS,
	GLTF_SHORT,
	GLTF_UNSIGNED_BYTE,
	GLTF_UNSIGNED_INT,
	GLTF_UNSIGNED_SHORT,
	type IGltfAccessor,
	type IGltfData,
} from "./Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IGltfTypedArray = ( Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array );

interface ITypedArrayConstructor
{
	new ( length: number ) : IGltfTypedArray;
	new ( buffer: ArrayBufferLike, byteOffset: number, length: number ) : IGltfTypedArray;
	readonly BYTES_PER_ELEMENT: number;
}

// The typed array for each component type.
const ARRAY_TYPES: Readonly<Record<number, ITypedArrayConstructor>> = {
	[GLTF_BYTE]: Int8Array,
	[GLTF_UNSIGNED_BYTE]: Uint8Array,
	[GLTF_SHORT]: Int16Array,
	[GLTF_UNSIGNED_SHORT]: Uint16Array,
	[GLTF_UNSIGNED_INT]: Uint32Array,
	[GLTF_FLOAT]: Float32Array,
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the typed array for the component type.
 * @param {number} componentType The component type.
 * @returns {ITypedArrayConstructor} The typed array.
 */
///////////////////////////////////////////////////////////////////////////////

const getArrayType = ( componentType: number ) : ITypedArrayConstructor =>
{
	const ArrayType = ARRAY_TYPES[componentType];
	if ( !ArrayType )
	{
		throw new Error ( `Unknown accessor component type ${componentType}` );
	}
	return ArrayType;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Copy values from a buffer view into the array.
 * @param {object} input The input.
 * @param {IGltfData} input.data The JSON and the buffers.
 * @param {number} input.bufferView The index of the buffer view.
 * @param {number} input.byteOffset Where the first value is in the buffer view.
 * @param {number} input.count The number of elements.
 * @param {number} input.numComponents The number of components in each element.
 * @param {IGltfTypedArray} input.values Where to put the values, which has the right type and size.
 * @param {boolean} input.packed True if the values are always tightly packed, so the view's stride is not used.
 */
///////////////////////////////////////////////////////////////////////////////

const copyValues = ( { data, bufferView, byteOffset, count, numComponents, values, packed } : {
	data: Readonly<IGltfData>, bufferView: number, byteOffset: number, count: number,
	numComponents: number, values: IGltfTypedArray, packed: boolean } ) : void =>
{
	// Shortcuts.
	const view = getItem ( data.json.bufferViews, bufferView, "buffer view" );
	const buffer = getItem ( data.buffers, view.buffer, "buffer" );
	const itemSize = values.BYTES_PER_ELEMENT;
	const elementSize = numComponents * itemSize;
	const stride = ( ( ( !packed ) && view.byteStride ) ? view.byteStride : elementSize );
	const viewOffset = ( view.byteOffset ?? 0 );

	// Handle nothing to copy.
	if ( count <= 0 )
	{
		return;
	}

	// Make sure the values are in the buffer view, and it is in the buffer.
	if ( stride < elementSize )
	{
		throw new Error ( `Buffer view ${bufferView} has a stride of ${stride} bytes, but each element has ${elementSize}` );
	}
	if ( ( viewOffset + view.byteLength ) > buffer.length )
	{
		throw new Error ( `Buffer view ${bufferView} goes past the end of buffer ${view.buffer}` );
	}
	if ( ( byteOffset + ( stride * ( count - 1 ) ) + elementSize ) > view.byteLength )
	{
		throw new Error ( `${count} elements of ${elementSize} bytes go past the end of buffer view ${bufferView}` );
	}

	// Where the first value is in the buffer's ArrayBuffer.
	const start = buffer.byteOffset + viewOffset + byteOffset;

	// If the values line up with their size then read them as their type.
	if ( ( 0 === ( start % itemSize ) ) && ( 0 === ( stride % itemSize ) ) )
	{
		const strideItems = stride / itemSize;
		const ArrayType = values.constructor as ITypedArrayConstructor;
		const source = new ArrayType ( buffer.buffer, start, ( strideItems * ( count - 1 ) ) + numComponents );

		// Copy them all at once if they are packed.
		if ( strideItems === numComponents )
		{
			values.set ( source );
			return;
		}

		// Otherwise skip what's between them.
		for ( let i = 0; i < count; ++i )
		{
			const from = i * strideItems;
			const to = i * numComponents;
			for ( let j = 0; j < numComponents; ++j )
			{
				values[to + j] = source[from + j];
			}
		}
		return;
	}

	// Otherwise copy the bytes. This is slower, but they don't have to line up.
	const bytes = new Uint8Array ( values.buffer, values.byteOffset, values.byteLength );
	const source = buffer.buffer;
	const sourceBytes = new Uint8Array ( source, buffer.byteOffset, buffer.byteLength );
	const first = viewOffset + byteOffset;
	for ( let i = 0; i < count; ++i )
	{
		const from = first + ( i * stride );
		const to = i * elementSize;
		for ( let j = 0; j < elementSize; ++j )
		{
			bytes[to + j] = sourceBytes[from + j];
		}
	}
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the values of an accessor, as its component type, packed together.
 * @param {IGltfData} data The JSON and the buffers.
 * @param {number} index The index of the accessor.
 * @returns {{ accessor: IGltfAccessor, values: IGltfTypedArray }} The accessor and its values.
 */
///////////////////////////////////////////////////////////////////////////////

export const readAccessor = ( data: Readonly<IGltfData>, index: number ) : { accessor: IGltfAccessor, values: IGltfTypedArray } =>
{
	// Get the accessor.
	const accessor = getItem ( data.json.accessors, index, "accessor" );
	const { count, type, componentType, sparse } = accessor;

	// Check it.
	const numComponents = GLTF_NUM_COMPONENTS[type];
	if ( !numComponents )
	{
		throw new Error ( `Accessor ${index} has unknown type '${type}'` );
	}
	if ( ( false === Number.isSafeInteger ( count ) ) || ( count < 0 ) )
	{
		throw new Error ( `Accessor ${index} has invalid count ${count}` );
	}

	// Make the array. Without a buffer view the values are zero.
	const ArrayType = getArrayType ( componentType );
	const values = new ArrayType ( count * numComponents );

	// Copy the values from the buffer view.
	if ( undefined !== accessor.bufferView )
	{
		copyValues ( { data, bufferView: accessor.bufferView, byteOffset: ( accessor.byteOffset ?? 0 ),
			count, numComponents, values, packed: false } );
	}

	// Replace some of them if the accessor is sparse.
	if ( sparse )
	{
		// The indices of the elements to replace.
		const IndexType = getArrayType ( sparse.indices.componentType );
		const indices = new IndexType ( sparse.count );
		copyValues ( { data, bufferView: sparse.indices.bufferView, byteOffset: ( sparse.indices.byteOffset ?? 0 ),
			count: sparse.count, numComponents: 1, values: indices, packed: true } );

		// The new values.
		const replacements = new ArrayType ( sparse.count * numComponents );
		copyValues ( { data, bufferView: sparse.values.bufferView, byteOffset: ( sparse.values.byteOffset ?? 0 ),
			count: sparse.count, numComponents, values: replacements, packed: true } );

		// Replace them.
		for ( let i = 0; i < sparse.count; ++i )
		{
			const element = indices[i];
			if ( element >= count )
			{
				throw new Error ( `Sparse accessor ${index} replaces element ${element}, but it has ${count}` );
			}
			for ( let j = 0; j < numComponents; ++j )
			{
				values[( element * numComponents ) + j] = replacements[( i * numComponents ) + j];
			}
		}
	}

	return { accessor, values };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read an accessor as floating-point vectors, like the points or normals.
 * Integers are converted, and normalized integers are scaled like the GPU
 * would, so that the largest value is 1.
 * @param {IGltfData} data The JSON and the buffers.
 * @param {number} index The index of the accessor.
 * @param {string} type The type the accessor has to be, like "VEC3".
 * @returns {Float32Array} The values.
 */
///////////////////////////////////////////////////////////////////////////////

export const readFloats = ( data: Readonly<IGltfData>, index: number, type: string ) : Float32Array =>
{
	const { accessor, values } = readAccessor ( data, index );

	// Check the type.
	if ( type !== accessor.type )
	{
		throw new Error ( `Accessor ${index} should be a ${type}, not a ${accessor.type}` );
	}

	// Floats are already done.
	if ( values instanceof Float32Array )
	{
		return values;
	}

	// Integers that are not normalized keep their values.
	if ( true !== accessor.normalized )
	{
		return Float32Array.from ( values );
	}

	// The value that becomes 1.
	let scale: number;
	switch ( accessor.componentType )
	{
		case GLTF_BYTE: scale = 127; break;
		case GLTF_UNSIGNED_BYTE: scale = 255; break;
		case GLTF_SHORT: scale = 32767; break;
		case GLTF_UNSIGNED_SHORT: scale = 65535; break;
		default:
		{
			throw new Error ( `Accessor ${index} can't be normalized with component type ${accessor.componentType}` );
		}
	}

	// Convert them. The smallest signed integer is one past -1, so clamp.
	const answer = new Float32Array ( values.length );
	for ( let i = 0; i < values.length; ++i )
	{
		answer[i] = Math.max ( values[i] / scale, -1 );
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read an accessor as vertex indices. WebGPU has no 8-bit indices, so
 * those become 16-bit.
 * @param {IGltfData} data The JSON and the buffers.
 * @param {number} index The index of the accessor.
 * @returns {Uint16Array | Uint32Array} The indices.
 */
///////////////////////////////////////////////////////////////////////////////

export const readIndices = ( data: Readonly<IGltfData>, index: number ) : ( Uint16Array | Uint32Array ) =>
{
	const { accessor, values } = readAccessor ( data, index );

	// Check the type.
	if ( "SCALAR" !== accessor.type )
	{
		throw new Error ( `Index accessor ${index} should be a SCALAR, not a ${accessor.type}` );
	}

	if ( ( values instanceof Uint16Array ) || ( values instanceof Uint32Array ) )
	{
		return values;
	}
	if ( values instanceof Uint8Array )
	{
		return Uint16Array.from ( values );
	}
	throw new Error ( `Index accessor ${index} has component type ${accessor.componentType}, which is not an unsigned integer` );
};
