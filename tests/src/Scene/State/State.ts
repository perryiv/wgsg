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

import { Device } from "../../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { IDENTITY_MATRIX } from "../../../../lib/src/Tools/Constants";
import { SolidColor } from "../../../../lib/src/Shaders/SolidColor";
import { ColorAttribute, TwoSidedLight } from "../../../../lib/src/Scene/State/Attributes";
import type { IMatrix44, IVector4 } from "../../../../lib/src/Types";
import {
	defaultApplyFunction,
	defaultResetFunction,
	State,
	type IStateApplyFunction,
	type IStateResetFunction,
} from "../../../../lib/src/Scene/State";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "State", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should be able to make a state", function ()
		{
			const state = new State();
			expect ( state ).to.exist;
			expect ( state instanceof State ).to.be.true;
		} );

		it ( "Default state should have default properties", function ()
		{
			const state = new State();
			expect ( state.name ).to.equal ( "Scene.State.State with shader 'invalid_shader'" );
			expect ( state.layer ).to.equal ( 0 );
			expect ( state.bin ).to.equal ( 0 );
			expect ( state.apply ).to.equal ( defaultApplyFunction );
			expect ( state.reset ).to.equal ( defaultResetFunction );
		} );

		it ( "State should have default shader", function ()
		{
			const state = new State();
			expect ( state.shader ).to.be.null;
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

			const shader = SolidColor.instance;

			const state = new State();
			state.name = "test_state";
			state.shader = shader;
			state.layer = 1;
			state.bin = 2;
			state.apply = localApplyFunction;
			state.reset = localResetFunction;

			expect ( state.name ).to.equal ( "test_state" );
			expect ( state.shader ).to.equal ( shader );
			expect ( state.shader.type ).to.equal ( "Shaders.SolidColor" );
			expect ( state.layer ).to.equal ( 1 );
			expect ( state.bin ).to.equal ( 2 );
			expect ( state.apply ).to.equal ( localApplyFunction );
			expect ( state.reset ).to.equal ( localResetFunction );
		} );

		it ( "Should be able to construct with input", function ()
		{
			const shader = SolidColor.instance;
			const state = new State ( {
				name: "test_state",
				shader,
				layer: 1,
				bin: 2
			} );
			expect ( state.name ).to.equal ( "test_state" );
			expect ( shader.type ).to.equal ( "Shaders.SolidColor" );
			expect ( state.shader ).to.equal ( shader );
			expect ( state.layer ).to.equal ( 1 );
			expect ( state.bin ).to.equal ( 2 );
		} );

		it ( "Should put the shader back to its defaults when it resets", function ()
		{
			const shader = FlatShading.instance;
			const matrix = [ ...IDENTITY_MATRIX ] as IMatrix44;
			const red: IVector4 = [ 1, 0, 0, 1 ];

			// A state that sets the color (the diffuse color) and two-sided lighting.
			const state1 = FlatShading.makeState ( { topology: "triangle-list" } );
			state1.addAttribute ( new ColorAttribute ( red ) );
			state1.addAttribute ( new TwoSidedLight ( true ) );
			const input1 = { state: state1, shader, projMatrix: matrix };
			state1.doApply ( input1 );
			expect ( shader.diffuse ).to.deep.equal ( red );
			expect ( shader.twoSidedLight ).to.be.true;
			state1.doReset ( input1 );

			// The next state sets neither, so it gets the defaults.
			const state2 = FlatShading.makeState ( { topology: "triangle-list" } );
			state2.doApply ( { state: state2, shader, projMatrix: matrix } );
			expect ( shader.diffuse ).to.deep.equal ( [ 0.8, 0.8, 0.8, 1 ] );
			expect ( shader.twoSidedLight ).to.be.false;
		} );

		it ( "Should let a custom reset function keep the values", function ()
		{
			const shader = SolidColor.instance;
			const matrix = [ ...IDENTITY_MATRIX ] as IMatrix44;
			const red: IVector4 = [ 1, 0, 0, 1 ];

			const state = SolidColor.makeState ( { topology: "triangle-list" } );
			state.addAttribute ( new ColorAttribute ( red ) );
			state.reset = () =>
			{
				// Keep the color on purpose.
			};
			const input = { state, shader, projMatrix: matrix };
			state.doApply ( input );
			state.doReset ( input );
			expect ( shader.diffuse ).to.deep.equal ( red );

			// The default reset function puts it back.
			defaultResetFunction ( input );
			expect ( shader.diffuse ).to.deep.equal ( [ 0.8, 0.8, 0.8, 1 ] );
		} );
	} );
};
