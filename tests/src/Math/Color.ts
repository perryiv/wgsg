///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the color tools.
//
///////////////////////////////////////////////////////////////////////////////

import { Color } from "../../../lib/src/Math/Color";
import { expect } from "chai";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Color", function ()
	{
		it ( "Should turn sRGB values into linear ones, and back", function ()
		{
			// Known values: the ends, the middle, and both sides of where the
			// curve's straight part ends.
			const cases: [ number, number ][] = [
				[ 0, 0 ],
				[ 1, 1 ],
				[ 0.5, 0.21404 ],
				[ 0.73536, 0.5 ],
				[ 0.04045, 0.0031308 ],
				[ 0.02, 0.02 / 12.92 ],
			];
			for ( const [ sRGB, linear ] of cases )
			{
				expect ( Color.sRGBToLinear ( sRGB ) ).to.be.closeTo ( linear, 1e-4 );
				expect ( Color.linearToSRGB ( linear ) ).to.be.closeTo ( sRGB, 1e-4 );
			}

			// Round trips.
			for ( let value = 0; value <= 1; value += 0.05 )
			{
				expect ( Color.linearToSRGB ( Color.sRGBToLinear ( value ) ) ).to.be.closeTo ( value, 1e-9 );
				expect ( Color.sRGBToLinear ( Color.linearToSRGB ( value ) ) ).to.be.closeTo ( value, 1e-9 );
			}
		} );

		it ( "Should convert colors with and without alpha, leaving the alpha as it is", function ()
		{
			const rgb = Color.sRGBToLinear ( [ 0, 0.5, 1 ] );
			expect ( rgb.length ).to.equal ( 3 );
			expect ( rgb[1] ).to.be.closeTo ( 0.21404, 1e-4 );

			const rgba = Color.sRGBToLinear ( [ 0, 0.5, 1, 0.5 ] );
			expect ( rgba.length ).to.equal ( 4 );
			expect ( rgba[1] ).to.be.closeTo ( 0.21404, 1e-4 );
			expect ( rgba[3] ).to.equal ( 0.5 );

			const back = Color.linearToSRGB ( rgba );
			expect ( back[1] ).to.be.closeTo ( 0.5, 1e-9 );
			expect ( back[3] ).to.equal ( 0.5 );
		} );
	} );
};
