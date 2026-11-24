///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the frame times.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { FrameTimes } from "../../../lib/src/Viewers/FrameTimes";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Add a frame that starts at the given time, with the given CPU times.
 * @param {FrameTimes} times - The frame times.
 * @param {number} start - When the frame starts.
 * @param {number} update - The update time.
 * @param {number} cull - The cull time.
 * @param {number} draw - The draw time.
 */
const addFrame = ( times: FrameTimes, start: number, update = 1, cull = 2, draw = 3 ) : void =>
{
	times.addFrame ( { start, update, cull, draw } );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "FrameTimes", function ()
	{
		it ( "Should have nothing before the first frame", function ()
		{
			const summary = new FrameTimes().summary;
			expect ( summary.cpu ).to.be.null;
			expect ( summary.gpu ).to.be.null;
			expect ( summary.gpuMethod ).to.be.null;
			expect ( summary.interval ).to.be.null;
			expect ( summary.rate ).to.be.null;
		} );

		it ( "Should add the stages to get the CPU time", function ()
		{
			const times = new FrameTimes();
			addFrame ( times, 100, 1, 2, 3 );
			addFrame ( times, 110, 3, 4, 5 );
			const { update, cull, draw, cpu } = times.summary;
			expect ( update ).to.deep.equal ( { average: 2, min: 1, max: 3, count: 2 } );
			expect ( cull ).to.deep.equal ( { average: 3, min: 2, max: 4, count: 2 } );
			expect ( draw ).to.deep.equal ( { average: 4, min: 3, max: 5, count: 2 } );
			expect ( cpu ).to.deep.equal ( { average: 9, min: 6, max: 12, count: 2 } );
		} );

		it ( "Should get the rate from the time between frames", function ()
		{
			const times = new FrameTimes();
			for ( let i = 0; i < 5; ++i )
			{
				addFrame ( times, ( 1000 + ( i * 20 ) ) );
			}
			const { interval, rate } = times.summary;
			expect ( interval?.count ).to.equal ( 4 );
			expect ( interval?.average ).to.equal ( 20 );
			expect ( rate ).to.equal ( 50 );
		} );

		it ( "Should not count the time the viewer was idle toward the rate", function ()
		{
			const times = new FrameTimes ( { maxInterval: 250 } );
			addFrame ( times, 1000 );
			addFrame ( times, 1010 );
			addFrame ( times, 1500 ); // Idle in between.
			addFrame ( times, 1510 );
			const { interval, rate, cpu } = times.summary;
			expect ( interval?.count ).to.equal ( 2 );
			expect ( rate ).to.equal ( 100 );
			expect ( cpu?.count ).to.equal ( 4 );
		} );

		it ( "Should forget frames older than the window", function ()
		{
			const times = new FrameTimes ( { window: 1000 } );
			addFrame ( times, 0, 10, 10, 10 );
			addFrame ( times, 500, 1, 1, 1 );
			expect ( times.summary.cpu?.count ).to.equal ( 2 );
			addFrame ( times, 1200, 1, 1, 1 );
			expect ( times.summary.cpu ).to.deep.equal ( { average: 3, min: 3, max: 3, count: 2 } );
		} );

		it ( "Should keep the GPU times, and restart them when the method changes", function ()
		{
			const times = new FrameTimes();
			addFrame ( times, 100 );
			times.addGpu ( 100, 2, "timestamps" );
			addFrame ( times, 110 );
			times.addGpu ( 110, 4, "timestamps" );
			expect ( times.summary.gpu ).to.deep.equal ( { average: 3, min: 2, max: 4, count: 2 } );
			expect ( times.summary.gpuMethod ).to.equal ( "timestamps" );

			times.addGpu ( 110, 7, "submitted" );
			expect ( times.summary.gpu ).to.deep.equal ( { average: 7, min: 7, max: 7, count: 1 } );
			expect ( times.summary.gpuMethod ).to.equal ( "submitted" );
		} );
	} );
};
