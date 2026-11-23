///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Read the data of an ASCII PLY file.
//
//	After the header, each record of each element is one line, with the
//	values of its properties separated by spaces. A list property is its
//	count, then that many values. For example, a triangle is "3 0 1 2".
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled } from "../../Cancelled";
import { getLayout, MeshBuilder } from "./Common";
import { readBytes, readLines } from "../../Functions";
import type { IPlyElement, IPlyHeader } from "./Header";
import type { IProgressCallback } from "../../../Types";
import type { Group } from "../../../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Get a number from the text.
 * @param {string | undefined} text The text.
 * @param {string} name The name of the property, for the error message.
 * @returns {number} The number.
 */
///////////////////////////////////////////////////////////////////////////////

const parseNumber = ( text: ( string | undefined ), name: string ) : number =>
{
	const value = Number ( text );
	if ( ( undefined === text ) || ( false === Number.isFinite ( value ) ) )
	{
		throw new Error ( `Invalid value '${text}' for property '${name}'` );
	}
	return value;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Find where the values of each property start in a record, and make sure
 * the record has the right number of values.
 * @param {string[]} words The values in the record.
 * @param {IPlyElement} element The element.
 * @param {number[]} starts Where each property's values start.
 */
///////////////////////////////////////////////////////////////////////////////

const findStarts = ( words: string[], element: Readonly<IPlyElement>, starts: number[] ) : void =>
{
	let index = 0;
	const { properties } = element;
	const numProperties = properties.length;
	for ( let i = 0; i < numProperties; ++i )
	{
		const property = properties[i];
		starts[i] = index;
		if ( "number" === property.kind )
		{
			index += 1;
		}
		else
		{
			// The count of a list has to be an integer that is 0 or more.
			const text = words[index];
			const count = Number ( text );
			if ( ( undefined === text ) || ( false === Number.isSafeInteger ( count ) ) || ( count < 0 ) )
			{
				throw new Error ( `Invalid count '${text}' for list '${property.name}'` );
			}
			index += ( 1 + count );
		}
	}

	if ( index !== words.length )
	{
		throw new Error ( `There are ${words.length} values, but the properties of '${element.name}' need ${index}` );
	}
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the data of an ASCII PLY file and build the scene.
 * @param {File} file The file.
 * @param {IPlyHeader} header The header, which says the format is ASCII.
 * @param {IProgressCallback} onProgress Called with the bytes read and the
 * size of the file. If it returns false then reading stops.
 * @returns {Promise<Group>} The scene.
 */
///////////////////////////////////////////////////////////////////////////////

export const readText = async ( file: File, header: Readonly<IPlyHeader>, onProgress: IProgressCallback ) : Promise < Group > =>
{
	// Make sure.
	if ( "ascii" !== header.format )
	{
		throw new Error ( `Reading a '${header.format}' PLY file as text` );
	}

	// Find the values we need, and make the builder for them.
	const layout = getLayout ( header );
	const { vertex, face, normal } = layout;
	const builder = new MeshBuilder ( { numVertices: vertex.count, hasNormals: ( null !== normal ) } );
	const { points, normals } = builder;

	// The header's lines are skipped. Count them so that the data's line
	// numbers are the file's line numbers.
	const headerBytes = new Uint8Array ( await readBytes ( file, 0, header.dataOffset ) );
	let numHeaderLines = headerBytes.reduce ( ( count, byte ) => ( ( 10 === byte ) ? ( count + 1 ) : count ), 0 );
	if ( ( headerBytes.length > 0 ) && ( 10 !== headerBytes[headerBytes.length - 1] ) )
	{
		++numHeaderLines; // The file ends with "end_header" and no line ending.
	}

	// Where we are in the data.
	const { elements } = header;
	let elementIndex = 0;
	let recordIndex = 0;

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

	// Reused for each record.
	const starts: number[] = [];
	const faceIndices: number[] = [];

	// Read one record of the vertex element.
	const readVertex = ( words: string[] ) =>
	{
		findStarts ( words, vertex, starts );
		const i = recordIndex * 3;
		points[i    ] = parseNumber ( words[starts[layout.x]], "x" );
		points[i + 1] = parseNumber ( words[starts[layout.y]], "y" );
		points[i + 2] = parseNumber ( words[starts[layout.z]], "z" );
		if ( normal && normals )
		{
			normals[i    ] = parseNumber ( words[starts[normal[0]]], "nx" );
			normals[i + 1] = parseNumber ( words[starts[normal[1]]], "ny" );
			normals[i + 2] = parseNumber ( words[starts[normal[2]]], "nz" );
		}
	};

	// Read one record of the face element. The builder checks the indices.
	const readFace = ( words: string[] ) =>
	{
		findStarts ( words, face, starts );
		const start = starts[layout.faceIndices];
		const count = Number ( words[start] );
		const name = face.properties[layout.faceIndices].name;
		for ( let i = 0; i < count; ++i )
		{
			faceIndices[i] = parseNumber ( words[start + 1 + i], name );
		}
		builder.addFace ( faceIndices, count );
	};

	// Called for each line of the file.
	const onLine = ( line: string, lineNumber: number ) =>
	{
		// Skip the header, and empty lines.
		const text = line.trim();
		if ( ( lineNumber <= numHeaderLines ) || ( 0 === text.length ) )
		{
			return;
		}

		try
		{
			// Is there more data than the header said?
			if ( elementIndex >= elements.length )
			{
				throw new Error ( "There is more data than the PLY header says" );
			}

			// Read the record. Records of other elements are skipped.
			const element = elements[elementIndex];
			const words = text.split ( /\s+/ );
			if ( element === vertex )
			{
				readVertex ( words );
			}
			else if ( element === face )
			{
				readFace ( words );
			}

			// Go to the next record.
			++recordIndex;
			skipEmptyElements();
		}
		catch ( error )
		{
			// Say where it happened.
			const element = elements[elementIndex];
			const where = ( element ? `${element.name} ${recordIndex}` : "the end" );
			throw new Error ( `${( error as Error ).message}, in ${where} on line ${lineNumber} of the PLY file` );
		}
	};

	// Read the lines of the file. Throws if there is an error, or if the
	// progress callback cancels the reading.
	await readLines ( file, onLine, onProgress );

	// Did we get all the records?
	if ( elementIndex < elements.length )
	{
		const element = elements[elementIndex];
		throw new Error ( `The PLY file ended after ${recordIndex} of the ${element.count} records of element '${element.name}'` );
	}

	// Send the final progress notification.
	if ( false === onProgress ( file.size, file.size ) )
	{
		throw new Cancelled ( "File reading was cancelled by the progress callback" );
	}

	return builder.finish();
};
