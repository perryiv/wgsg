///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helpers for tests that draw squares in front of the camera and check the
//	pixels. The camera is the identity, so x and y go from -1 to 1 across the
//	picture, and the background is blue.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { getPixel, makeTexture, readPixels, type IPixels } from "./Pixels";
import { makeRenderGraphInfo, Root } from "../../../lib/src/Render";
import type { IRenderGraphInfo, IVector3, IVector4 } from "../../../lib/src/Types";
import {
	ColorAttribute,
	Geometry,
	Group,
	Indexed,
	State,
} from "../../../lib/src/Scene";
import {
	Cull as CullVisitor,
	Draw as DrawVisitor,
} from "../../../lib/src/Visitors";


///////////////////////////////////////////////////////////////////////////////
//
//	Types and constants.
//
///////////////////////////////////////////////////////////////////////////////

// The size of the picture, in pixels.
const SIZE = 32;

// The background.
export const BACKGROUND: IVector4 = [ 0, 0, 1, 1 ];

// A shader class, which makes states.
export interface IShaderClass
{
	makeState: ( input: { topology: GPUPrimitiveTopology } ) => State;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a square in front of the camera, facing it.
 * @param {IVector3} center - The center.
 * @param {State} state - The state.
 * @param {IVector4[] | null} [colors] - The color of each corner, if any, in
 * the order lower left, lower right, upper right, and upper left.
 * @param {IVector3} [normal] - The normal of every corner. The default is
 * towards the camera.
 * @returns {Geometry} The square.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeSquare = ( center: IVector3, state: State, colors: ( IVector4[] | null ) = null, normal: IVector3 = [ 0, 0, 1 ] ) : Geometry =>
{
	const h = 0.4;
	const [ x, y, z ] = center;
	const points = [ x - h, y - h, z,   x + h, y - h, z,   x + h, y + h, z,   x - h, y + h, z ];
	const square = new Geometry ( {
		points: new Float32Array ( points ),
		normals: new Float32Array ( [ ...normal, ...normal, ...normal, ...normal ] ),
		colors: ( colors ? new Float32Array ( colors.flat() ) : null ),
		primitives: new Indexed ( { topology: "triangle-list", indices: new Uint16Array ( [ 0, 1, 2,   0, 2, 3 ] ) } ),
	} );
	square.state = state;
	return square;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a state with the shader and color.
 * @param {IShaderClass} shader - The shader class.
 * @param {IVector4} color - The color.
 * @returns {State} The state.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeColorState = ( shader: IShaderClass, color: IVector4 ) : State =>
{
	const state = shader.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new ColorAttribute ( color ) );
	return state;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull the scene.
 * @param {Group} scene - The scene.
 * @returns {object} The render graph and its info.
 */
///////////////////////////////////////////////////////////////////////////////

export const cull = ( scene: Group ) : { root: Root, info: IRenderGraphInfo } =>
{
	const root = new Root();
	const cv = new CullVisitor ( { root } );
	const info = makeRenderGraphInfo();
	cv.renderGraphInfo = info;
	cv.reset();
	scene.accept ( cv );
	return { root, info };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull and draw the scene into a texture, and read the pixels.
 * @param {Group} scene - The scene.
 * @returns {Promise<IPixels>} The pixels.
 */
///////////////////////////////////////////////////////////////////////////////

export const drawScene = async ( scene: Group ) : Promise < IPixels > =>
{
	const { root } = cull ( scene );
	const texture = makeTexture ( SIZE );
	const dv = new DrawVisitor ( { texture } );
	dv.clearColor = BACKGROUND;
	dv.draw ( root, 1 );
	const pixels = await readPixels ( texture );
	texture.destroy();
	return pixels;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the pixel at a point on the screen.
 * @param {IPixels} pixels - The pixels.
 * @param {number} x - From -1 (left) to 1 (right).
 * @param {number} y - From -1 (bottom) to 1 (top).
 * @returns {number[]} The pixel, in RGBA order.
 */
///////////////////////////////////////////////////////////////////////////////

export const pixelAt = ( pixels: IPixels, x: number, y: number ) : number[] =>
{
	const column = Math.floor ( ( ( x + 1 ) / 2 ) * SIZE );
	const row = Math.floor ( ( ( 1 - y ) / 2 ) * SIZE );
	return getPixel ( pixels, column, row );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Expect the pixel to be close to the expected one, give or take rounding.
 * @param {number[]} pixel - The pixel.
 * @param {number[]} expected - The expected pixel, in RGBA order.
 */
///////////////////////////////////////////////////////////////////////////////

export const expectPixel = ( pixel: number[], expected: number[] ) : void =>
{
	expect ( pixel.length ).to.equal ( expected.length );
	for ( let i = 0; i < expected.length; ++i )
	{
		expect ( pixel[i], `channel ${i} of [${pixel.join ( ", " )}]` ).to.be.closeTo ( expected[i], 2 );
	}
};
