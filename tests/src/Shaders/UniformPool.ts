///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the pool of uniform buffers. These need a GPU.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { UniformPool } from "../../../lib/src/Shaders/UniformPool";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

// The size of the values in these tests.
const SIZE = 16;

/**
 * Make a pool for the tests.
 * @returns {UniformPool} The pool.
 */
const makePool = () : UniformPool =>
{
	const layout = Device.instance.device.createBindGroupLayout ( {
		entries: [ {
			binding: 0,
			visibility: GPUShaderStage.VERTEX,
			buffer: { type: "uniform" },
		} ],
	} );
	return new UniformPool ( { label: "test", layout, size: SIZE } );
};

/**
 * Make some values for the tests.
 * @param {number} value - The value to fill with.
 * @returns {ArrayBuffer} The values.
 */
const makeValues = ( value: number ) : ArrayBuffer =>
{
	return new Float32Array ( SIZE / 4 ).fill ( value ).buffer;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "UniformPool", function ()
	{
		it ( "Should reuse the buffer when the values did not change", function ()
		{
			const pool = makePool();
			const a = pool.use ( 1, true, makeValues ( 1 ) );
			const b = pool.use ( 1, false, makeValues ( 1 ) );
			expect ( b ).to.equal ( a );
			expect ( pool.length ).to.equal ( 1 );
			pool.destroy();
		} );

		it ( "Should use the next buffer when the values changed in the same frame", function ()
		{
			const pool = makePool();
			const a = pool.use ( 1, true, makeValues ( 1 ) );
			const b = pool.use ( 1, true, makeValues ( 2 ) );
			expect ( b ).to.not.equal ( a );
			expect ( pool.length ).to.equal ( 2 );
			pool.destroy();
		} );

		it ( "Should start over at the first buffer in a new frame", function ()
		{
			const pool = makePool();
			const a = pool.use ( 1, true, makeValues ( 1 ) );
			pool.use ( 1, true, makeValues ( 2 ) );

			// Unchanged values still start over at the first buffer.
			const c = pool.use ( 2, false, makeValues ( 2 ) );
			expect ( c ).to.equal ( a );
			expect ( pool.length ).to.equal ( 2 );
			pool.destroy();
		} );

		it ( "Should not make more buffers when every frame needs the same number", function ()
		{
			const pool = makePool();
			for ( let frame = 1; frame <= 10; ++frame )
			{
				pool.use ( frame, true, makeValues ( 1 ) );
				pool.use ( frame, true, makeValues ( 2 ) );
				pool.use ( frame, true, makeValues ( 3 ) );
			}
			expect ( pool.length ).to.equal ( 3 );
			pool.destroy();
		} );

		it ( "Should destroy the buffers that the recent frames did not need", function ()
		{
			const pool = makePool();

			// One frame needs 3 buffers.
			pool.use ( 1, true, makeValues ( 1 ) );
			pool.use ( 1, true, makeValues ( 2 ) );
			pool.use ( 1, true, makeValues ( 3 ) );
			expect ( pool.length ).to.equal ( 3 );

			// Then the frames need only one. The extra buffers are kept until
			// the frame that needed them is no longer one of the recent frames.
			const last = 1 + UniformPool.purgeFrames;
			for ( let frame = 2; frame <= last; ++frame )
			{
				pool.use ( frame, false, makeValues ( 1 ) );
			}
			expect ( pool.length ).to.equal ( 3 );

			pool.use ( last + 1, false, makeValues ( 1 ) );
			expect ( pool.length ).to.equal ( 1 );
			pool.destroy();
		} );

		it ( "Should use the number of frames that is set", function ()
		{
			const original = UniformPool.purgeFrames;
			try
			{
				UniformPool.purgeFrames = 5;
				expect ( UniformPool.purgeFrames ).to.equal ( 5 );

				// One frame needs 3 buffers, then 5 frames need only one.
				const pool = makePool();
				pool.use ( 1, true, makeValues ( 1 ) );
				pool.use ( 1, true, makeValues ( 2 ) );
				pool.use ( 1, true, makeValues ( 3 ) );
				for ( let frame = 2; frame <= 6; ++frame )
				{
					pool.use ( frame, false, makeValues ( 1 ) );
				}
				expect ( pool.length ).to.equal ( 3 );

				pool.use ( 7, false, makeValues ( 1 ) );
				expect ( pool.length ).to.equal ( 1 );
				pool.destroy();
			}
			finally
			{
				UniformPool.purgeFrames = original;
			}
		} );

		it ( "Should only accept a positive integer for the number of frames", function ()
		{
			const original = UniformPool.purgeFrames;
			for ( const frames of [ 0, -1, 1.5, NaN, Infinity ] )
			{
				expect ( () => { UniformPool.purgeFrames = frames; } ).to.throw();
			}
			expect ( UniformPool.purgeFrames ).to.equal ( original );
		} );

		it ( "Should make and write buffers without validation errors", async function ()
		{
			const device = Device.instance.device;
			device.pushErrorScope ( "validation" );
			const pool = makePool();
			pool.use ( 1, true, makeValues ( 1 ) );
			pool.use ( 1, true, makeValues ( 2 ) );
			pool.use ( 2, true, makeValues ( 3 ) );
			pool.destroy();
			expect ( await device.popErrorScope() ).to.be.null;
		} );

		it ( "Should keep the buffer when the values change back to what it has", function ()
		{
			const pool = makePool();
			const a = pool.use ( 1, true, makeValues ( 1 ) );
			const b = pool.use ( 1, true, makeValues ( 1 ) );
			expect ( b ).to.equal ( a );
			expect ( pool.length ).to.equal ( 1 );
			pool.destroy();
		} );

		it ( "Should not write values that the buffer already has", function ()
		{
			const { queue } = Device.instance.device;
			const writeBuffer = queue.writeBuffer.bind ( queue );
			let count = 0;
			queue.writeBuffer = ( ...args: Parameters < typeof queue.writeBuffer > ) =>
			{
				++count;
				writeBuffer ( ...args );
			};
			try
			{
				const pool = makePool();
				pool.use ( 1, true, makeValues ( 1 ) );
				expect ( count ).to.equal ( 1 );

				// A new frame with the same values, even if they were set again.
				pool.use ( 2, true, makeValues ( 1 ) );
				expect ( count ).to.equal ( 1 );

				// Different values are written.
				pool.use ( 3, true, makeValues ( 2 ) );
				expect ( count ).to.equal ( 2 );
				pool.destroy();
			}
			finally
			{
				queue.writeBuffer = writeBuffer;
			}
		} );

		it ( "Should have no buffers after it is destroyed", function ()
		{
			const pool = makePool();
			pool.use ( 1, true, makeValues ( 1 ) );
			pool.destroy();
			expect ( pool.length ).to.equal ( 0 );
		} );
	} );
};
