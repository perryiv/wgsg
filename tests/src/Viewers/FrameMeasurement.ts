///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test measuring the frames.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { FrameRecorder, getTimeStatistics } from "../../../lib/src/Viewers/FrameMeasurement";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "FrameMeasurement", function ()
	{
		it ( "Should have no statistics without times", function ()
		{
			expect ( getTimeStatistics ( [] ) ).to.be.null;
		} );

		it ( "Should get the statistics of an odd number of times", function ()
		{
			expect ( getTimeStatistics ( [ 5, 1, 9, 2, 3 ] ) ).to.deep.equal ( {
				average: 4, median: 3, min: 1, max: 9, count: 5,
			} );
		} );

		it ( "Should use the middle two for the median of an even number of times", function ()
		{
			expect ( getTimeStatistics ( [ 4, 1, 3, 10 ] ) ).to.deep.equal ( {
				average: 4.5, median: 3.5, min: 1, max: 10, count: 4,
			} );
		} );

		it ( "Should not change the times", function ()
		{
			const times = [ 3, 1, 2 ];
			getTimeStatistics ( times );
			expect ( times ).to.deep.equal ( [ 3, 1, 2 ] );
		} );

		it ( "Should have nothing before the first frame", function ()
		{
			const m = new FrameRecorder().getMeasurement ( 0 );
			expect ( m.frames ).to.equal ( 0 );
			expect ( m.duration ).to.equal ( 0 );
			expect ( m.interval ).to.be.null;
			expect ( m.rate ).to.be.null;
			expect ( m.cpu ).to.be.null;
			expect ( m.gpu ).to.be.null;
			expect ( m.gpuMethod ).to.be.null;
		} );

		it ( "Should keep every frame's times", function ()
		{
			const recorder = new FrameRecorder();
			recorder.addFrame ( { start: 100, update: 1, cull: 2, draw: 3 } );
			recorder.addFrame ( { start: 110, update: 2, cull: 2, draw: 2 } );
			recorder.addFrame ( { start: 130, update: 3, cull: 5, draw: 7 } );
			recorder.addGpu ( 4, "timestamps" );
			recorder.addGpu ( 6, "timestamps" );

			const m = recorder.getMeasurement ( 10 );
			expect ( m.frames ).to.equal ( 3 );
			expect ( m.warmUp ).to.equal ( 10 );
			expect ( m.duration ).to.equal ( 30 );

			// The intervals are 10 and 20.
			expect ( m.interval?.average ).to.equal ( 15 );
			expect ( m.interval?.count ).to.equal ( 2 );
			expect ( m.rate ).to.be.closeTo ( ( 1000 / 15 ), 1e-9 );

			expect ( m.update?.median ).to.equal ( 2 );
			expect ( m.cull?.max ).to.equal ( 5 );
			expect ( m.draw?.min ).to.equal ( 2 );
			expect ( m.cpu ).to.deep.equal ( { average: 9, median: 6, min: 6, max: 15, count: 3 } );

			expect ( m.gpu?.average ).to.equal ( 5 );
			expect ( m.gpuMethod ).to.equal ( "timestamps" );
			expect ( recorder.gpuTimes ).to.equal ( 2 );
		} );

		it ( "Should not mix GPU times measured in different ways", function ()
		{
			const recorder = new FrameRecorder();
			recorder.addGpu ( 4, "timestamps" );
			recorder.addGpu ( 8, "submitted" );
			const m = recorder.getMeasurement ( 0 );
			expect ( m.gpu?.count ).to.equal ( 1 );
			expect ( m.gpu?.average ).to.equal ( 8 );
			expect ( m.gpuMethod ).to.equal ( "submitted" );
		} );
	} );
};
