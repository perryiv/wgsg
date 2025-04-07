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
import { Surface } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Surface", function ()
	{
		it ( "Should be able to make a surface", function ()
		{
			const surface = new Surface();
			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;
		} );

		it ( "Default surface should have null context", function ()
		{
			const surface = new Surface();
			expect ( surface.context ).to.be.null;
		} );

		it ( "Should be able to set the context", function ()
		{
			const context = document.createElement ( "canvas" ).getContext ( "webgpu" );
			const surface = new Surface();
			surface.context = context;
			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( context );
		} );

		it ( "Should be able to set the context from a canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const surface = new Surface();
			surface.canvas = canvas;
			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( canvas.getContext ( "webgpu" ) );
			expect ( surface.canvas ).to.be.undefined; // This is only a setter.
		} );

		it ( "Should be able to construct with a context", function ()
		{
			const context = document.createElement ( "canvas" ).getContext ( "webgpu" );
			const surface = new Surface ( context );
			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( context );
		} );

		it ( "Should be able to construct with a canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const surface = new Surface ( canvas );
			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( canvas.getContext ( "webgpu" ) );
		} );
	} );
};
