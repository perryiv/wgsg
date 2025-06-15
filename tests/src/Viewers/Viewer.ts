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
	Device,
	getNextId,
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
		let device: ( Device | null ) = null;

		this.beforeAll ( async function ()
		{
			device = await Device.create();
		} );

		it ( "Should not be able to make a viewer with zero arguments", function ()
		{
			// @ts-expect-error Viewer does not have a default constructor.
			expect ( () => { new Viewer() } ).to.throw();
		} );

		it ( "Should be able to make a viewer with canvas and device", function ()
		{
			expect ( device ).to.exist;
			expect ( device instanceof Device ).to.be.true;

			const id = getNextId();
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas, device: device! } );

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

			expect ( viewer.device ).to.exist;
			expect ( viewer.device instanceof Device ).to.be.true;
			expect ( viewer.device ).to.equal ( device );
		} );

		it ( "Should be able to make a viewer with a canvas, device, name, and context", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const context = device!.getContext ( canvas );
			const viewer = new Viewer ( { canvas, device: device!, context } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );

			expect ( viewer.device ).to.exist;
			expect ( viewer.device instanceof Device ).to.be.true;
			expect ( viewer.device ).to.equal ( device );
		} );
	} );
};
