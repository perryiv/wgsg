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
import { defaultApplyFunction, defaultResetFunction, IStateApplyFunction, IStateResetFunction, State } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "State", function ()
	{
		it ( "Should be able to make a state", function ()
		{
			const state = new State();
			expect ( state ).to.exist;
			expect ( state instanceof State ).to.be.true;
		} );

		it ( "Default state should have default properties", function ()
		{
			const state = new State();
			expect ( state.name ).to.equal ( "default_state" );
			expect ( state.layer ).to.equal ( 0 );
			expect ( state.renderBin ).to.equal ( 0 );
			expect ( state.apply ).to.equal ( defaultApplyFunction );
			expect ( state.reset ).to.equal ( defaultResetFunction );
		} );

		it ( "Should be able to set the shader properties", function ()
		{
			const localApplyFunction: IStateApplyFunction = ( input ) =>
			{
				console.log ( `Custom apply function called with input: ${JSON.stringify ( input )}` );
			};
			const localResetFunction: IStateResetFunction = () =>
			{
				console.log ( "Custom reset function called." );
			};
			const state = new State();
			state.name = "test_state";
			state.shader = "test_shader";
			state.layer = 1;
			state.renderBin = 2;
			state.apply = localApplyFunction;
			state.reset = localResetFunction;
			expect ( state.name ).to.equal ( "test_state" );
			expect ( state.shader ).to.equal ( "test_shader" );
			expect ( state.layer ).to.equal ( 1 );
			expect ( state.renderBin ).to.equal ( 2 );
			expect ( state.apply ).to.equal ( localApplyFunction );
			expect ( state.reset ).to.equal ( localResetFunction );
		} );

		it ( "Should be able to construct with input", function ()
		{
			const state = new State ( {
				name: "test_state",
				shader: "test_shader",
				layer: 1,
				renderBin: 2
			} );
			expect ( state.name ).to.equal ( "test_state" );
			expect ( state.shader ).to.equal ( "test_shader" );
			expect ( state.layer ).to.equal ( 1 );
			expect ( state.renderBin ).to.equal ( 2 );
		} );
	} );
};
