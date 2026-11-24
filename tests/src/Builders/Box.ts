///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the box builder.
//
///////////////////////////////////////////////////////////////////////////////

import { buildBox } from "../../../lib/src/Builders/Box";
import { expect } from "chai";
import { Indexed } from "../../../lib/src/Scene/Primitives/Indexed";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Box", function ()
	{
		it ( "Should make triangles that face out of the box", function ()
		{
			const center = [ 1, 2, 3 ];
			const box = buildBox ( { center: [ 1, 2, 3 ], size: [ 2, 4, 6 ] } );

			const points = box.points?.values;
			const prims = box.primitives?.[0];
			expect ( points ).to.exist;
			expect ( prims ).to.be.instanceOf ( Indexed );
			const indices = ( prims as Indexed ).indices?.values;
			expect ( indices ).to.exist;
			expect ( indices!.length ).to.equal ( 36 );

			// Each triangle's normal, from its corners in order, points away
			// from the center of the box.
			const p = ( i: number ) => [ points![ i * 3 ], points![ ( i * 3 ) + 1 ], points![ ( i * 3 ) + 2 ] ];
			for ( let t = 0; t < indices!.length; t += 3 )
			{
				const [ a, b, c ] = [ p ( indices![t] ), p ( indices![ t + 1 ] ), p ( indices![ t + 2 ] ) ];
				const u = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ];
				const v = [ c[0] - a[0], c[1] - a[1], c[2] - a[2] ];
				const n = [ ( u[1] * v[2] ) - ( u[2] * v[1] ), ( u[2] * v[0] ) - ( u[0] * v[2] ), ( u[0] * v[1] ) - ( u[1] * v[0] ) ];
				const out = [ a[0] + b[0] + c[0] - ( 3 * center[0] ), a[1] + b[1] + c[1] - ( 3 * center[1] ), a[2] + b[2] + c[2] - ( 3 * center[2] ) ];
				const dot = ( n[0] * out[0] ) + ( n[1] * out[1] ) + ( n[2] * out[2] );
				expect ( dot, `triangle ${t / 3}` ).to.be.greaterThan ( 0 );
			}
		} );
	} );
};
