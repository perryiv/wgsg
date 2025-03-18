
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	WebGPU functions.
//
///////////////////////////////////////////////////////////////////////////////

interface GPUData
{
	adapter: GPUAdapter,
	device: GPUDevice,
};


///////////////////////////////////////////////////////////////////////////////
//
//	Return the WebGPU adapter and device.
//
///////////////////////////////////////////////////////////////////////////////

export const getData = async ( options?: GPURequestAdapterOptions ) : Promise < GPUData > =>
{
	// Shortcut.
	const { gpu } = navigator;

	// Handle no WebGPU support.
	if ( !gpu )
	{
		throw new Error ( "WebGPU is not supported" );
	}

	// Get the adapter.
	const adapter = await gpu.requestAdapter ( options );

	// Handle no adapter.
	if ( !adapter )
	{
		throw new Error ( "Failed to get WebGPU adapter" );
	}

	// Get the device.
	const device = await adapter.requestDevice();

	// Handle no device.
	if ( !device )
	{
		throw new Error ( "Failed to get device from WebGPU adapter" );
	}

	// If we get to here then return the data.
	return { adapter, device };
};


///////////////////////////////////////////////////////////////////////////////
//
//	Return the WebGPU device.
//
///////////////////////////////////////////////////////////////////////////////

export const getDevice = async () : Promise < GPUDevice > =>
{
  const { device } = await getData();
  return device;
};
