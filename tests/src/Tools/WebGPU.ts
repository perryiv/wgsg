///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for WebGPU functions.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	getDeviceData,
	getRenderingContext,
	IDeviceData,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "WebGPU", function ()
	{
		it ( "Make sure WebGPU is supported", function ()
		{
			expect ( navigator ).to.exist;
			expect ( navigator instanceof Navigator ).to.be.true;
			const { gpu } = navigator;
			expect ( gpu ).to.exist;
			expect ( gpu instanceof GPU ).to.be.true;
		} );

		it ( "Use the getDeviceData function", async function ()
		{
			const { device }: IDeviceData = await getDeviceData();
			expect ( device ).to.exist;
			expect ( device instanceof GPUDevice ).to.be.true;
		} );

		it ( "Use the getRenderingContext function", async function ()
		{
			const canvas = document.createElement ( "canvas" );
			expect ( canvas ).to.exist;
			expect ( canvas instanceof HTMLCanvasElement ).to.be.true;
			const { device } = await getDeviceData();
			const context = getRenderingContext ( { device, canvas } );
			expect ( context ).to.exist;
			expect ( context instanceof GPUCanvasContext ).to.be.true;
		} );
	} );
};
