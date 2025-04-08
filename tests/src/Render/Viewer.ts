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
import { Surface, Viewer } from "wgsg-lib";


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

		it ( "Default viewer should have null canvas", function ()
		{
			const viewer = new Viewer();
			expect ( viewer.canvas ).to.be.null;
		} );

		it ( "Default viewer should have null surface", function ()
		{
			const viewer = new Viewer();
			expect ( viewer.surface ).to.be.null;
		} );

		it ( "Should be able to set the canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer();

			expect ( viewer.canvas ).to.be.null;
			expect ( viewer.surface ).to.be.null;

			viewer.canvas = canvas;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.surface ).to.exist;
			expect ( viewer.surface instanceof Surface ).to.be.true;
		} );

		it ( "Should be able to construct with a canvas", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( canvas );

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.surface ).to.exist;
			expect ( viewer.surface instanceof Surface ).to.be.true;
		} );

		it ( "Should be able to construct with null or undefined", function ()
		{
			expect ( () => { new Viewer ( undefined ) } ).to.not.throw();
			expect ( () => { new Viewer ( null ) } ).to.not.throw();
		} );
	} );
};
