///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for state.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { State } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "State Class", function ()
	{
		const vs = "I am the vertex shader";
		const fs = "I am the fragment shader";

		it ( "Should be able to make a state", function ()
		{
			const state = new State();
			expect ( state ).to.exist;
			expect ( state instanceof State ).to.be.true;
		} );

		it ( "Default state should have null shaders", function ()
		{
			const state = new State();
			expect ( state.vertexShader ).to.be.null;
			expect ( state.fragmentShader ).to.be.null;
		} );

		it ( "Should be able to set the shaders", function ()
		{
			const state = new State();
			state.vertexShader = vs;
			state.fragmentShader = fs;
			expect ( state.vertexShader ).to.equal ( vs );
			expect ( state.fragmentShader ).to.equal ( fs );
		} );

		it ( "Should be able to construct with shaders", function ()
		{
			const state = new State ( vs, fs );
			expect ( state.vertexShader ).to.equal ( vs );
			expect ( state.fragmentShader ).to.equal ( fs );
		} );
	} );
};
