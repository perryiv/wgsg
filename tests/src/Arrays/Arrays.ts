///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for array-related classes and functions.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Array1, Array2, Array3, Array4, Device } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Array", function ()
	{
		let device: ( Device | null ) = null;

		this.beforeAll ( async function ()
		{
			device = await Device.create();
		} );

		it ( "Can make a 1D wrapper around Float32Array", function ()
		{
			device = device!;
			const v = new Float32Array ( [ 1, 2, 3, 4, 5 ] );
			const a = new Array1 ( device, v );

			expect ( a ).to.be.instanceOf ( Array1 );
			expect ( a.values ).to.be.instanceOf ( Float32Array );
			expect ( a.values ).to.equal ( v );
			expect ( a.length ).to.equal ( v.length );
			expect ( a.length ).to.equal ( 5 );

			expect ( a.buffer ).to.not.be.null;
			expect ( a.buffer.size ).to.equal ( v.length * Float32Array.BYTES_PER_ELEMENT );
			expect ( a.buffer.size ).to.equal ( 5 * 4 );

			const b1 = a.buffer;
			a.values = new Float32Array ( [ 6, 7, 8, 9, 10 ] );
			expect ( a.values ).to.be.instanceOf ( Float32Array );
			expect ( a.values ).to.not.equal ( v );
			expect ( a.buffer ).to.not.be.null;
			expect ( a.buffer ).to.not.equal ( b1 );
		} );

		it ( "Can make a 1D wrapper around Float64Array", function ()
		{
			device = device!;
			const v = new Float64Array ( [ 1, 2, 3, 4, 5 ] );
			const a = new Array1 ( device, v );

			expect ( a ).to.be.instanceOf ( Array1 );
			expect ( a.values ).to.be.instanceOf ( Float64Array );
			expect ( a.values ).to.equal ( v );
			expect ( a.length ).to.equal ( v.length );
			expect ( a.length ).to.equal ( 5 );

			const buffer = a.buffer;
			expect ( buffer ).to.not.be.null;
			expect ( buffer.size ).to.equal ( v.length * Float64Array.BYTES_PER_ELEMENT );
			expect ( buffer.size ).to.equal ( 5 * 8 );

			const b1 = a.buffer;
			a.values = new Float64Array ( [ 6, 7, 8, 9, 10 ] );
			expect ( a.values ).to.be.instanceOf ( Float64Array );
			expect ( a.values ).to.not.equal ( v );
			expect ( a.buffer ).to.not.be.null;
			expect ( a.buffer ).to.not.equal ( b1 );
		} );

		it ( "Can make a 2D array wrapper around a 1D array", function ()
		{
			const v = new Float32Array ( [ 1, 2, 3, 4, 5, 6 ] )
			const a = new Array2 ( v );

			const i = a.ix0;
			const j = a.ix1;

			const x = a.x0;
			const y = a.x1;

			expect ( a ).to.be.instanceOf ( Array2 );
			expect ( a.values ).to.be.instanceOf ( Float32Array );
			expect ( a.values ).to.equal ( v );
			expect ( a.numVectors ).to.equal ( 3 );
			expect ( a.values.length ).to.equal ( 6 );

			expect ( i ).to.be.a ( "number" );
			expect ( j ).to.be.a ( "number" );

			expect ( i ).to.equal ( 0 );
			expect ( j ).to.equal ( 3 );

			expect ( x ).to.be.instanceOf ( Float32Array );
			expect ( y ).to.be.instanceOf ( Float32Array );

			expect ( x ).to.deep.equal ( new Float32Array ( [ 1, 2, 3 ] ) );
			expect ( y ).to.deep.equal ( new Float32Array ( [ 4, 5, 6 ] ) );

			expect ( x[0] ).to.equal ( 1 );
			expect ( x[1] ).to.equal ( 2 );
			expect ( x[2] ).to.equal ( 3 );

			expect ( y[0] ).to.equal ( 4 );
			expect ( y[1] ).to.equal ( 5 );
			expect ( y[2] ).to.equal ( 6 );

			expect ( x[3] ).to.be.undefined;
			expect ( y[3] ).to.be.undefined;

			expect ( x[-1] ).to.be.undefined;
			expect ( y[-1] ).to.be.undefined;

			expect ( a.getVector ( 0 ) ).to.deep.equal ( [ 1, 4 ] );
			expect ( a.getVector ( 1 ) ).to.deep.equal ( [ 2, 5 ] );
			expect ( a.getVector ( 2 ) ).to.deep.equal ( [ 3, 6 ] );
			expect ( a.getVector ( 3 )[0] ).to.be.undefined

			a.setVector ( 1, [ 10, 20 ] );

			expect ( a.values ).to.deep.equal ( new Float32Array ( [
				1, 10, 3,
				4, 20, 6
			] ) );

			expect ( x[1] ).to.equal ( 10 );
			expect ( y[1] ).to.equal ( 20 );

			a.forEach ( ( vector, index ) =>
			{
				expect ( vector ).to.deep.equal ( a.getVector ( index ) );
				expect ( vector[0] ).to.equal ( x[index] );
				expect ( vector[1] ).to.equal ( y[index] );
			} );
		} );

		it ( "Can make a 3D array wrapper around a 1D array", function ()
		{
			const v = new Float32Array ( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ] )
			const a = new Array3 ( v );

			const i = a.ix0;
			const j = a.ix1;
			const k = a.ix2;

			const x = a.x0;
			const y = a.x1;
			const z = a.x2;

			expect ( a ).to.be.instanceOf ( Array3 );
			expect ( a.values ).to.be.instanceOf ( Float32Array );
			expect ( a.values ).to.equal ( v );
			expect ( a.numVectors ).to.equal ( 3 );
			expect ( a.values.length ).to.equal ( 9 );

			expect ( i ).to.be.a ( "number" );
			expect ( j ).to.be.a ( "number" );
			expect ( k ).to.be.a ( "number" );

			expect ( i ).to.equal ( 0 );
			expect ( j ).to.equal ( 3 );
			expect ( k ).to.equal ( 6 );

			expect ( x ).to.be.instanceOf ( Float32Array );
			expect ( y ).to.be.instanceOf ( Float32Array );
			expect ( z ).to.be.instanceOf ( Float32Array );

			expect ( x ).to.deep.equal ( new Float32Array ( [ 1, 2, 3 ] ) );
			expect ( y ).to.deep.equal ( new Float32Array ( [ 4, 5, 6 ] ) );
			expect ( z ).to.deep.equal ( new Float32Array ( [ 7, 8, 9 ] ) );

			expect ( x[0] ).to.equal ( 1 );
			expect ( x[1] ).to.equal ( 2 );
			expect ( x[2] ).to.equal ( 3 );

			expect ( y[0] ).to.equal ( 4 );
			expect ( y[1] ).to.equal ( 5 );
			expect ( y[2] ).to.equal ( 6 );

			expect ( z[0] ).to.equal ( 7 );
			expect ( z[1] ).to.equal ( 8 );
			expect ( z[2] ).to.equal ( 9 );

			expect ( x[3] ).to.be.undefined;
			expect ( y[3] ).to.be.undefined;
			expect ( z[3] ).to.be.undefined;

			expect ( x[-1] ).to.be.undefined;
			expect ( y[-1] ).to.be.undefined;
			expect ( z[-1] ).to.be.undefined;

			expect ( a.getVector ( 0 ) ).to.deep.equal ( [ 1, 4, 7 ] );
			expect ( a.getVector ( 1 ) ).to.deep.equal ( [ 2, 5, 8 ] );
			expect ( a.getVector ( 2 ) ).to.deep.equal ( [ 3, 6, 9 ] );
			expect ( a.getVector ( 3 )[0] ).to.be.undefined

			a.setVector ( 1, [ 10, 20, 30 ] );

			expect ( a.values ).to.deep.equal ( new Float32Array ( [
				1, 10, 3,
				4, 20, 6,
				7, 30, 9
			] ) );

			expect ( x[1] ).to.equal ( 10 );
			expect ( y[1] ).to.equal ( 20 );
			expect ( z[1] ).to.equal ( 30 );

			a.forEach ( ( vector, index ) =>
			{
				expect ( vector ).to.deep.equal ( a.getVector ( index ) );
				expect ( vector[0] ).to.equal ( x[index] );
				expect ( vector[1] ).to.equal ( y[index] );
				expect ( vector[2] ).to.equal ( z[index] );
			} );
		} );

		it ( "Can make a 4D array wrapper around a 1D array", function ()
		{
			const v = new Float32Array ( [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ] )
			const a = new Array4 ( v );

			const i = a.ix0;
			const j = a.ix1;
			const k = a.ix2;
			const l = a.ix3;

			const x = a.x0;
			const y = a.x1;
			const z = a.x2;
			const w = a.x3;

			expect ( a ).to.be.instanceOf ( Array4 );
			expect ( a.values ).to.be.instanceOf ( Float32Array );
			expect ( a.values ).to.equal ( v );
			expect ( a.numVectors ).to.equal ( 3 );
			expect ( a.values.length ).to.equal ( 12 );

			expect ( i ).to.be.a ( "number" );
			expect ( j ).to.be.a ( "number" );
			expect ( k ).to.be.a ( "number" );
			expect ( l ).to.be.a ( "number" );

			expect ( i ).to.equal ( 0 );
			expect ( j ).to.equal ( 3 );
			expect ( k ).to.equal ( 6 );
			expect ( l ).to.equal ( 9 );

			expect ( x ).to.be.instanceOf ( Float32Array );
			expect ( y ).to.be.instanceOf ( Float32Array );
			expect ( z ).to.be.instanceOf ( Float32Array );
			expect ( w ).to.be.instanceOf ( Float32Array );

			expect ( x ).to.deep.equal ( new Float32Array ( [ 1, 2, 3 ] ) );
			expect ( y ).to.deep.equal ( new Float32Array ( [ 4, 5, 6 ] ) );
			expect ( z ).to.deep.equal ( new Float32Array ( [ 7, 8, 9 ] ) );
			expect ( w ).to.deep.equal ( new Float32Array ( [ 10, 11, 12 ] ) );

			expect ( x[0] ).to.equal ( 1 );
			expect ( x[1] ).to.equal ( 2 );
			expect ( x[2] ).to.equal ( 3 );

			expect ( y[0] ).to.equal ( 4 );
			expect ( y[1] ).to.equal ( 5 );
			expect ( y[2] ).to.equal ( 6 );

			expect ( z[0] ).to.equal ( 7 );
			expect ( z[1] ).to.equal ( 8 );
			expect ( z[2] ).to.equal ( 9 );

			expect ( w[0] ).to.equal ( 10 );
			expect ( w[1] ).to.equal ( 11 );
			expect ( w[2] ).to.equal ( 12 );

			expect ( x[3] ).to.be.undefined;
			expect ( y[3] ).to.be.undefined;
			expect ( z[3] ).to.be.undefined;
			expect ( w[3] ).to.be.undefined;

			expect ( x[-1] ).to.be.undefined;
			expect ( y[-1] ).to.be.undefined;
			expect ( z[-1] ).to.be.undefined;
			expect ( w[-1] ).to.be.undefined;

			expect ( a.getVector ( 0 ) ).to.deep.equal ( [ 1, 4, 7, 10 ] );
			expect ( a.getVector ( 1 ) ).to.deep.equal ( [ 2, 5, 8, 11 ] );
			expect ( a.getVector ( 2 ) ).to.deep.equal ( [ 3, 6, 9, 12 ] );
			expect ( a.getVector ( 3 )[0] ).to.be.undefined

			a.setVector ( 1, [ 100, 200, 300, 400 ] );

			expect ( a.values ).to.deep.equal ( new Float32Array ( [
				1, 100, 3,
				4, 200, 6,
				7, 300, 9,
				10, 400, 12
			] ) );

			expect ( x[1] ).to.equal ( 100 );
			expect ( y[1] ).to.equal ( 200 );
			expect ( z[1] ).to.equal ( 300 );
			expect ( w[1] ).to.equal ( 400 );

			a.forEach ( ( vector, index ) =>
			{
				expect ( vector ).to.deep.equal ( a.getVector ( index ) );
				expect ( vector[0] ).to.equal ( x[index] );
				expect ( vector[1] ).to.equal ( y[index] );
				expect ( vector[2] ).to.equal ( z[index] );
				expect ( vector[3] ).to.equal ( w[index] );
			} );
		} );

		it ( "The internal 1D array has to be a compatible length", function ()
		{
			expect ( () => { new Array2 ( new Float32Array ( 11 ) ); } )
			.to.throw ( "Given length 11 is not a multiple of 2" );
			expect ( () => { new Array3 ( new Float32Array ( 11 ) ); } )
			.to.throw ( "Given length 11 is not a multiple of 3" );
			expect ( () => { new Array4 ( new Float32Array ( 11 ) ); } )
			.to.throw ( "Given length 11 is not a multiple of 4" );
		} );
	} );
};
