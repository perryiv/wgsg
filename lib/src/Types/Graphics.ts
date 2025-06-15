
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types related to graphics.
//
///////////////////////////////////////////////////////////////////////////////

export interface IDeviceOptions
{
	requestAdapterOptions?: GPURequestAdapterOptions;
	deviceDescriptor?: GPUDeviceDescriptor;
}

export interface IDeviceData
{
	device: GPUDevice;
}

export interface IRenderingContextInput
{
	device: GPUDevice;
	canvas: ( HTMLCanvasElement | OffscreenCanvas );
}

export type ITextureFormat = GPUTextureFormat;
