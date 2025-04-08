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
import { Viewer } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Viewer", function ()
	{
		it ( "Should be able to make a viewer", function ()
		{
			const viewer = new Viewer();
			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;
		} );

		it ( "Default viewer should have null context", function ()
		{
			const viewer = new Viewer();
			expect ( viewer.context ).to.be.null;
		} );

		it ( "Should be able to set the context", function ()
		{
			const context = document.createElement ( "canvas" ).getContext ( "webgpu" );
			const viewer = new Viewer();
			viewer.context = context;
			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );
		} );

		it ( "Should be able to set the context from a canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer();
			viewer.canvas = canvas;
			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( canvas.getContext ( "webgpu" ) );
			expect ( viewer.canvas ).to.be.undefined; // This is only a setter.
		} );

		it ( "Should be able to construct with a context", function ()
		{
			const context = document.createElement ( "canvas" ).getContext ( "webgpu" );
			const viewer = new Viewer ( context );
			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );
		} );

		it ( "Should be able to construct with a canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( canvas );
			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( canvas.getContext ( "webgpu" ) );
		} );

		it ( "Should throw an error with invalid argument to constructor", function ()
		{
			expect ( () => { new Viewer ( undefined ) } ).to.not.throw();
			expect ( () => { new Viewer ( null ) } ).to.not.throw();

			const message = "Invalid input type in render surface constructor";
			expect ( () => { new Viewer ( {} ) } ).to.throw ( `${message}: object` );
			expect ( () => { new Viewer ( [] ) } ).to.throw ( `${message}: object` );
			expect ( () => { new Viewer ( 123 ) } ).to.throw ( `${message}: number` );
			expect ( () => { new Viewer ( "Some string" ) } ).to.throw ( `${message}: string` );
			expect ( () => { new Viewer ( true ) } ).to.throw ( `${message}: boolean` );
			expect ( () => { new Viewer ( false ) } ).to.throw ( `${message}: boolean` );
		} );
	} );
};
