///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { mat4 } from "gl-matrix";
import {
	Device,
	getNextId,
	IDENTITY_MATRIX,
	Sphere,
	Viewer,
} from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Viewer", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should not be able to make a viewer with zero arguments", function ()
		{
			// @ts-expect-error Viewer does not have a default constructor.
			expect ( () => { new Viewer() } ).to.throw();
		} );

		it ( "Should be able to make a viewer with canvas and device", function ()
		{
			expect ( Device.instance ).to.exist;
			expect ( Device.instance instanceof Device ).to.be.true;

			const id = getNextId ( "Viewers.Viewer" );
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.id ).to.exist;
			expect ( typeof viewer.id ).to.be.equal ( "number" );
			expect ( viewer.id ).to.be.greaterThan ( id );

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( canvas.getContext ( "webgpu" ) );
		} );

		it ( "Should be able to make a viewer with a canvas, device, name, and context", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const context = Device.instance.getConfiguredContext ( canvas );
			const viewer = new Viewer ( { canvas } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );
		} );

		it ( "Should have correct default matrices", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 100, 100 );

			expect ( viewer.projMatrix ).to.deep.equal ( mat4.perspective (
				[ ...IDENTITY_MATRIX ], 45, 1, 0.1, 1000
			) );

			expect ( viewer.viewMatrix ).to.deep.equal ( [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, -2, 1
			] );
		} );

		it ( "Should be able to view the bounds", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 100, 100 );

			const sphere = new Sphere ( [ 0, 0, 0 ], Math.sqrt ( 3 ) );
			viewer.viewSphere ( sphere );
		} );
	} );
};
