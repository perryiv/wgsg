///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Render graph info.
//
///////////////////////////////////////////////////////////////////////////////

import { IRenderGraphInfo } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the default render graph info.
 * @returns {IRenderGraphInfo} The default render graph info.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeRenderGraphInfo = () : IRenderGraphInfo =>
{
	return {
		numLayers: 0,
		numBins: 0,
		numPipelines: 0,
		numProjMatrixGroups: 0,
		numViewMatrixGroups: 0,
		numStateGroups: 0,
		numShapes: 0,
		numTriangles: 0,
		numLines: 0
	};
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Reset the render graph info.
 * @param {IRenderGraphInfo} info - The render graph info.
 */
///////////////////////////////////////////////////////////////////////////////

export const resetRenderGraphInfo = ( info: IRenderGraphInfo ) : void =>
{
	info.numLayers = 0;
	info.numBins = 0;
	info.numPipelines = 0;
	info.numProjMatrixGroups = 0;
	info.numViewMatrixGroups = 0;
	info.numStateGroups = 0;
	info.numShapes = 0;
	info.numTriangles = 0;
	info.numLines = 0;
};
