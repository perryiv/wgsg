///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

import type { IMatrix44 } from "../Types/Matrix";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

export const IDENTITY_MATRIX: Readonly<IMatrix44> = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
];

export const DEG_TO_RAD = ( Math.PI / 180 );
export const RAD_TO_DEG = ( 180 / Math.PI );

// Constants used in projections.
export const MIN_NEAR_DISTANCE = ( 0.001 );
export const MAX_FAR_DISTANCE  = ( 1e6 );
export const MAX_FAR_OVER_NEAR_RATIO = ( 1e4 );
export const DEFAULT_NEAR_DISTANCE = 0.1;
export const DEFAULT_FAR_DISTANCE = 1e4;

// Convenience constant(s) when setting the state's bin.
// Bins are drawn in increasing order within a layer, so semi-transparent
// shapes in this bin are drawn after the opaque ones. See the Depth attribute.
// To draw a closed shape's back faces and then its front faces, put the
// back faces in this bin and the front faces in TRANSPARENT_BIN + 1.
// The function buildTransparentScene() does that.
export const TRANSPARENT_BIN = 1000;
