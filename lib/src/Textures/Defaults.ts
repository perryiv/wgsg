///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	What the shaders use when there is no texture or no texture coordinates,
//	so that they don't need a version without them:
//	- A white texture, one pixel, sampled with nearest filtering, so that it
//	  gives exactly 1, which doesn't change the color it multiplies.
//	- Texture coordinates of zero, in a buffer that is read once for each
//	  instance instead of for each vertex.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools/Device";
import { makeSingleton } from "../Tools/Singleton";
import { Texture } from "./Texture";


///////////////////////////////////////////////////////////////////////////////
//
//	The white texture. It's never released by reference counting, because
//	no state holds it.
//
///////////////////////////////////////////////////////////////////////////////

const white = makeSingleton ( () => new Texture ( {
	image: { width: 1, height: 1, data: new Uint8Array ( [ 255, 255, 255, 255 ] ) },
	magFilter: "nearest",
	minFilter: "nearest",
} ) );


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the white texture.
 * @returns {Texture} The texture.
 */
///////////////////////////////////////////////////////////////////////////////

export const getWhiteTexture = () : Texture =>
{
	return white.get();
};


///////////////////////////////////////////////////////////////////////////////
//
//	The buffer of zero texture coordinates, made with the current device.
//
///////////////////////////////////////////////////////////////////////////////

let zeroBuffer: ( GPUBuffer | null ) = null;
let zeroBufferDevice = 0;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the buffer with one pair of zero texture coordinates. A new buffer is
 * zeros, so there's nothing to write.
 * @returns {GPUBuffer} The buffer.
 */
///////////////////////////////////////////////////////////////////////////////

export const getZeroTexCoordsBuffer = () : GPUBuffer =>
{
	const { id, device } = Device.instance;
	if ( ( !zeroBuffer ) || ( zeroBufferDevice !== id ) )
	{
		zeroBuffer = device.createBuffer ( {
			label: "Zero texture coordinates",
			size: 8,
			usage: GPUBufferUsage.VERTEX,
		} );
		zeroBufferDevice = id;
	}
	return zeroBuffer;
};
