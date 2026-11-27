///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for GPU device wrapper class.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Device } from "../../../lib/src/Tools/Device";
import { loseDevice, restoreDevice } from "../Helpers/DeviceLoss";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Device", function ()
	{
		it ( "Make sure WebGPU is supported", async function ()
		{
			expect ( await Device.isSupported() ).to.be.true;
			expect ( globalThis.navigator instanceof Navigator ).to.be.true;
			const { gpu } = globalThis.navigator;
			expect ( gpu ).to.exist;
			expect ( gpu instanceof GPU ).to.be.true;
		} );

		it ( "Can make a device and use it", async function ()
		{
			await Device.init();
			const device = Device.instance;

			expect ( device ).to.exist;
			expect ( "Tools.Device" === device.type ).to.be.true;

			expect ( device instanceof Device ).to.be.true;
			expect ( device.device instanceof GPUDevice ).to.be.true;

			const preferredFormat = device.preferredFormat
			expect ( preferredFormat ).to.exist;
			expect ( device.preferredFormat ).to.be.equal ( preferredFormat );

			const canvas = document.createElement ( "canvas" );
			expect ( canvas ).to.exist;
			expect ( canvas instanceof HTMLCanvasElement ).to.be.true;

			const context = Device.instance.getConfiguredContext ( canvas );
			expect ( context ).to.exist;
			expect ( context instanceof GPUCanvasContext ).to.be.true;
		} );
	} );

	describe ( "Device lost", function ()
	{
		this.beforeEach ( async function ()
		{
			await Device.init();
		} );

		this.afterEach ( async function ()
		{
			await restoreDevice();
		} );

		it ( "Should call the lost function, and wait to be told to make a new device", async function ()
		{
			const old = Device.instance.id;
			let called: ( GPUDeviceLostInfo | null ) = null;
			Device.onLost = ( info ) =>
			{
				called = info;
			};

			const info = await loseDevice();
			expect ( called ).to.equal ( info );
			expect ( info.reason ).to.equal ( "destroyed" );

			// There is no device until we ask for one.
			expect ( Device.valid ).to.be.false;
			await Device.recover();
			expect ( Device.valid ).to.be.true;
			expect ( Device.instance.id ).to.not.equal ( old );
		} );

		it ( "Should make a new device by itself when told to", async function ()
		{
			const old = Device.instance.id;
			let lostCalled = false;
			Device.onLost = () =>
			{
				lostCalled = true;
			};
			Device.autoRecoverWhenDeviceLost = true;

			// Wait for the new device.
			let resolve: () => void = () => undefined;
			const recovered = new Promise < void > ( ( done ) => { resolve = done; } );
			Device.addRecoveredCallback ( resolve );
			try
			{
				await loseDevice();
				await recovered;
			}
			finally
			{
				Device.removeRecoveredCallback ( resolve );
			}

			expect ( lostCalled ).to.be.true;
			expect ( Device.valid ).to.be.true;
			expect ( Device.instance.id ).to.not.equal ( old );
		} );

		it ( "Should not call the lost function or recover when destroyed on purpose", async function ()
		{
			let lostCalled = false;
			Device.onLost = () =>
			{
				lostCalled = true;
			};
			Device.autoRecoverWhenDeviceLost = true;

			const lost = Device.instance.device.lost;
			Device.destroy();
			await lost;
			await new Promise ( ( done ) => { setTimeout ( done, 50 ); } );

			expect ( lostCalled ).to.be.false;
			expect ( Device.valid ).to.be.false;
		} );

		it ( "Should make one new device for calls at the same time, and none when there is one", async function ()
		{
			let count = 0;
			const counter = () =>
			{
				++count;
			};
			Device.addRecoveredCallback ( counter );
			try
			{
				await loseDevice();
				await Promise.all ( [ Device.recover(), Device.recover(), Device.recover() ] );
				expect ( count ).to.equal ( 1 );
				const id = Device.instance.id;

				// There is a device, so this does nothing.
				await Device.recover();
				expect ( count ).to.equal ( 1 );
				expect ( Device.instance.id ).to.equal ( id );
			}
			finally
			{
				Device.removeRecoveredCallback ( counter );
			}
		} );
	} );
};
