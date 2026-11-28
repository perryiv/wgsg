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

import type { IVector4 } from "../Types/Vector";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants. The math constants are in Math/Constants.ts.
//
///////////////////////////////////////////////////////////////////////////////

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


// The default material, the same as OpenGL's. See the Material attribute.
export const DEFAULT_AMBIENT:  Readonly<IVector4> = [ 0.2, 0.2, 0.2, 1.0 ];
export const DEFAULT_DIFFUSE:  Readonly<IVector4> = [ 0.8, 0.8, 0.8, 1.0 ];
export const DEFAULT_SPECULAR: Readonly<IVector4> = [ 0.0, 0.0, 0.0, 1.0 ];
export const DEFAULT_EMISSION: Readonly<IVector4> = [ 0.0, 0.0, 0.0, 1.0 ];
export const DEFAULT_SHININESS = 0;

// The largest shininess, as in OpenGL.
export const MAX_SHININESS = 128;

// The default ambient light.
export const DEFAULT_AMBIENT_LIGHT: Readonly<IVector4> = [ 0.1, 0.1, 0.1, 1.0 ];
