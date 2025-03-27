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

import "mocha"; // Make eslint happy.
import { expect } from "chai";
import { getData, getDevice, getRenderingContext } from "../lib/tools/WebGPU";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

describe ( "WebGPU", function ()
{
	describe ( "getData", function ()
	{
		it ( "should throw an error if WebGPU is not supported", async function ()
		{
			const { gpu } = navigator;
			const originalNavigatorGpu = gpu;
			( navigator as any ).gpu = undefined;

			try 
			{
				await getData();
				throw new Error ( "Expected getData to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "WebGPU is not supported" );
			} 
			finally 
			{
				( navigator as any ).gpu = originalNavigatorGpu;
			}
		} );

		it ( "should throw an error if no adapter is available", async function ()
		{
			const originalNavigatorGpu = navigator.gpu;
			( navigator as any ).gpu = {
				requestAdapter: async () => null,
			};

			try 
			{
				await getData();
				throw new Error ( "Expected getData to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "Failed to get WebGPU adapter" );
			} 
			finally 
			{
				( navigator as any ).gpu = originalNavigatorGpu;
			}
		} );

		it ( "should throw an error if no device is available", async function ()
		{
			const originalNavigatorGpu = navigator.gpu;
			( navigator as any ).gpu = {
				requestAdapter: async () => ( {
					requestDevice: async () => null,
				} ),
			};

			try 
			{
				await getData();
				throw new Error ( "Expected getData to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "Failed to get device from WebGPU adapter" );
			} 
			finally 
			{
				( navigator as any ).gpu = originalNavigatorGpu;
			}
		} );
	} );

	describe ( "getDevice", function ()
	{
		it ( "should return a GPUDevice", async function ()
		{
			const mockDevice = {};
			const originalNavigatorGpu = navigator.gpu;
			( navigator as any ).gpu = {
				requestAdapter: async () => ( {
					requestDevice: async () => mockDevice,
				} ),
			};

			const device = await getDevice();
			expect ( device ).to.equal( mockDevice );

			( navigator as any ).gpu = originalNavigatorGpu;
		} );
	} );

	describe ( "getRenderingContext", function ()
	{
		it ( "should throw an error if device is invalid", function ()
		{
			const canvas = document.createElement( "canvas" );

			try 
			{
				getRenderingContext( null as any, canvas );
				throw new Error ( "Expected getRenderingContext to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "Invalid WebGPU device when getting rendering context" );
			}
		} );

		it ( "should throw an error if canvas is invalid", function ()
		{
			const mockDevice = {};

			try 
			{
				getRenderingContext( mockDevice as any, null as any );
				throw new Error ( "Expected getRenderingContext to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "Invalid WebGPU canvas element when getting rendering context" );
			}
		} );

		it ( "should throw an error if context is invalid", function ()
		{
			const mockDevice = {};
			const canvas = document.createElement( "canvas" );
			canvas.getContext = () => null;

			try 
			{
				getRenderingContext( mockDevice as any, canvas );
				throw new Error ( "Expected getRenderingContext to throw an error" );
			} 
			catch ( error ) 
			{
				expect ( ( error as Error ).message ).to.equal( "Invalid WebGPU rendering context" );
			}
		} );

		it ( "should configure and return a GPUCanvasContext", function ()
		{
			const mockDevice = {};
			const mockContext = {
				configure: () => {},
			};
			const canvas = document.createElement( "canvas" );
			canvas.getContext = () => mockContext as any;

			const originalNavigatorGpu = navigator.gpu;
			(navigator as any).gpu = {
				getPreferredCanvasFormat: () => "bgra8unorm",
			};

			const context = getRenderingContext(mockDevice as any, canvas);
			expect (context).to.equal(mockContext);

			(navigator as any).gpu = originalNavigatorGpu;
		});
	});
});