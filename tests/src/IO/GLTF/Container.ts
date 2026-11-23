///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test unpacking .glb and .gltf files.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { getReader } from "../../../../lib/src/IO";
import { GLTF } from "../../../../lib/src/IO/Readers/GLTF";
import {
	decodeDataUri,
	parseJson,
	readGlb,
	readGltf,
} from "../../../../lib/src/IO/Readers/GLTF/Container";
import {
	GLB_CHUNK_TYPE_BIN,
	GLB_MAGIC_NUMBER,
} from "../../../../lib/src/IO/Readers/GLTF/Types";
import {
	getError,
	GltfMaker,
	makeGlb,
	TRIANGLE_POINTS,
} from "./Helpers";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Container", function ()
	{
		it ( "Should register the reader for .glb and .gltf files", function ()
		{
			for ( const ext of [ "glb", "GLB", "gltf", "GLTF" ] )
			{
				expect ( getReader ( ext )!() ).to.be.instanceOf ( GLTF );
			}
		} );

		describe ( "JSON", function ()
		{
			it ( "Should parse version 2", function ()
			{
				expect ( parseJson ( '{ "asset": { "version": "2.0" } }' ).asset.version ).to.equal ( "2.0" );
				expect ( parseJson ( '{ "asset": { "version": "2.1" } }' ).asset.version ).to.equal ( "2.1" );
			} );

			it ( "Should ignore a byte order mark", function ()
			{
				expect ( parseJson ( '﻿{ "asset": { "version": "2.0" } }' ).asset.version ).to.equal ( "2.0" );
			} );

			it ( "Should reject other versions", function ()
			{
				expect ( () => parseJson ( '{ "asset": { "version": "1.0" } }' ) ).to.throw ( "glTF version 1.0 is not supported" );
			} );

			it ( "Should reject JSON that is not glTF", function ()
			{
				expect ( () => parseJson ( "[]" ) ).to.throw ( "not an object" );
				expect ( () => parseJson ( "{}" ) ).to.throw ( "no asset version" );
				expect ( () => parseJson ( '{ "asset": {} }' ) ).to.throw ( "no asset version" );
				expect ( () => parseJson ( "not json" ) ).to.throw();
			} );
		} );

		describe ( "Data URIs", function ()
		{
			it ( "Should decode base64", function ()
			{
				const bytes = decodeDataUri ( `data:application/octet-stream;base64,${btoa ( "\x00\x01\xFF" )}` );
				expect ( Array.from ( bytes ) ).to.deep.equal ( [ 0, 1, 255 ] );
			} );

			it ( "Should reject data that is not base64", function ()
			{
				expect ( () => decodeDataUri ( "data:text/plain,hello" ) ).to.throw ( "Only base64" );
			} );
		} );

		describe ( "GLB", function ()
		{
			it ( "Should read the JSON and the binary chunk", async function ()
			{
				const maker = new GltfMaker();
				maker.addPoints ( TRIANGLE_POINTS );
				const { json, buffers } = await readGlb ( maker.glb() );
				expect ( json.accessors!.length ).to.equal ( 1 );
				expect ( buffers.length ).to.equal ( 1 );
				expect ( Array.from ( new Float32Array ( buffers[0].slice ( 0, 36 ).buffer ) ) ).to.deep.equal ( TRIANGLE_POINTS );
			} );

			it ( "Should read a file with only JSON", async function ()
			{
				const { json, buffers } = await readGlb ( makeGlb ( '{ "asset": { "version": "2.0" } }', null ) );
				expect ( json.asset.version ).to.equal ( "2.0" );
				expect ( buffers ).to.deep.equal ( [] );
			} );

			it ( "Should reject a bad header", async function ()
			{
				const text = '{ "asset": { "version": "2.0" } }';
				expect ( ( await getError ( readGlb ( makeGlb ( text, null, { magic: 0 } ) ) ) ).message ).to.include ( "not a GLB file" );
				expect ( ( await getError ( readGlb ( makeGlb ( text, null, { version: 1 } ) ) ) ).message ).to.include ( "GLB version 1" );
				expect ( ( await getError ( readGlb ( makeGlb ( text, null, { lengthChange: 4 } ) ) ) ).message ).to.include ( "header says" );
				expect ( ( await getError ( readGlb ( makeGlb ( text, null, { firstType: GLB_CHUNK_TYPE_BIN } ) ) ) ).message ).to.include ( "not JSON" );
				expect ( ( await getError ( readGlb ( new File ( [ "glTF" ], "short.glb" ) ) ) ).message ).to.include ( "only 4 bytes" );
			} );

			it ( "Should reject a chunk that goes past the end", async function ()
			{
				const bytes = new Uint8Array ( 24 );
				const view = new DataView ( bytes.buffer );
				view.setUint32 ( 0, GLB_MAGIC_NUMBER, true );
				view.setUint32 ( 4, 2, true );
				view.setUint32 ( 8, 24, true );
				view.setUint32 ( 12, 100, true );
				const error = await getError ( readGlb ( new File ( [ bytes ], "test.glb" ) ) );
				expect ( error.message ).to.include ( "past the end of the file" );
			} );

			it ( "Should reject a buffer with no data", async function ()
			{
				const text = '{ "asset": { "version": "2.0" }, "buffers": [ { "byteLength": 4 } ] }';
				expect ( ( await getError ( readGlb ( makeGlb ( text, null ) ) ) ).message ).to.include ( "buffer 0 has no data" );
			} );

			it ( "Should reject a buffer that is too small", async function ()
			{
				const text = '{ "asset": { "version": "2.0" }, "buffers": [ { "byteLength": 400 } ] }';
				const error = await getError ( readGlb ( makeGlb ( text, new Uint8Array ( 4 ) ) ) );
				expect ( error.message ).to.include ( "should have 400 bytes but has 4" );
			} );
		} );

		describe ( "glTF", function ()
		{
			it ( "Should read the embedded data", async function ()
			{
				const maker = new GltfMaker();
				maker.addPoints ( TRIANGLE_POINTS );
				const { buffers } = await readGltf ( maker.gltf() );
				expect ( Array.from ( new Float32Array ( buffers[0].slice ( 0, 36 ).buffer ) ) ).to.deep.equal ( TRIANGLE_POINTS );
			} );

			it ( "Should say that data in other files is not supported", async function ()
			{
				const text = '{ "asset": { "version": "2.0" }, "buffers": [ { "uri": "data.bin", "byteLength": 4 } ] }';
				const error = await getError ( readGltf ( new File ( [ text ], "test.gltf" ) ) );
				expect ( error.message ).to.include ( "in another file, 'data.bin', which is not supported yet" );
			} );
		} );
	} );
};
