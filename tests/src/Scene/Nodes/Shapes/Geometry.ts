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
import { Geometry, Node, Shape, State } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Geometry", function ()
	{
		it ( "Should be able to make a shape", function ()
		{
			const shape = new Geometry();
			expect ( shape ).to.exist;
			expect ( shape instanceof Geometry ).to.be.true;
			expect ( shape instanceof Shape ).to.be.true;
			expect ( shape instanceof Node ).to.be.true;
		} );

		it ( "Default shape should have null state", function ()
		{
			const geom = new Geometry();
			expect ( geom.state ).to.be.null;
		} );

		it ( "Should be able to set the state", function ()
		{
			const geom = new Geometry();
			geom.state = new State();
			expect ( geom.state ).to.exist;
			expect ( geom.state instanceof State ).to.be.true;
		} );

		it ( "Should be able to construct with state", function ()
		{
			const state = new State();
			const geom = new Geometry ( { state } );
			expect ( geom.state ).to.exist;
			expect ( geom.state instanceof State ).to.be.true;
			expect ( geom.state ).to.equal ( state );
		} );
	} );
};
