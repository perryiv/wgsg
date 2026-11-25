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

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { getNextId } from "../../../lib/src/Tools/Functions";
import { Surface } from "../../../lib/src/Viewers/Surface";


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

			const id = getNextId ( "Viewers.Surface" );
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
			const surface = new Surface ( { canvas } );

			expect ( surface ).to.exist;
			expect ( surface instanceof Surface ).to.be.true;

			expect ( surface.canvas ).to.exist;
			expect ( surface.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( surface.canvas ).to.equal ( canvas );

			expect ( surface.context ).to.exist;
			expect ( surface.context instanceof GPUCanvasContext ).to.be.true;
			expect ( surface.context ).to.equal ( context );
		} );

		it ( "Should cull by the view frustum unless that's turned off", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const surface = new Surface ( { canvas } );
			expect ( surface.frustumCulling ).to.be.true;
			surface.frustumCulling = false;
			expect ( surface.frustumCulling ).to.be.false;
			surface.destroy();
		} );

		describe ( "Measuring", function ()
		{
			let surface: ( Surface | null ) = null;

			this.beforeEach ( function ()
			{
				const canvas = document.createElement ( "canvas" );
				canvas.width = 8;
				canvas.height = 8;
				surface = new Surface ( { canvas } );
			} );

			this.afterEach ( function ()
			{
				surface?.destroy();
				surface = null;
			} );

			it ( "Should measure the frames after the warm-up, and then stop", async function ()
			{
				const s = surface!;
				const before = s.frame.count;
				const m = await s.measure ( { frames: 5, warmUp: 2 } );

				expect ( m.frames ).to.equal ( 5 );
				expect ( m.warmUp ).to.equal ( 2 );
				expect ( m.interval?.count ).to.equal ( 4 );
				expect ( m.cpu?.count ).to.equal ( 5 );
				expect ( s.measuring ).to.be.false;
				expect ( s.frame.count - before ).to.equal ( 7 );

				// It stopped rendering.
				await new Promise ( ( done ) => { setTimeout ( done, 100 ); } );
				expect ( s.frame.count - before ).to.equal ( 7 );
			} );

			it ( "Should stop early when it takes too long", async function ()
			{
				const m = await surface!.measure ( { frames: 1000, warmUp: 0, maxTime: 50 } );
				expect ( m.frames ).to.be.greaterThan ( 0 );
				expect ( m.frames ).to.be.lessThan ( 1000 );
			} );

			it ( "Should not measure twice at once", async function ()
			{
				const s = surface!;
				const first = s.measure ( { frames: 2, warmUp: 0 } );
				expect ( s.measuring ).to.be.true;
				expect ( () => s.measure() ).to.throw ( "Already measuring" );
				await first;
			} );

			it ( "Should reject bad options", function ()
			{
				const s = surface!;
				expect ( () => s.measure ( { frames: 0 } ) ).to.throw();
				expect ( () => s.measure ( { frames: 1.5 } ) ).to.throw();
				expect ( () => s.measure ( { warmUp: -1 } ) ).to.throw();
				expect ( () => s.measure ( { maxTime: 0 } ) ).to.throw();
				expect ( s.measuring ).to.be.false;
			} );

			it ( "Should finish with the frames it has when destroyed", async function ()
			{
				const s = surface!;
				const promise = s.measure ( { frames: 1000, warmUp: 0 } );
				s.destroy();
				surface = null;
				const m = await promise;
				expect ( m.frames ).to.equal ( 0 );
			} );
		} );
	} );
};
