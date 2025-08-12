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
	Device,
	getNextId,
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
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should not be able to make a surface with zero arguments", function ()
		{
			// @ts-expect-error Surface does not have a default constructor.
			expect ( () => { new Surface() } ).to.throw();
		} );

		it ( "Should be able to make a surface with canvas and device", function ()
		{
			expect ( Device.instance ).to.exist;
			expect ( Device.instance instanceof Device ).to.be.true;

			const id = getNextId();
			const canvas = document.createElement ( "canvas" );
			const surface = new Surface ( { canvas } );

			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;

			expect ( surface.id ).to.exist;
			expect ( typeof surface.id ).to.be.equal ( "number" );
			expect ( surface.id ).to.be.greaterThan ( id );

			expect ( surface.canvas ).to.exist;
			expect ( surface.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( surface.canvas ).to.equal ( canvas );

			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( canvas.getContext ( "webgpu" ) );
		} );

		it ( "Should be able to make a surface with canvas, device, and context", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const context = Device.instance.getConfiguredContext ( canvas );
			const surface = new Surface ( { canvas, context } );

			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;

			expect ( surface.canvas ).to.exist;
			expect ( surface.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( surface.canvas ).to.equal ( canvas );

			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( context );
		} );
	} );
};
