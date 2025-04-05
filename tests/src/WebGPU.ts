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
//	This file was generated with Copilot and then cleaned up some.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { getData } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

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

	it ( "getData", async function ()
	{
		const { adapter, device } = await getData();
		expect ( adapter ).to.exist;
		expect ( device ).to.exist;
		expect ( adapter instanceof GPUAdapter ).to.be.true;
		expect ( device instanceof GPUDevice ).to.be.true;
	} );
} );
