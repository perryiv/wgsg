///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the object matrices.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { IDENTITY_MATRIX } from "../../../lib/src/Math/Constants";
import { ObjectMatrices } from "../../../lib/src/Shaders/ObjectMatrices";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "ObjectMatrices", function ()
	{
		this.beforeAll ( async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}
		} );

		it ( "Should give each matrix its own offset, as far apart as the device needs", function ()
		{
			const align = Device.instance.device.limits.minUniformBufferOffsetAlignment;
			const objects = new ObjectMatrices();
			objects.begin ( 3 );
			const offsets = [ 0, 1, 2 ].map ( () => objects.add ( IDENTITY_MATRIX ) );
			expect ( offsets[0] ).to.equal ( 0 );
			expect ( offsets[1] ).to.equal ( Math.max ( 64, align ) );
			expect ( offsets[2] ).to.equal ( 2 * offsets[1] );
			expect ( objects.count ).to.equal ( 3 );
			objects.destroy();
		} );

		it ( "Should start counting again in the next frame", function ()
		{
			const objects = new ObjectMatrices();
			objects.begin ( 2 );
			objects.add ( IDENTITY_MATRIX );
			objects.add ( IDENTITY_MATRIX );
			objects.begin ( 2 );
			expect ( objects.count ).to.equal ( 0 );
			expect ( objects.add ( IDENTITY_MATRIX ) ).to.equal ( 0 );
			objects.destroy();
		} );

		it ( "Should grow when a frame has more matrices", function ()
		{
			const objects = new ObjectMatrices();
			objects.begin ( 1 );
			objects.begin ( 100 );
			for ( let i = 0; i < 100; ++i )
			{
				objects.add ( IDENTITY_MATRIX );
			}
			expect ( objects.count ).to.equal ( 100 );
			objects.destroy();
		} );

		it ( "Should not take more matrices than there is room for", function ()
		{
			const objects = new ObjectMatrices();
			objects.begin ( 0 ); // Still makes room for some.
			expect ( () =>
			{
				for ( let i = 0; i < 1000; ++i )
				{
					objects.add ( IDENTITY_MATRIX );
				}
			} ).to.throw ( "object matrices given to begin()" );
			objects.destroy();
		} );

		it ( "Should not bind before begin()", function ()
		{
			const objects = new ObjectMatrices();
			const pass = {} as GPURenderPassEncoder;
			expect ( () => objects.bind ( pass, 0 ) ).to.throw ( "before calling begin()" );
		} );

		it ( "Should make and write the buffer without validation errors", async function ()
		{
			const { device } = Device.instance;
			device.pushErrorScope ( "validation" );
			const objects = new ObjectMatrices();
			objects.begin ( 5 );
			for ( let i = 0; i < 5; ++i )
			{
				objects.add ( IDENTITY_MATRIX );
			}
			objects.upload();
			objects.destroy();
			expect ( await device.popErrorScope() ).to.be.null;
		} );
	} );
};
