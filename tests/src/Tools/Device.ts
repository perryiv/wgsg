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
import { Device } from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Device", function ()
	{
		it ( "Make sure WebGPU is supported", function ()
		{
			expect ( Device.supported ).to.be.true;
			expect ( navigator instanceof Navigator ).to.be.true;
			const { gpu } = navigator;
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
};
