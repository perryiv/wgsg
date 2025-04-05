///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for shapes.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Shape, State } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Shape Class", function ()
	{
		it ( "Should be able to make a shape", function ()
		{
			const shape = new Shape();
			expect ( shape ).to.exist;
			expect ( shape instanceof Shape ).to.be.true;
		} );

		it ( "Default shape should have null state", function ()
		{
			const shape = new Shape();
			expect ( shape.state ).to.be.null;
		} );

		it ( "Should be able to set the state", function ()
		{
			const shape = new Shape();
			shape.state = new State();
			expect ( shape.state ).to.exist;
			expect ( shape.state instanceof State ).to.be.true;
		} );

		it ( "Should be able to construct with state", function ()
		{
			const state = new State();
			const shape = new Shape ( state );
			expect ( shape.state ).to.exist;
			expect ( shape.state instanceof State ).to.be.true;
			expect ( shape.state ).to.equal ( state );
		} );
	} );
};
