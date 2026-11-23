///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for reading the header of a PLY file.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	findElement,
	getNumberSize,
	getRecordSize,
	parseHeader,
	PLY_MAX_HEADER_BYTES,
	readHeader,
	type IPlyHeader,
} from "../../../../lib/src/IO/Readers/PLY/Header";


///////////////////////////////////////////////////////////////////////////////
//
//	Headers like the ones in the Stanford scans: a binary one and an ASCII one.
//
///////////////////////////////////////////////////////////////////////////////

const BINARY_HEADER = [
	"ply",
	"format binary_big_endian 1.0",
	"element vertex 14027872",
	"property float x",
	"property float y",
	"property float z",
	"element face 28055742",
	"property list uchar int vertex_indices",
	"end_header",
	"",
].join ( "\n" );

const ASCII_HEADER = [
	"ply",
	"format ascii 1.0",
	"comment zipper output",
	"element vertex 35947",
	"property float x",
	"property float y",
	"property float z",
	"property float confidence",
	"property float intensity",
	"element face 69451",
	"property list uchar int vertex_indices",
	"end_header",
	"",
].join ( "\n" );


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Get the bytes of the text, which should be ASCII.
 * @param {string} text The text.
 * @returns {Uint8Array} The bytes.
 */
const toBytes = ( text: string ) : Uint8Array =>
{
	return new TextEncoder().encode ( text );
};

/**
 * Parse a header that should be valid and complete.
 * @param {string | Uint8Array} input The header, and maybe some data after it.
 * @returns {IPlyHeader} The header.
 */
const parse = ( input: ( string | Uint8Array ) ) : IPlyHeader =>
{
	const bytes = ( ( "string" === typeof input ) ? toBytes ( input ) : input );
	const header = parseHeader ( bytes );
	expect ( header ).to.not.be.null;
	return header!;
};

/**
 * Make a header from some lines, with "ply", the format, and "end_header".
 * @param {string[]} lines The lines between the format and "end_header".
 * @returns {string} The header.
 */
const makeHeader = ( lines: string[] ) : string =>
{
	return [ "ply", "format ascii 1.0", ...lines, "end_header", "" ].join ( "\n" );
};

/**
 * Get the error message thrown when parsing the header.
 * @param {string} text The header.
 * @returns {string} The error message.
 */
const getParseError = ( text: string ) : string =>
{
	try
	{
		parseHeader ( toBytes ( text ), true );
	}
	catch ( error )
	{
		return ( error as Error ).message;
	}
	throw new Error ( "Parsing the header did not throw" );
};

/**
 * Get the error message thrown when reading the header of the file.
 * @param {File} file The file.
 * @returns {Promise<string>} The error message.
 */
const getReadError = async ( file: File ) : Promise < string > =>
{
	try
	{
		await readHeader ( file );
	}
	catch ( error )
	{
		return ( error as Error ).message;
	}
	throw new Error ( "Reading the header did not throw" );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Header", function ()
	{
		describe ( "Parse", function ()
		{
			it ( "Should parse a binary header", function ()
			{
				const header = parse ( BINARY_HEADER );
				expect ( header ).to.deep.equal ( {
					format: "binary_big_endian",
					version: "1.0",
					elements: [
						{
							name: "vertex",
							count: 14027872,
							properties: [
								{ kind: "number", name: "x", type: "float32" },
								{ kind: "number", name: "y", type: "float32" },
								{ kind: "number", name: "z", type: "float32" },
							],
						},
						{
							name: "face",
							count: 28055742,
							properties: [
								{ kind: "list", name: "vertex_indices", countType: "uint8", itemType: "int32" },
							],
						},
					],
					comments: [],
					objInfo: [],
					dataOffset: BINARY_HEADER.length,
				} );
			} );

			it ( "Should parse an ASCII header with a comment", function ()
			{
				const header = parse ( ASCII_HEADER );
				expect ( header.format ).to.equal ( "ascii" );
				expect ( header.comments ).to.deep.equal ( [ "zipper output" ] );
				expect ( header.elements.map ( ( e ) => e.name ) ).to.deep.equal ( [ "vertex", "face" ] );
				expect ( header.elements[0].properties.map ( ( p ) => p.name ) ).to.deep.equal (
					[ "x", "y", "z", "confidence", "intensity" ] );
				expect ( header.dataOffset ).to.equal ( ASCII_HEADER.length );
			} );

			it ( "Should parse the little-endian format", function ()
			{
				const header = parse ( "ply\nformat binary_little_endian 1.0\nend_header\n" );
				expect ( header.format ).to.equal ( "binary_little_endian" );
				expect ( header.elements ).to.deep.equal ( [] );
			} );

			it ( "Should accept both names of each type", function ()
			{
				const pairs = [
					[ "char", "int8" ], [ "uchar", "uint8" ],
					[ "short", "int16" ], [ "ushort", "uint16" ],
					[ "int", "int32" ], [ "uint", "uint32" ],
					[ "float", "float32" ], [ "double", "float64" ],
				];
				const lines = [ "element thing 1" ];
				pairs.forEach ( ( [ a, b ], i ) =>
				{
					lines.push ( `property ${a} a${i}` );
					lines.push ( `property ${b} b${i}` );
				} );
				const properties = parse ( makeHeader ( lines ) ).elements[0].properties;
				pairs.forEach ( ( [ , type ], i ) =>
				{
					expect ( properties[i * 2] ).to.deep.equal ( { kind: "number", name: `a${i}`, type } );
					expect ( properties[i * 2 + 1] ).to.deep.equal ( { kind: "number", name: `b${i}`, type } );
				} );
			} );

			it ( "Should keep comment and obj_info text, wherever they are", function ()
			{
				const text = [
					"ply",
					"comment before the format",
					"format ascii 1.0",
					"obj_info num_cols 10",
					"element vertex 1",
					"comment  between   properties ",
					"property float x",
					"comment",
					"end_header",
					"",
				].join ( "\n" );
				const header = parse ( text );
				expect ( header.comments ).to.deep.equal ( [ "before the format", "between   properties", "" ] );
				expect ( header.objInfo ).to.deep.equal ( [ "num_cols 10" ] );
				expect ( header.elements[0].properties.length ).to.equal ( 1 );
			} );

			it ( "Should accept Windows line endings", function ()
			{
				const text = BINARY_HEADER.replace ( /\n/g, "\r\n" );
				const header = parse ( text );
				expect ( header.elements[1].count ).to.equal ( 28055742 );
				expect ( header.dataOffset ).to.equal ( text.length );
			} );

			it ( "Should accept extra spaces, tabs, and empty lines", function ()
			{
				const text = "ply\n  format \t ascii  1.0 \n\nelement\tvertex   3\n property   float\tx  \nend_header\n";
				const header = parse ( text );
				expect ( header.elements ).to.deep.equal ( [
					{ name: "vertex", count: 3, properties: [ { kind: "number", name: "x", type: "float32" } ] },
				] );
			} );

			it ( "Should accept an element with a count of zero", function ()
			{
				const header = parse ( makeHeader ( [ "element face 0", "property list uchar int vertex_indices" ] ) );
				expect ( header.elements[0].count ).to.equal ( 0 );
			} );

			it ( "Should give where the data starts, even when the data is in the bytes", function ()
			{
				// The binary data has the bytes of "\nend_header\n" in it.
				const data = toBytes ( "\x00\x01\nend_header\n\xff" );
				const bytes = new Uint8Array ( [ ...toBytes ( BINARY_HEADER ), ...data ] );
				expect ( parse ( bytes ).dataOffset ).to.equal ( BINARY_HEADER.length );
			} );

			it ( "Should only end at an 'end_header' line", function ()
			{
				const text = makeHeader ( [ "comment see end_header below", "comment end_header" ] );
				const header = parse ( text );
				expect ( header.comments ).to.deep.equal ( [ "see end_header below", "end_header" ] );
				expect ( header.dataOffset ).to.equal ( text.length );
				expect ( parseHeader ( toBytes ( "ply\nformat ascii 1.0\nend_headers\n" ), true ) ).to.be.null;
			} );

			it ( "Should return null when the bytes end before the header does", function ()
			{
				const bytes = toBytes ( BINARY_HEADER );
				for ( const end of [ 0, 2, 3, 20, bytes.length - 2, bytes.length - 1 ] )
				{
					expect ( parseHeader ( bytes.subarray ( 0, end ) ) ).to.be.null;
				}
			} );

			it ( "Should allow 'end_header' with no line ending at the end of the whole file", function ()
			{
				const text = "ply\nformat ascii 1.0\nend_header";
				expect ( parseHeader ( toBytes ( text ) ) ).to.be.null;
				expect ( parseHeader ( toBytes ( text ), true )?.dataOffset ).to.equal ( text.length );
			} );

			it ( "Should reject files that do not start with 'ply'", function ()
			{
				for ( const text of [ "", "pl", "PLY\n", "plyx\n", " ply\n", "solid stl\n" ] )
				{
					expect ( getParseError ( text ) ).to.equal ( "Not a PLY file, the first line is not 'ply'" );
				}

				// It should know right away, without looking for the end.
				expect ( () => parseHeader ( toBytes ( "solid" ) ) ).to.throw ( "Not a PLY file" );
			} );

			it ( "Should reject a bad format line", function ()
			{
				expect ( getParseError ( "ply\nend_header\n" ) ).to.equal ( "The PLY header has no 'format' line" );
				expect ( getParseError ( "ply\nformat ascii\nend_header\n" ) ).to.include ( "should be 'format <type> <version>'" );
				expect ( getParseError ( "ply\nformat text 1.0\nend_header\n" ) ).to.equal ( "Unknown PLY format 'text' on line 2" );
				expect ( getParseError ( "ply\nformat ascii 2.0\nend_header\n" ) ).to.equal ( "Unknown PLY version '2.0' on line 2" );
				expect ( getParseError ( makeHeader ( [ "format ascii 1.0" ] ) ) ).to.include ( "More than one 'format' line" );
			} );

			it ( "Should reject a bad element line", function ()
			{
				for ( const count of [ "-1", "1.5", "1e3", "abc", "0x10", "99999999999999999999" ] )
				{
					expect ( getParseError ( makeHeader ( [ `element vertex ${count}` ] ) ) ).to.equal (
						`Invalid count '${count}' for element 'vertex' on line 3` );
				}
				expect ( getParseError ( makeHeader ( [ "element vertex" ] ) ) ).to.include ( "should be 'element <name> <count>'" );
				expect ( getParseError ( makeHeader ( [ "element vertex 1 2" ] ) ) ).to.include ( "should be 'element <name> <count>'" );
				expect ( getParseError ( makeHeader ( [ "element vertex 1", "element vertex 2" ] ) ) ).to.equal (
					"Element 'vertex' is declared again on line 4" );
			} );

			it ( "Should reject a bad property line", function ()
			{
				expect ( getParseError ( makeHeader ( [ "property float x" ] ) ) ).to.equal (
					"Property on line 3 is not after an element" );
				expect ( getParseError ( makeHeader ( [ "element v 1", "property real x" ] ) ) ).to.equal (
					"Unknown type 'real' on line 4 of the PLY header" );
				expect ( getParseError ( makeHeader ( [ "element v 1", "property float" ] ) ) ).to.include (
					"should be 'property <type> <name>'" );
				expect ( getParseError ( makeHeader ( [ "element v 1", "property float x y" ] ) ) ).to.include (
					"should be 'property <type> <name>'" );
				expect ( getParseError ( makeHeader ( [ "element v 1", "property float x", "property double x" ] ) ) ).to.equal (
					"Property 'x' of element 'v' is declared again on line 5" );
			} );

			it ( "Should reject a bad list property line", function ()
			{
				expect ( getParseError ( makeHeader ( [ "element f 1", "property list uchar int" ] ) ) ).to.include (
					"should be 'property list <count type> <item type> <name>'" );
				expect ( getParseError ( makeHeader ( [ "element f 1", "property list uchar long i" ] ) ) ).to.equal (
					"Unknown type 'long' on line 4 of the PLY header" );
				expect ( getParseError ( makeHeader ( [ "element f 1", "property list float int i" ] ) ) ).to.equal (
					"The count type of a list can not be 'float', on line 4" );
				expect ( getParseError ( makeHeader ( [ "element f 1", "property list double int i" ] ) ) ).to.equal (
					"The count type of a list can not be 'double', on line 4" );
			} );

			it ( "Should reject an unknown keyword", function ()
			{
				expect ( getParseError ( makeHeader ( [ "vertex 1 2 3" ] ) ) ).to.equal (
					"Unknown keyword 'vertex' on line 3 of the PLY header" );
			} );
		} );

		describe ( "Helpers", function ()
		{
			it ( "Should give the size of each type of number", function ()
			{
				expect ( getNumberSize ( "int8" ) ).to.equal ( 1 );
				expect ( getNumberSize ( "uint8" ) ).to.equal ( 1 );
				expect ( getNumberSize ( "int16" ) ).to.equal ( 2 );
				expect ( getNumberSize ( "uint16" ) ).to.equal ( 2 );
				expect ( getNumberSize ( "int32" ) ).to.equal ( 4 );
				expect ( getNumberSize ( "uint32" ) ).to.equal ( 4 );
				expect ( getNumberSize ( "float32" ) ).to.equal ( 4 );
				expect ( getNumberSize ( "float64" ) ).to.equal ( 8 );
			} );

			it ( "Should give the record size, or null when there is a list", function ()
			{
				const binary = parse ( BINARY_HEADER );
				expect ( getRecordSize ( findElement ( binary, "vertex" )! ) ).to.equal ( 12 );
				expect ( getRecordSize ( findElement ( binary, "face" )! ) ).to.be.null;
				expect ( getRecordSize ( parse ( ASCII_HEADER ).elements[0] ) ).to.equal ( 20 );

				const mixed = parse ( makeHeader ( [ "element v 1", "property double x", "property uchar r", "property short s" ] ) );
				expect ( getRecordSize ( mixed.elements[0] ) ).to.equal ( 11 );

				const empty = parse ( makeHeader ( [ "element v 1" ] ) );
				expect ( getRecordSize ( empty.elements[0] ) ).to.equal ( 0 );
			} );

			it ( "Should find an element by name", function ()
			{
				const header = parse ( BINARY_HEADER );
				expect ( findElement ( header, "face" ) ).to.equal ( header.elements[1] );
				expect ( findElement ( header, "edge" ) ).to.be.null;
			} );
		} );

		describe ( "Read", function ()
		{
			it ( "Should read the header from a file with data after it", async function ()
			{
				const data = new Uint8Array ( 100000 ).fill ( 7 );
				const file = new File ( [ BINARY_HEADER, data ], "test.ply" );
				const header = await readHeader ( file );
				expect ( header.elements[0].count ).to.equal ( 14027872 );
				expect ( header.dataOffset ).to.equal ( BINARY_HEADER.length );
			} );

			it ( "Should read a file that is only a header", async function ()
			{
				const file = new File ( [ "ply\nformat ascii 1.0\nend_header" ], "test.ply" );
				const header = await readHeader ( file );
				expect ( header.dataOffset ).to.equal ( file.size );
			} );

			it ( "Should read a header that is bigger than the first read", async function ()
			{
				const comments = new Array < string > ( 1000 ).fill ( "comment This line makes the header longer." );
				const text = makeHeader ( [ ...comments, "element vertex 5", "property float x" ] );
				expect ( text.length ).to.be.greaterThan ( 4096 * 8 );

				const header = await readHeader ( new File ( [ text, new Uint8Array ( 1000 ) ], "test.ply" ) );
				expect ( header.comments.length ).to.equal ( 1000 );
				expect ( header.elements[0].count ).to.equal ( 5 );
				expect ( header.dataOffset ).to.equal ( text.length );
			} );

			it ( "Should read 'end_header' when a read ends in the middle of it", async function ()
			{
				// Make the first read of 4096 bytes end at each place in the line.
				const line = "end_header\r\n";
				for ( let i = 0; i <= line.length; ++i )
				{
					const start = "ply\nformat ascii 1.0\ncomment ";
					const padding = "x".repeat ( 4096 - start.length - 1 - i );
					const text = `${start}${padding}\n${line}`;
					const header = await readHeader ( new File ( [ text, "1 2 3\n" ], "test.ply" ) );
					expect ( header.dataOffset ).to.equal ( text.length );
				}
			} );

			it ( "Should reject a file with no 'end_header'", async function ()
			{
				const file = new File ( [ "ply\nformat ascii 1.0\nelement vertex 1\n" ], "test.ply" );
				expect ( await getReadError ( file ) ).to.equal ( "The PLY header has no 'end_header' line" );
			} );

			it ( "Should reject a file that is not PLY without reading it all", async function ()
			{
				const file = new File ( [ "solid stl\n", new Uint8Array ( PLY_MAX_HEADER_BYTES * 2 ) ], "test.ply" );
				expect ( await getReadError ( file ) ).to.equal ( "Not a PLY file, the first line is not 'ply'" );
			} );

			it ( "Should stop looking for the end of a header that is too big", async function ()
			{
				const file = new File ( [ "ply\nformat ascii 1.0\n", new Uint8Array ( PLY_MAX_HEADER_BYTES * 2 ).fill ( 32 ) ], "test.ply" );
				expect ( await getReadError ( file ) ).to.equal (
					`No 'end_header' line in the first ${PLY_MAX_HEADER_BYTES} bytes of the PLY file` );
			} );
		} );
	} );
}
