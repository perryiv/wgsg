///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Read the data of a binary PLY file.
//
//	After the header, the records of each element follow one another with
//	nothing between them. Each property is a number of the size its type
//	says. A list property is its count, then that many numbers.
//
//	The file is read in chunks, so it never has to be in memory all at once.
//	A record can be split between two chunks. When that happens, its start is
//	kept and read again with the next chunk.
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled } from "../../Cancelled";
import { getLayout, MeshBuilder } from "./Common";
import { getErrorMessage, readBytes, yieldToEventLoop } from "../../Functions";
import {
	getNumberSize,
	getRecordSize,
	type IPlyElement,
	type IPlyHeader,
	type IPlyNumberType,
} from "./Header";
import type { IProgressCallback } from "../../../Types";
import type { Group } from "../../../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants and types.
//
///////////////////////////////////////////////////////////////////////////////

// How much of the file to read at a time.
export const PLY_BINARY_CHUNK_BYTES = ( 4 * 1024 * 1024 );

// Reads a number at the byte offset.
type INumberGetter = ( view: DataView, offset: number, little: boolean ) => number;

// Reads a record at the byte offset and returns the offset after it, or -1
// if the record does not fit in the bytes we have.
type IRecordReader = ( view: DataView, offset: number ) => number;

// How to read each type of number.
const GETTERS: Record < IPlyNumberType, INumberGetter > = {
	int8: ( view, offset ) => view.getInt8 ( offset ),
	uint8: ( view, offset ) => view.getUint8 ( offset ),
	int16: ( view, offset, little ) => view.getInt16 ( offset, little ),
	uint16: ( view, offset, little ) => view.getUint16 ( offset, little ),
	int32: ( view, offset, little ) => view.getInt32 ( offset, little ),
	uint32: ( view, offset, little ) => view.getUint32 ( offset, little ),
	float32: ( view, offset, little ) => view.getFloat32 ( offset, little ),
	float64: ( view, offset, little ) => view.getFloat64 ( offset, little ),
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make sure a value is a finite number.
 * @param {number} value The value.
 * @param {string} name The name of the property, for the error message.
 * @returns {number} The value.
 */
///////////////////////////////////////////////////////////////////////////////

const checkFinite = ( value: number, name: string ) : number =>
{
	if ( false === Number.isFinite ( value ) )
	{
		throw new Error ( `Invalid value '${value}' for property '${name}'` );
	}
	return value;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the data of a binary PLY file and build the scene.
 * @param {File} file The file.
 * @param {IPlyHeader} header The header, which says the format is binary.
 * @param {IProgressCallback} onProgress Called with the bytes read and the
 * size of the file. If it returns false then reading stops.
 * @param {number} [chunkSize] How many bytes to read at a time.
 * @returns {Promise<Group>} The scene.
 */
///////////////////////////////////////////////////////////////////////////////

export const readBinary = async ( file: File, header: Readonly<IPlyHeader>, onProgress: IProgressCallback, chunkSize = PLY_BINARY_CHUNK_BYTES ) : Promise < Group > =>
{
	// Make sure.
	if ( "ascii" === header.format )
	{
		throw new Error ( "Reading an 'ascii' PLY file as binary" );
	}
	if ( ( false === Number.isSafeInteger ( chunkSize ) ) || ( chunkSize <= 0 ) )
	{
		throw new Error ( `Invalid chunk size: ${chunkSize}` );
	}
	const little = ( "binary_little_endian" === header.format );

	// Find the values we need, and make the builder for them.
	const layout = getLayout ( header );
	const { vertex, face, normal } = layout;
	const builder = new MeshBuilder ( { numVertices: vertex.count, hasNormals: ( null !== normal ) } );
	const { points, normals } = builder;

	// Where we are in the data.
	const { elements } = header;
	let elementIndex = 0;
	let recordIndex = 0;

	// Reused for each face.
	const faceIndices: number[] = [];

	// Reused for vertex records with lists.
	const values = new Float64Array ( 6 );

	/**
	 * Make the reader for records of the element that walks through its
	 * properties. It works for any element, and calls the function at the
	 * end with the numbers it was asked to keep.
	 * @param {IPlyElement} element The element.
	 * @param {number[]} keep The positions of the number properties to keep,
	 * which are put in the values array, in this order.
	 * @param {number} listToKeep The position of the list to put in the face
	 * indices array, or -1 for none.
	 * @param {Function} done Called when the whole record has been read.
	 * @returns {IRecordReader} The reader.
	 */
	const makeWalkingReader = ( element: Readonly<IPlyElement>, keep: number[], listToKeep: number, done: ( () => void ) ) : IRecordReader =>
	{
		const properties = element.properties.map ( ( property, i ) =>
		{
			const keepIndex = keep.indexOf ( i );
			if ( "number" === property.kind )
			{
				return { kind: property.kind, name: property.name, size: getNumberSize ( property.type ),
					get: GETTERS[property.type], keepIndex };
			}
			return { kind: property.kind, name: property.name, size: getNumberSize ( property.countType ),
				get: GETTERS[property.countType], itemSize: getNumberSize ( property.itemType ),
				getItem: GETTERS[property.itemType], keepList: ( i === listToKeep ) };
		} );

		return ( view: DataView, offset: number ) : number =>
		{
			const end = view.byteLength;
			for ( const property of properties )
			{
				// The number, or the count of the list.
				if ( ( offset + property.size ) > end )
				{
					return -1;
				}
				const value = property.get ( view, offset, little );
				offset += property.size;

				if ( "number" === property.kind )
				{
					if ( property.keepIndex >= 0 )
					{
						values[property.keepIndex] = value;
					}
					continue;
				}

				// The count has to be 0 or more. Signed types can be negative.
				if ( value < 0 )
				{
					throw new Error ( `Invalid count '${value}' for list '${property.name}'` );
				}

				// The items of the list.
				const itemSize = property.itemSize;
				if ( ( offset + ( value * itemSize ) ) > end )
				{
					return -1;
				}
				if ( property.keepList )
				{
					faceIndices.length = value;
					for ( let i = 0; i < value; ++i )
					{
						faceIndices[i] = property.getItem ( view, offset + ( i * itemSize ), little );
					}
				}
				offset += ( value * itemSize );
			}

			done();
			return offset;
		};
	};

	/**
	 * Make the reader for vertex records.
	 * @returns {IRecordReader} The reader.
	 */
	const makeVertexReader = () : IRecordReader =>
	{
		const keep = [ layout.x, layout.y, layout.z, ...( normal ?? [] ) ];
		const names = keep.map ( ( i ) => vertex.properties[i].name );
		const store = () =>
		{
			const i = recordIndex * 3;
			points[i    ] = checkFinite ( values[0], names[0] );
			points[i + 1] = checkFinite ( values[1], names[1] );
			points[i + 2] = checkFinite ( values[2], names[2] );
			if ( normals )
			{
				normals[i    ] = checkFinite ( values[3], names[3] );
				normals[i + 1] = checkFinite ( values[4], names[4] );
				normals[i + 2] = checkFinite ( values[5], names[5] );
			}
		};

		// Records with a list can have different sizes, so walk through them.
		const size = getRecordSize ( vertex );
		if ( null === size )
		{
			return makeWalkingReader ( vertex, keep, -1, store );
		}

		// Otherwise, read the values we need where they always are.
		const offsets: number[] = [];
		let offset = 0;
		const kept = vertex.properties.map ( ( property, i ) =>
		{
			offsets[i] = offset;
			if ( "number" !== property.kind )
			{
				throw new Error ( "Internal error, a fixed size record has a list" );
			}
			offset += getNumberSize ( property.type );
			return GETTERS[property.type];
		} );
		const getters = keep.map ( ( i ) => kept[i] );
		const starts = keep.map ( ( i ) => offsets[i] );
		const count = keep.length;

		return ( view: DataView, at: number ) : number =>
		{
			if ( ( at + size ) > view.byteLength )
			{
				return -1;
			}
			for ( let i = 0; i < count; ++i )
			{
				values[i] = getters[i] ( view, at + starts[i], little );
			}
			store();
			return ( at + size );
		};
	};

	// The reader for each element. Faces go to the builder, which checks the
	// indices. Other elements are read only to skip them.
	const readers = elements.map ( ( element ) : IRecordReader =>
	{
		if ( element === vertex )
		{
			return makeVertexReader();
		}
		if ( element === face )
		{
			return makeWalkingReader ( face, [], layout.faceIndices, () => { builder.addFace ( faceIndices ); } );
		}
		const size = getRecordSize ( element );
		if ( null !== size )
		{
			return ( view: DataView, at: number ) => ( ( ( at + size ) > view.byteLength ) ? -1 : ( at + size ) );
		}
		return makeWalkingReader ( element, [], -1, () => { /* Nothing to keep. */ } );
	} );

	// Skip elements with no records.
	const skipEmptyElements = () =>
	{
		while ( ( elementIndex < elements.length ) && ( recordIndex >= elements[elementIndex].count ) )
		{
			++elementIndex;
			recordIndex = 0;
		}
	};
	skipEmptyElements();

	// The bytes of a record that did not fit in the last chunk.
	let carry = new Uint8Array ( 0 );

	// Where the next chunk starts in the file.
	let fileOffset = header.dataOffset;

	// Read the chunks until we have all the records.
	while ( elementIndex < elements.length )
	{
		// Did the file end too soon?
		if ( fileOffset >= file.size )
		{
			const element = elements[elementIndex];
			throw new Error ( `The PLY file ended after ${recordIndex} of the ${element.count} records of element '${element.name}'` );
		}

		// Read the next chunk, after the carried bytes.
		const chunkEnd = Math.min ( fileOffset + chunkSize, file.size );
		const chunk = new Uint8Array ( await readBytes ( file, fileOffset, chunkEnd ) );
		let bytes = chunk;
		if ( carry.length > 0 )
		{
			bytes = new Uint8Array ( carry.length + chunk.length );
			bytes.set ( carry );
			bytes.set ( chunk, carry.length );
		}
		const bytesStart = fileOffset - carry.length;
		fileOffset = chunkEnd;

		// Read the records that fit.
		const view = new DataView ( bytes.buffer, bytes.byteOffset, bytes.byteLength );
		let offset = 0;
		try
		{
			while ( elementIndex < elements.length )
			{
				const next = readers[elementIndex] ( view, offset );
				if ( next < 0 )
				{
					break;
				}
				offset = next;
				++recordIndex;
				skipEmptyElements();
			}
		}
		catch ( error )
		{
			// Say where it happened.
			const element = elements[elementIndex];
			throw new Error ( `${getErrorMessage ( error )}, in ${element.name} ${recordIndex} at byte ${bytesStart + offset} of the PLY file` );
		}

		// Keep the bytes that were not used.
		carry = bytes.slice ( offset );

		// Report progress and check to see if reading was cancelled.
		if ( false === onProgress ( fileOffset, file.size ) )
		{
			throw new Cancelled ( "File reading was cancelled by the progress callback" );
		}

		// Let the page update before the next chunk.
		await yieldToEventLoop();
	}

	// Is there more data than the header said?
	const extra = carry.length + ( file.size - fileOffset );
	if ( extra > 0 )
	{
		throw new Error ( `There are ${extra} more bytes of data than the PLY header says` );
	}

	// Send the final progress notification.
	if ( false === onProgress ( file.size, file.size ) )
	{
		throw new Cancelled ( "File reading was cancelled by the progress callback" );
	}

	return builder.finish();
};
