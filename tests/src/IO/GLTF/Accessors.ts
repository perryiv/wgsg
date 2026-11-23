///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test reading glTF accessors.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { GltfMaker, toTyped } from "./Helpers";
import {
	readAccessor,
	readFloats,
	readIndices,
} from "../../../../lib/src/IO/Readers/GLTF/Accessors";
import {
	GLTF_BYTE,
	GLTF_FLOAT,
	GLTF_SHORT,
	GLTF_UNSIGNED_BYTE,
	GLTF_UNSIGNED_INT,
	GLTF_UNSIGNED_SHORT,
	type IGltfData,
} from "../../../../lib/src/IO/Readers/GLTF/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Get the data that the reader uses.
 * @param {GltfMaker} maker The maker.
 * @returns {IGltfData} The JSON and the buffers.
 */
const getData = ( maker: GltfMaker ) : IGltfData =>
{
	return { json: maker.json, buffers: [ maker.bytes ] };
};

/**
 * Read the accessor as floats and return them as numbers.
 * @param {GltfMaker} maker The maker.
 * @param {number} index The index of the accessor.
 * @param {string} [type] The type it has to be.
 * @returns {number[]} The values.
 */
const floats = ( maker: GltfMaker, index: number, type = "VEC3" ) : number[] =>
{
	return Array.from ( readFloats ( getData ( maker ), index, type ) );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Accessors", function ()
	{
		it ( "Should read packed floats", function ()
		{
			const maker = new GltfMaker();
			const index = maker.addPoints ( [ 1, 2, 3,   4, 5, 6 ] );
			const values = readFloats ( getData ( maker ), index, "VEC3" );
			expect ( values ).to.be.instanceOf ( Float32Array );
			expect ( Array.from ( values ) ).to.deep.equal ( [ 1, 2, 3,   4, 5, 6 ] );
		} );

		it ( "Should read values that are interleaved with others", function ()
		{
			// Each vertex has a point and then a normal.
			const maker = new GltfMaker();
			const bufferView = maker.addView ( toTyped ( [ 1, 2, 3,   0, 0, 1,   4, 5, 6,   0, 1, 0 ], GLTF_FLOAT ), 24 );
			const points = maker.addRawAccessor ( { bufferView, componentType: GLTF_FLOAT, type: "VEC3", count: 2 } );
			const normals = maker.addRawAccessor ( { bufferView, byteOffset: 12, componentType: GLTF_FLOAT, type: "VEC3", count: 2 } );
			expect ( floats ( maker, points ) ).to.deep.equal ( [ 1, 2, 3,   4, 5, 6 ] );
			expect ( floats ( maker, normals ) ).to.deep.equal ( [ 0, 0, 1,   0, 1, 0 ] );
		} );

		it ( "Should read values that don't line up with their size", function ()
		{
			// Two bytes before the floats.
			const bytes = new Uint8Array ( [ 9, 9, ...toTyped ( [ 1, 2, 3 ], GLTF_FLOAT ) ] );
			const maker = new GltfMaker();
			const bufferView = maker.addView ( bytes );
			const index = maker.addRawAccessor ( { bufferView, byteOffset: 2, componentType: GLTF_FLOAT, type: "VEC3", count: 1 } );
			expect ( floats ( maker, index ) ).to.deep.equal ( [ 1, 2, 3 ] );
		} );

		it ( "Should read values that don't line up and are interleaved", function ()
		{
			// Every 5 bytes there is a 16-bit index, starting at byte 1.
			const bytes = new Uint8Array ( [ 9, 5, 0, 9,   9, 9, 7, 0,   9 ] );
			const maker = new GltfMaker();
			const bufferView = maker.addView ( bytes, 5 );
			const index = maker.addRawAccessor ( { bufferView, byteOffset: 1, componentType: GLTF_UNSIGNED_SHORT, type: "SCALAR", count: 2 } );
			expect ( Array.from ( readIndices ( getData ( maker ), index ) ) ).to.deep.equal ( [ 5, 7 ] );
		} );

		it ( "Should make zeros when there is no buffer view", function ()
		{
			const maker = new GltfMaker();
			const index = maker.addRawAccessor ( { componentType: GLTF_FLOAT, type: "VEC3", count: 2 } );
			expect ( floats ( maker, index ) ).to.deep.equal ( [ 0, 0, 0,   0, 0, 0 ] );
		} );

		describe ( "Sparse", function ()
		{
			it ( "Should replace some of the values", function ()
			{
				const maker = new GltfMaker();
				const base = maker.addView ( toTyped ( [ 0, 0, 0,   1, 1, 1,   2, 2, 2 ], GLTF_FLOAT ) );
				const indices = maker.addView ( toTyped ( [ 2, 0 ], GLTF_UNSIGNED_BYTE ) );
				const values = maker.addView ( toTyped ( [ 7, 8, 9,   4, 5, 6 ], GLTF_FLOAT ) );
				const index = maker.addRawAccessor ( { bufferView: base, componentType: GLTF_FLOAT, type: "VEC3", count: 3,
					sparse: { count: 2, indices: { bufferView: indices, componentType: GLTF_UNSIGNED_BYTE }, values: { bufferView: values } } } );
				expect ( floats ( maker, index ) ).to.deep.equal ( [ 4, 5, 6,   1, 1, 1,   7, 8, 9 ] );
			} );

			it ( "Should replace zeros when there is no buffer view", function ()
			{
				const maker = new GltfMaker();
				const indices = maker.addView ( toTyped ( [ 1 ], GLTF_UNSIGNED_SHORT ) );
				const values = maker.addView ( toTyped ( [ 4, 5, 6 ], GLTF_FLOAT ) );
				const index = maker.addRawAccessor ( { componentType: GLTF_FLOAT, type: "VEC3", count: 2,
					sparse: { count: 1, indices: { bufferView: indices, componentType: GLTF_UNSIGNED_SHORT }, values: { bufferView: values } } } );
				expect ( floats ( maker, index ) ).to.deep.equal ( [ 0, 0, 0,   4, 5, 6 ] );
			} );

			it ( "Should reject replacing an element that isn't there", function ()
			{
				const maker = new GltfMaker();
				const indices = maker.addView ( toTyped ( [ 5 ], GLTF_UNSIGNED_INT ) );
				const values = maker.addView ( toTyped ( [ 4, 5, 6 ], GLTF_FLOAT ) );
				const index = maker.addRawAccessor ( { componentType: GLTF_FLOAT, type: "VEC3", count: 2,
					sparse: { count: 1, indices: { bufferView: indices, componentType: GLTF_UNSIGNED_INT }, values: { bufferView: values } } } );
				expect ( () => floats ( maker, index ) ).to.throw ( "replaces element 5, but it has 2" );
			} );
		} );

		describe ( "Converting to floats", function ()
		{
			it ( "Should keep the values of integers that are not normalized", function ()
			{
				const maker = new GltfMaker();
				const index = maker.addAccessor ( [ -3, 0, 300 ], GLTF_SHORT, "VEC3" );
				expect ( floats ( maker, index ) ).to.deep.equal ( [ -3, 0, 300 ] );
			} );

			it ( "Should scale normalized integers", function ()
			{
				const cases: [ number, number[], number[] ][] = [
					[ GLTF_BYTE, [ -128, -127, 127 ], [ -1, -1, 1 ] ],
					[ GLTF_UNSIGNED_BYTE, [ 0, 51, 255 ], [ 0, 0.2, 1 ] ],
					[ GLTF_SHORT, [ -32768, 0, 32767 ], [ -1, 0, 1 ] ],
					[ GLTF_UNSIGNED_SHORT, [ 0, 13107, 65535 ], [ 0, 0.2, 1 ] ],
				];
				for ( const [ componentType, values, expected ] of cases )
				{
					const maker = new GltfMaker();
					const index = maker.addAccessor ( values, componentType, "VEC3", { normalized: true } );
					const answer = floats ( maker, index );
					answer.forEach ( ( value, i ) => { expect ( value ).to.be.closeTo ( expected[i], 1e-6 ); } );
				}
			} );

			it ( "Should reject normalized 32-bit integers", function ()
			{
				const maker = new GltfMaker();
				const index = maker.addAccessor ( [ 1, 2, 3 ], GLTF_UNSIGNED_INT, "VEC3", { normalized: true } );
				expect ( () => floats ( maker, index ) ).to.throw ( "can't be normalized" );
			} );

			it ( "Should reject the wrong type", function ()
			{
				const maker = new GltfMaker();
				const index = maker.addAccessor ( [ 1, 2 ], GLTF_FLOAT, "VEC2" );
				expect ( () => floats ( maker, index ) ).to.throw ( "should be a VEC3, not a VEC2" );
			} );
		} );

		describe ( "Indices", function ()
		{
			it ( "Should make 8-bit indices 16-bit", function ()
			{
				const maker = new GltfMaker();
				const index = maker.addAccessor ( [ 0, 1, 255 ], GLTF_UNSIGNED_BYTE, "SCALAR" );
				const indices = readIndices ( getData ( maker ), index );
				expect ( indices ).to.be.instanceOf ( Uint16Array );
				expect ( Array.from ( indices ) ).to.deep.equal ( [ 0, 1, 255 ] );
			} );

			it ( "Should keep 16-bit and 32-bit indices", function ()
			{
				const maker = new GltfMaker();
				const short = maker.addAccessor ( [ 0, 1, 65535 ], GLTF_UNSIGNED_SHORT, "SCALAR" );
				const int = maker.addAccessor ( [ 0, 1, 70000 ], GLTF_UNSIGNED_INT, "SCALAR" );
				const data = getData ( maker );
				expect ( readIndices ( data, short ) ).to.be.instanceOf ( Uint16Array );
				expect ( Array.from ( readIndices ( data, int ) ) ).to.deep.equal ( [ 0, 1, 70000 ] );
				expect ( readIndices ( data, int ) ).to.be.instanceOf ( Uint32Array );
			} );

			it ( "Should reject indices that are not unsigned integer scalars", function ()
			{
				const maker = new GltfMaker();
				const float = maker.addAccessor ( [ 0, 1, 2 ], GLTF_FLOAT, "SCALAR" );
				const signed = maker.addAccessor ( [ 0, 1, 2 ], GLTF_SHORT, "SCALAR" );
				const vector = maker.addAccessor ( [ 0, 1, 2 ], GLTF_UNSIGNED_SHORT, "VEC3" );
				const data = getData ( maker );
				expect ( () => readIndices ( data, float ) ).to.throw ( "not an unsigned integer" );
				expect ( () => readIndices ( data, signed ) ).to.throw ( "not an unsigned integer" );
				expect ( () => readIndices ( data, vector ) ).to.throw ( "should be a SCALAR" );
			} );
		} );

		describe ( "Errors", function ()
		{
			it ( "Should reject an accessor that isn't there", function ()
			{
				const maker = new GltfMaker();
				maker.addPoints ( [ 1, 2, 3 ] );
				expect ( () => readAccessor ( getData ( maker ), 1 ) ).to.throw ( "There is no accessor 1, there are 1" );
				expect ( () => readAccessor ( getData ( maker ), -1 ) ).to.throw ( "There is no accessor -1" );
			} );

			it ( "Should reject an unknown type or component type", function ()
			{
				const maker = new GltfMaker();
				const type = maker.addRawAccessor ( { componentType: GLTF_FLOAT, type: "VEC5", count: 1 } );
				const component = maker.addRawAccessor ( { componentType: 1234, type: "VEC3", count: 1 } );
				const count = maker.addRawAccessor ( { componentType: GLTF_FLOAT, type: "VEC3", count: -1 } );
				const data = getData ( maker );
				expect ( () => readAccessor ( data, type ) ).to.throw ( "unknown type 'VEC5'" );
				expect ( () => readAccessor ( data, component ) ).to.throw ( "Unknown accessor component type 1234" );
				expect ( () => readAccessor ( data, count ) ).to.throw ( "invalid count -1" );
			} );

			it ( "Should reject values past the end of the buffer view", function ()
			{
				const maker = new GltfMaker();
				const bufferView = maker.addView ( toTyped ( [ 1, 2, 3 ], GLTF_FLOAT ) );
				const index = maker.addRawAccessor ( { bufferView, componentType: GLTF_FLOAT, type: "VEC3", count: 2 } );
				expect ( () => readAccessor ( getData ( maker ), index ) ).to.throw ( "past the end of buffer view 0" );
			} );

			it ( "Should reject a buffer view past the end of the buffer", function ()
			{
				const maker = new GltfMaker();
				maker.addView ( toTyped ( [ 1, 2, 3 ], GLTF_FLOAT ) );
				maker.json.bufferViews![0].byteLength = 100;
				const index = maker.addRawAccessor ( { bufferView: 0, componentType: GLTF_FLOAT, type: "VEC3", count: 1 } );
				expect ( () => readAccessor ( getData ( maker ), index ) ).to.throw ( "past the end of buffer 0" );
			} );

			it ( "Should reject a stride smaller than an element", function ()
			{
				const maker = new GltfMaker();
				const bufferView = maker.addView ( toTyped ( [ 1, 2, 3, 4, 5, 6 ], GLTF_FLOAT ), 8 );
				const index = maker.addRawAccessor ( { bufferView, componentType: GLTF_FLOAT, type: "VEC3", count: 2 } );
				expect ( () => readAccessor ( getData ( maker ), index ) ).to.throw ( "stride of 8 bytes" );
			} );
		} );
	} );
};
