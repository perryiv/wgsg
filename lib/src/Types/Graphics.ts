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

export type ITextureFormat = GPUTextureFormat;

export interface IRenderGraphInfo
{
	numLayers: number;
	numBins: number;
	numPipelines: number;
	numProjMatrixGroups: number;
	numViewMatrixGroups: number;
	numStateGroups: number;
	numShapes: number;
	numTriangles: number;
	numLines: number;
}
