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
import {
	getDeviceData,
	getRenderingContext,
	Viewer,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Viewer", function ()
	{
		it ( "Should not be able to make a viewer with zero arguments", function ()
		{
			// @ts-expect-error Viewer does not have a default constructor.
			expect ( () => { new Viewer() } ).to.throw();
		} );

		it ( "Should be able to make a viewer with canvas and device", async function ()
		{
			const canvas = document.createElement ( "canvas" );
			const { device } = await getDeviceData();
			const viewer = new Viewer ( { canvas, device } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( canvas.getContext ( "webgpu" ) );

			expect ( viewer.device ).to.exist;
			expect ( viewer.device instanceof GPUDevice ).to.be.true;
			expect ( viewer.device ).to.equal ( device );

			expect ( viewer.name ).to.be.null;
		} );

		it ( "Should be able to make a viewer with a name and context", async function ()
		{
			const name = "My Viewer";
			const canvas = document.createElement ( "canvas" );
			const { device } = await getDeviceData();
			const context = getRenderingContext ( { device, canvas } );
			const viewer = new Viewer ( { name, canvas, device, context } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );

			expect ( viewer.device ).to.exist;
			expect ( viewer.device instanceof GPUDevice ).to.be.true;
			expect ( viewer.device ).to.equal ( device );

			expect ( viewer.name ).to.equal ( name );
		} );
	} );
};
