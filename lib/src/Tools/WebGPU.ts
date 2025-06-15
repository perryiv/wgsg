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

import {
	IDeviceData,
	IDeviceOptions,
	IRenderingContextInput,
	ITextureFormat,
} from "../Types/Graphics";


///////////////////////////////////////////////////////////////////////////////
//
//	Needed below.
//
///////////////////////////////////////////////////////////////////////////////

let preferredCanvasFormat: ( ITextureFormat | null ) = null;


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the WebGPU device and (maybe) other related data.
 * @param {IDeviceOptions} options - Options for requesting the adapter
 * and describing the device.
 * @returns {Promise<IDeviceData>} GPU device.
 */
///////////////////////////////////////////////////////////////////////////////

export const getDeviceData = async ( options?: IDeviceOptions ) : Promise < IDeviceData > =>
{
	// Shortcut.
	const { gpu } = navigator;

	// Handle no WebGPU support.
	if ( !gpu )
	{
		throw new Error ( "WebGPU is not supported" );
	}

	// Get the adapter.
	const adapter = await gpu.requestAdapter ( options?.requestAdapterOptions );

	// Handle no adapter.
	if ( !adapter )
	{
		throw new Error ( "Failed to get WebGPU adapter" );
	}

	// Get the device from the adapter. Can only do this once with this
	// particular adapter, which is why we don't return it also.
	const device = await adapter.requestDevice ( options?.deviceDescriptor );

	// Handle no device.
	if ( !device )
	{
		throw new Error ( "Failed to get device from WebGPU adapter" );
	}

	// If we get to here then return the data.
	return { device };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the WebGPU rendering context for the canvas.
 * @param {IRenderingContextInput} input - Input for getting rendering context.
 * @returns {GPUCanvasContext} Configured GPU canvas context.
 */
///////////////////////////////////////////////////////////////////////////////

export const getRenderingContext = ( { device, canvas } : IRenderingContextInput ) : GPUCanvasContext =>
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

	// Get the default canvas format.
	const format = getPreferredCanvasFormat();

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


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the preferred canvas format for WebGPU.
 * @returns {ITextureFormat} The preferred canvas format.
 */
///////////////////////////////////////////////////////////////////////////////

export const getPreferredCanvasFormat = (): ITextureFormat =>
{
	// The first time we have to set it.
	if ( !preferredCanvasFormat )
	{
		preferredCanvasFormat = navigator.gpu.getPreferredCanvasFormat();
	}

	// Return the format.
	return preferredCanvasFormat;
};
