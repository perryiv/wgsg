///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test drawing with textures.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { FlatEdges } from "../../../lib/src/Shaders/FlatEdges";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { PhongEdges } from "../../../lib/src/Shaders/PhongEdges";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import { Texture, type ITextureInput } from "../../../lib/src/Textures/Texture";
import { toPixel } from "../Helpers/Pixels";
import type { IVector4 } from "../../../lib/src/Types";
import {
	Group,
	Material,
	State,
	TextureSet,
} from "../../../lib/src/Scene";
import {
	drawScene,
	expectPixel,
	makeSquare,
	pixelAt,
	type IShaderClass,
} from "../Helpers/Squares";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

const BLACK: IVector4 = [ 0, 0, 0, 1 ];
const WHITE: IVector4 = [ 1, 1, 1, 1 ];

// A checker of four pixels: red and green on the top row, blue and white on
// the bottom row.
const CHECKER = new Uint8Array ( [
	255, 0, 0, 255,     0, 255, 0, 255,
	0, 0, 255, 255,     255, 255, 255, 255,
] );

// The texture coordinates of a square's corners, in the order lower left,
// lower right, upper right, and upper left. The top of the image is v = 0.
const ONCE = [ 0, 1,   1, 1,   1, 0,   0, 0 ];
const TWICE = [ 0, 2,   2, 2,   2, 0,   0, 0 ];

/**
 * Make a state with the shader, a material, and a texture.
 * @param {IShaderClass} shader - The shader class.
 * @param {Texture} texture - The diffuse texture.
 * @param {IVector4} [diffuse] - The material's diffuse color.
 * @returns {State} The state.
 */
const makeState = ( shader: IShaderClass, texture: Texture, diffuse: IVector4 = WHITE ) : State =>
{
	const state = shader.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new Material ( { diffuse, ambient: BLACK } ) );
	state.addAttribute ( new TextureSet ( { diffuse: texture } ) );
	return state;
};

/**
 * Draw one big square, centered, with the texture.
 * @param {IShaderClass} shader - The shader class.
 * @param {ITextureInput} input - The texture.
 * @param {number[] | null} texCoords - The texture coordinates, if any.
 * @param {IVector4[] | null} [colors] - The vertex colors, if any.
 * @param {IVector4} [diffuse] - The material's diffuse color.
 * @returns {Promise<Function>} Gets the pixel at a point on the square, from
 * -1 to 1 across it.
 */
const draw = async ( shader: IShaderClass, input: ITextureInput, texCoords: ( number[] | null ),
	colors: ( IVector4[] | null ) = null, diffuse: IVector4 = WHITE ) : Promise < ( x: number, y: number ) => number[] > =>
{
	const scene = new Group();
	const square = makeSquare ( [ 0, 0, 0 ], makeState ( shader, new Texture ( input ), diffuse ), colors, [ 0, 0, 1 ], texCoords );

	// Make it bigger than the usual square, which is 0.8 wide.
	const points = square.points!.values!;
	square.points = points.map ( ( value, i ) => ( ( 2 === ( i % 3 ) ) ? value : ( value * 2 ) ) );
	scene.addChild ( square );
	const pixels = await drawScene ( scene );
	return ( x: number, y: number ) => pixelAt ( pixels, ( x * 0.8 ), ( y * 0.8 ) );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Textures", function ()
	{
		this.beforeAll ( async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}
		} );

		it ( "Should draw the texture's pixels where they go on the shape", async function ()
		{
			const at = await draw ( SolidColor, { image: { width: 2, height: 2, data: CHECKER }, magFilter: "nearest" }, ONCE );
			expectPixel ( at ( -0.5, 0.5 ), [ 255, 0, 0, 255 ] );
			expectPixel ( at ( 0.5, 0.5 ), [ 0, 255, 0, 255 ] );
			expectPixel ( at ( -0.5, -0.5 ), [ 0, 0, 255, 255 ] );
			expectPixel ( at ( 0.5, -0.5 ), [ 255, 255, 255, 255 ] );
		} );

		it ( "Should repeat the texture past its edge, or use the edge pixels when clamping", async function ()
		{
			// With coordinates from 0 to 2, the checker repeats. The upper left
			// quarter of the square is the whole checker again.
			const image = { width: 2, height: 2, data: CHECKER };
			const repeat = await draw ( SolidColor, { image, magFilter: "nearest" }, TWICE );
			expectPixel ( repeat ( -0.75, 0.75 ), [ 255, 0, 0, 255 ] );
			expectPixel ( repeat ( -0.25, 0.75 ), [ 0, 255, 0, 255 ] );
			expectPixel ( repeat ( 0.25, 0.75 ), [ 255, 0, 0, 255 ] );

			// Clamped, the right half is the right column, and the bottom half
			// is the bottom row.
			const clamp = await draw ( SolidColor, { image, magFilter: "nearest", wrapU: "clamp-to-edge", wrapV: "clamp-to-edge" }, TWICE );
			expectPixel ( clamp ( -0.75, 0.75 ), [ 255, 0, 0, 255 ] );
			expectPixel ( clamp ( 0.25, 0.75 ), [ 0, 255, 0, 255 ] );
			expectPixel ( clamp ( 0.75, 0.75 ), [ 0, 255, 0, 255 ] );
			expectPixel ( clamp ( 0.75, -0.75 ), [ 255, 255, 255, 255 ] );
		} );

		it ( "Should turn an sRGB texture's pixels into linear values, and not a data texture's", async function ()
		{
			// A pixel of 188 is linear 0.5 in sRGB, which is drawn as 188 again.
			const gray = { width: 1, height: 1, data: new Uint8Array ( [ 188, 188, 188, 255 ] ) };
			const color = await draw ( SolidColor, { image: gray }, ONCE );
			expectPixel ( color ( 0, 0 ), [ 188, 188, 188, 255 ] );

			// In a data texture, 188 is linear 0.737, which is drawn lighter.
			const data = await draw ( SolidColor, { image: gray, srgb: false }, ONCE );
			const light = toPixel ( 188 / 255 );
			expectPixel ( data ( 0, 0 ), [ light, light, light, 255 ] );
		} );

		it ( "Should multiply the texture by the material's color and the vertex colors", async function ()
		{
			// Linear 0.5 gray, times a material of [ 1, 1, 0.5 ], times vertex
			// colors of [ 1, 0.5, 1 ].
			const gray = { width: 1, height: 1, data: new Uint8Array ( [ 188, 188, 188, 255 ] ) };
			const vertex: IVector4 = [ 1, 0.5, 1, 1 ];
			const at = await draw ( SolidColor, { image: gray }, ONCE, [ vertex, vertex, vertex, vertex ], [ 1, 1, 0.5, 1 ] );
			expectPixel ( at ( 0, 0 ), [ toPixel ( 0.5 ), toPixel ( 0.25 ), toPixel ( 0.25 ), 255 ] );
		} );

		it ( "Should draw textures with each shader", async function ()
		{
			// Facing the light, a white material shows the texture as it is.
			const image = { width: 2, height: 2, data: CHECKER };
			for ( const shader of [ FlatShading, PhongShading, SolidColor, FlatEdges, PhongEdges ] )
			{
				const at = await draw ( shader, { image, magFilter: "nearest" }, ONCE );
				expectPixel ( at ( -0.4, 0.6 ), [ 255, 0, 0, 255 ] );
				expectPixel ( at ( 0.6, -0.4 ), [ 255, 255, 255, 255 ] );
				expectPixel ( at ( -0.7, -0.2 ), [ 0, 0, 255, 255 ] );
			}
		} );

		it ( "Should use the top left pixel when the shape has no texture coordinates", async function ()
		{
			const image = { width: 2, height: 2, data: CHECKER };
			for ( const shader of [ FlatShading, PhongShading, SolidColor, FlatEdges, PhongEdges ] )
			{
				const at = await draw ( shader, { image, magFilter: "nearest" }, null );
				expectPixel ( at ( -0.6, 0.4 ), [ 255, 0, 0, 255 ] );
				expectPixel ( at ( 0.4, -0.6 ), [ 255, 0, 0, 255 ] );
			}
		} );
	} );
};
