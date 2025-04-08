
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

import { GPUData } from "../Types/Graphics";


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the WebGPU adapter and device.
 * @param {GPURequestAdapterOptions} options - Adapter options.
 * @returns {Promise<GPUData>} GPU adapter and device.
 */
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
/**
 * Return the WebGPU device.
 * @param {GPURequestAdapterOptions} options - GPU adapter options.
 * @returns {Promise<GPUDevice>} GPU device.
 */
///////////////////////////////////////////////////////////////////////////////

export const getDevice = async ( options?: GPURequestAdapterOptions ) : Promise < GPUDevice > =>
{
	const { device } = await getData ( options );
	return device;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the WebGPU rendering context for the canvas.
 * @param {GPUDevice} device - GPU device.
 * @param {HTMLCanvasElement} canvas - HTML canvas element.
 * @returns {GPUCanvasContext} Configured GPU canvas context.
 */
///////////////////////////////////////////////////////////////////////////////

export const getRenderingContext = ( device: GPUDevice, canvas: HTMLCanvasElement ) : GPUCanvasContext =>
{
	// Check input.
	if ( !device )
	{
		throw new Error ( "Invalid WebGPU device when getting rendering context" );
	}

	// Check input.
	if ( !canvas )
	{
		throw new Error ( "Invalid WebGPU canvas element when getting rendering context" );
	}

	// Get the context from the canvas.
	const context = canvas.getContext ( "webgpu" );

	// Handle invalid context.
	if ( !context )
	{
		throw new Error ( "Invalid WebGPU rendering context" );
	}

	// Shortcut.
	const { gpu } = navigator;

	// Get the default canvas format.
	const format = gpu.getPreferredCanvasFormat();

	// Handle invalid format.
	if ( !format )
	{
		throw new Error ( "Invalid preferred canvas format" );
	}

	// Configure the context.
	context.configure ( { device, format } );

	// Return the context.
	return context;
}
