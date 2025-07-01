///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test functions for working with bits.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { 
	hasBits,
	addBits,
	removeBits,
	toggleBits,
	setBits,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	enum Flags
	{
		FLAG1 = 0x00000001,
		FLAG2 = 0x00000002,
		FLAG3 = 0x00000004,
		FLAG4 = 0x00000008,
	};

	describe ( "Bits", function ()
	{
		it ( "Can add and remove bits", function ()
		{
			let number = addBits ( 0, Flags.FLAG1 | Flags.FLAG3 );
			expect ( number ).to.equal ( Flags.FLAG1 | Flags.FLAG3 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = removeBits ( number, Flags.FLAG1 );
			expect ( number ).to.equal ( Flags.FLAG3 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = removeBits ( number, Flags.FLAG3 );
			expect ( number ).to.equal ( 0 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;
		} );

		it ( "Can toggle bits", function ()
		{
			let number = 0;
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = toggleBits ( number, Flags.FLAG1 );
			expect ( number ).to.equal ( Flags.FLAG1 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = toggleBits ( number, Flags.FLAG1 );
			expect ( number ).to.equal ( 0 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = addBits ( 0, Flags.FLAG2 | Flags.FLAG4 );
			expect ( number ).to.equal ( Flags.FLAG2 | Flags.FLAG4 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.true;

			number = toggleBits ( number, Flags.FLAG2 );
			expect ( number ).to.equal ( Flags.FLAG4 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.true;
		} );

		it ( "Can set bits", function ()
		{
			let number = 0;
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = setBits ( number, Flags.FLAG1, true );
			expect ( number ).to.equal ( Flags.FLAG1 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = setBits ( number, Flags.FLAG2, true );
			expect ( number ).to.equal ( Flags.FLAG1 | Flags.FLAG2 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.false;

			number = addBits ( number, Flags.FLAG2 | Flags.FLAG4 );
			expect ( number ).to.equal ( Flags.FLAG1 | Flags.FLAG2 | Flags.FLAG4 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.true;

			number = setBits ( number, Flags.FLAG2, false );
			expect ( number ).to.equal ( Flags.FLAG1 | Flags.FLAG4 );
			expect ( hasBits ( number, Flags.FLAG1 ) ).to.be.true;
			expect ( hasBits ( number, Flags.FLAG2 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG3 ) ).to.be.false;
			expect ( hasBits ( number, Flags.FLAG4 ) ).to.be.true;
		} );
	} );
};
