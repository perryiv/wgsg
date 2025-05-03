///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the render surface.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	getDeviceData,
	getNextId,
	getRenderingContext,
	Surface,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Surface", function ()
	{
		it ( "Should not be able to make a surface with zero arguments", function ()
		{
			// @ts-expect-error Surface does not have a default constructor.
			expect ( () => { new Surface() } ).to.throw();
		} );

		it ( "Should be able to make a surface with canvas and device", async function ()
		{
			const canvas = document.createElement ( "canvas" );
			const { device } = await getDeviceData();
			const surface = new Surface ( { canvas, device } );

			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;

			expect ( surface.id ).to.exist;
			expect ( typeof surface.id ).to.be.equal ( "number" );
			expect ( surface.id ).to.equal ( getNextId() - 1 );

			expect ( surface.canvas ).to.exist;
			expect ( surface.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( surface.canvas ).to.equal ( canvas );

			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( canvas.getContext ( "webgpu" ) );

			expect ( surface.device ).to.exist;
			expect ( surface.device instanceof GPUDevice ).to.be.true;
			expect ( surface.device ).to.equal ( device );

			expect ( surface.name ).to.be.null;
		} );

		it ( "Should be able to make a surface with canvas, device, name, and context", async function ()
		{
			const name = "My Surface";
			const canvas = document.createElement ( "canvas" );
			const { device } = await getDeviceData();
			const context = getRenderingContext ( { device, canvas } );
			const surface = new Surface ( { name, canvas, device, context } );

			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;

			expect ( surface.canvas ).to.exist;
			expect ( surface.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( surface.canvas ).to.equal ( canvas );

			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( context );

			expect ( surface.device ).to.exist;
			expect ( surface.device instanceof GPUDevice ).to.be.true;
			expect ( surface.device ).to.equal ( device );

			expect ( surface.name ).to.equal ( name );
		} );
	} );
};
