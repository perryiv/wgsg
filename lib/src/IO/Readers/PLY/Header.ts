///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Read the header of a PLY file.
//	See: https://paulbourke.net/dataformats/ply/
//
//	A header is lines of ASCII text, like this:
//
//		ply
//		format binary_big_endian 1.0
//		comment Any text.
//		element vertex 14027872
//		property float x
//		property float y
//		property float z
//		element face 28055742
//		property list uchar int vertex_indices
//		end_header
//
//	The data comes right after the "end_header" line. It has the elements in
//	the order they are declared. Each record has the properties in order.
//
///////////////////////////////////////////////////////////////////////////////

import { findBytes, readBytes } from "../../Functions";


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

// How the data after the header is stored.
export type IPlyFormat = ( "ascii" | "binary_little_endian" | "binary_big_endian" );

// The types of numbers. Files can use either name for a type, like "uchar"
// or "uint8", but the header always has the names in this list.
export type IPlyNumberType = (
	"int8" | "uint8" |
	"int16" | "uint16" |
	"int32" | "uint32" |
	"float32" | "float64"
);

// A property with one number, like "property float x".
export interface IPlyNumberProperty
{
	kind: "number";
	name: string;
	type: IPlyNumberType;
}

// A property with a count and then that many numbers, like
// "property list uchar int vertex_indices".
export interface IPlyListProperty
{
	kind: "list";
	name: string;
	countType: IPlyNumberType;
	itemType: IPlyNumberType;
}

export type IPlyProperty = ( IPlyNumberProperty | IPlyListProperty );

// A kind of record, like "element vertex 14027872", and its properties.
export interface IPlyElement
{
	name: string;
	count: number;
	properties: IPlyProperty[];
}

// Everything in the header.
export interface IPlyHeader
{
	format: IPlyFormat;
	version: string;
	elements: IPlyElement[];
	comments: string[];
	objInfo: string[];
	dataOffset: number; // The byte offset where the data starts.
}


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// Both names for each type of number, and its size in bytes.
const NUMBER_TYPES = new Map < string, IPlyNumberType > ( [
	[ "char", "int8" ], [ "int8", "int8" ],
	[ "uchar", "uint8" ], [ "uint8", "uint8" ],
	[ "short", "int16" ], [ "int16", "int16" ],
	[ "ushort", "uint16" ], [ "uint16", "uint16" ],
	[ "int", "int32" ], [ "int32", "int32" ],
	[ "uint", "uint32" ], [ "uint32", "uint32" ],
	[ "float", "float32" ], [ "float32", "float32" ],
	[ "double", "float64" ], [ "float64", "float64" ],
] );
const NUMBER_SIZES: Record < IPlyNumberType, number > = {
	int8: 1, uint8: 1,
	int16: 2, uint16: 2,
	int32: 4, uint32: 4,
	float32: 4, float64: 8,
};

const FORMATS = new Set < string > ( [ "ascii", "binary_little_endian", "binary_big_endian" ] );

// A header bigger than this is surely not a PLY file.
export const PLY_MAX_HEADER_BYTES = ( 1024 * 1024 );


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the size in bytes of a type of number.
 * @param {IPlyNumberType} type The type of number.
 * @returns {number} The size in bytes.
 */
///////////////////////////////////////////////////////////////////////////////

export const getNumberSize = ( type: IPlyNumberType ) : number =>
{
	return NUMBER_SIZES[type];
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the size in bytes of one binary record of an element. Records with a
 * list property can have different sizes, so this returns null for them.
 * @param {IPlyElement} element The element.
 * @returns {number | null} The size in bytes, or null if it varies.
 */
///////////////////////////////////////////////////////////////////////////////

export const getRecordSize = ( element: Readonly<IPlyElement> ) : ( number | null ) =>
{
	let size = 0;
	for ( const property of element.properties )
	{
		if ( "list" === property.kind )
		{
			return null;
		}
		size += NUMBER_SIZES[property.type];
	}
	return size;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Find an element by name.
 * @param {IPlyHeader} header The header.
 * @param {string} name The name of the element, like "vertex".
 * @returns {IPlyElement | null} The element, or null if there is none.
 */
///////////////////////////////////////////////////////////////////////////////

export const findElement = ( header: Readonly<IPlyHeader>, name: string ) : ( IPlyElement | null ) =>
{
	return ( header.elements.find ( ( element ) => ( name === element.name ) ) ?? null );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the type of number from its name in the header.
 * @param {string | undefined} name The name, like "float" or "float32".
 * @param {number} lineNumber The line number, for the error message.
 * @returns {IPlyNumberType} The type of number.
 */
///////////////////////////////////////////////////////////////////////////////

const getNumberType = ( name: ( string | undefined ), lineNumber: number ) : IPlyNumberType =>
{
	const type = ( ( undefined === name ) ? undefined : NUMBER_TYPES.get ( name ) );
	if ( !type )
	{
		throw new Error ( `Unknown type '${name}' on line ${lineNumber} of the PLY header` );
	}
	return type;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Find where the header ends. That is just after the line "end_header",
 * which must be at the start of a line and end with "\n" or "\r\n".
 * @param {Uint8Array} bytes The bytes at the start of the file.
 * @param {boolean} isWholeFile True if the bytes are the whole file, so the
 * "end_header" line can be the last line, with no line ending.
 * @returns {{ headerEnd: number, dataOffset: number } | null} Where the
 * "end_header" line starts and where the data starts, or null if it is not
 * found in these bytes.
 */
///////////////////////////////////////////////////////////////////////////////

const findHeaderEnd = ( bytes: Readonly<Uint8Array>, isWholeFile: boolean ) : ( { headerEnd: number, dataOffset: number } | null ) =>
{
	const keyword = "end_header";
	const LF = 10;
	const CR = 13;
	let from = 0;

	while ( true )
	{
		const start = findBytes ( bytes, keyword, from );
		if ( -1 === start )
		{
			return null;
		}
		from = start + 1;

		// It has to be at the start of a line.
		if ( ( start > 0 ) && ( LF !== bytes[start - 1] ) )
		{
			continue;
		}

		// Then the line has to end. More bytes are needed to tell when the
		// keyword is at the very end of what we have.
		let end = start + keyword.length;
		if ( CR === bytes[end] )
		{
			++end;
		}
		if ( LF === bytes[end] )
		{
			return { headerEnd: start, dataOffset: ( end + 1 ) };
		}
		if ( end >= bytes.length )
		{
			return ( isWholeFile ? { headerEnd: start, dataOffset: bytes.length } : null );
		}

		// Something else follows, like "end_headers", so keep looking.
	}
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Parse the header from the bytes at the start of a PLY file.
 * @param {Uint8Array} bytes The bytes at the start of the file. They must
 * include the whole header, and can include some or all of the data.
 * @param {boolean} [isWholeFile] True if the bytes are the whole file.
 * @returns {IPlyHeader | null} The header, or null if the bytes end before
 * the header does. Throws if the header is not valid.
 */
///////////////////////////////////////////////////////////////////////////////

export const parseHeader = ( bytes: Readonly<Uint8Array>, isWholeFile = false ) : ( IPlyHeader | null ) =>
{
	// Check the first line before looking for the end, so that other files
	// are rejected quickly.
	const MAGIC = "ply";
	const LF = 10;
	const CR = 13;
	const magicEnd = MAGIC.length;
	if ( ( bytes.length > magicEnd ) || isWholeFile )
	{
		let i = 0;
		while ( ( i < magicEnd ) && ( bytes[i] === MAGIC.charCodeAt ( i ) ) )
		{
			++i;
		}
		const next = bytes[magicEnd];
		if ( ( i < magicEnd ) || ( ( LF !== next ) && ( CR !== next ) ) )
		{
			throw new Error ( "Not a PLY file, the first line is not 'ply'" );
		}
	}

	// Find the end of the header.
	const found = findHeaderEnd ( bytes, isWholeFile );
	if ( !found )
	{
		return null;
	}

	// The header is ASCII, so decoding each byte as a character is fine.
	const text = new TextDecoder ( "latin1" ).decode ( bytes.subarray ( 0, found.headerEnd ) );
	const lines = text.split ( /\r?\n/ );

	// What we fill in.
	let format: ( IPlyFormat | null ) = null;
	let version = "";
	const elements: IPlyElement[] = [];
	const comments: string[] = [];
	const objInfo: string[] = [];

	// Skip the first line, which we already checked, and the empty line after
	// the last line ending.
	const numLines = lines.length;
	for ( let i = 1; i < numLines; ++i )
	{
		const lineNumber = i + 1;
		const line = lines[i];

		// Comments keep their text as it is, but without the keyword.
		const keyword = line.trim().split ( /\s+/ )[0];
		if ( ( "comment" === keyword ) || ( "obj_info" === keyword ) )
		{
			const rest = line.trim().substring ( keyword.length ).trim();
			( ( "comment" === keyword ) ? comments : objInfo ).push ( rest );
			continue;
		}

		// Other lines are words separated by spaces.
		const words = line.trim().split ( /\s+/ );
		switch ( words[0] )
		{
			case "":
			{
				// Allow empty lines, including the one at the end.
				break;
			}
			case "format":
			{
				if ( format )
				{
					throw new Error ( `More than one 'format' line in the PLY header, the second is on line ${lineNumber}` );
				}
				if ( 3 !== words.length )
				{
					throw new Error ( `Line ${lineNumber} of the PLY header should be 'format <type> <version>'` );
				}
				if ( false === FORMATS.has ( words[1] ) )
				{
					throw new Error ( `Unknown PLY format '${words[1]}' on line ${lineNumber}` );
				}
				if ( "1.0" !== words[2] )
				{
					throw new Error ( `Unknown PLY version '${words[2]}' on line ${lineNumber}` );
				}
				format = ( words[1] as IPlyFormat );
				version = words[2];
				break;
			}
			case "element":
			{
				if ( 3 !== words.length )
				{
					throw new Error ( `Line ${lineNumber} of the PLY header should be 'element <name> <count>'` );
				}
				const name = words[1];
				const count = Number ( words[2] );
				if ( ( false === /^\d+$/.test ( words[2] ) ) || ( false === Number.isSafeInteger ( count ) ) )
				{
					throw new Error ( `Invalid count '${words[2]}' for element '${name}' on line ${lineNumber}` );
				}
				if ( elements.some ( ( element ) => ( name === element.name ) ) )
				{
					throw new Error ( `Element '${name}' is declared again on line ${lineNumber}` );
				}
				elements.push ( { name, count, properties: [] } );
				break;
			}
			case "property":
			{
				const element = elements[elements.length - 1];
				if ( !element )
				{
					throw new Error ( `Property on line ${lineNumber} is not after an element` );
				}

				let property: IPlyProperty;
				if ( "list" === words[1] )
				{
					if ( 5 !== words.length )
					{
						throw new Error ( `Line ${lineNumber} of the PLY header should be 'property list <count type> <item type> <name>'` );
					}
					const countType = getNumberType ( words[2], lineNumber );
					if ( ( "float32" === countType ) || ( "float64" === countType ) )
					{
						throw new Error ( `The count type of a list can not be '${words[2]}', on line ${lineNumber}` );
					}
					const itemType = getNumberType ( words[3], lineNumber );
					property = { kind: "list", name: words[4], countType, itemType };
				}
				else
				{
					if ( 3 !== words.length )
					{
						throw new Error ( `Line ${lineNumber} of the PLY header should be 'property <type> <name>'` );
					}
					property = { kind: "number", name: words[2], type: getNumberType ( words[1], lineNumber ) };
				}

				if ( element.properties.some ( ( p ) => ( property.name === p.name ) ) )
				{
					throw new Error ( `Property '${property.name}' of element '${element.name}' is declared again on line ${lineNumber}` );
				}
				element.properties.push ( property );
				break;
			}
			default:
			{
				throw new Error ( `Unknown keyword '${words[0]}' on line ${lineNumber} of the PLY header` );
			}
		}
	}

	// The format is required.
	if ( !format )
	{
		throw new Error ( "The PLY header has no 'format' line" );
	}

	return { format, version, elements, comments, objInfo, dataOffset: found.dataOffset };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Read the header of a PLY file. This reads only the start of the file,
 * reading more as needed, up to PLY_MAX_HEADER_BYTES.
 * @param {File} file The file.
 * @returns {Promise<IPlyHeader>} The header.
 */
///////////////////////////////////////////////////////////////////////////////

export const readHeader = async ( file: File ) : Promise < IPlyHeader > =>
{
	let size = 4096;
	while ( true )
	{
		const end = Math.min ( size, file.size );
		const isWholeFile = ( end >= file.size );
		const bytes = new Uint8Array ( await readBytes ( file, 0, end ) );
		const header = parseHeader ( bytes, isWholeFile );
		if ( header )
		{
			return header;
		}
		if ( isWholeFile )
		{
			throw new Error ( "The PLY header has no 'end_header' line" );
		}
		if ( end >= PLY_MAX_HEADER_BYTES )
		{
			throw new Error ( `No 'end_header' line in the first ${PLY_MAX_HEADER_BYTES} bytes of the PLY file` );
		}
		size = Math.min ( size * 2, PLY_MAX_HEADER_BYTES );
	}
};
