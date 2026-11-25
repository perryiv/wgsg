///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the draw visitor by drawing into a texture and reading the pixels.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { getPixel, makeTexture, readPixels, type IPixels } from "../Helpers/Pixels";
import { makeRenderGraphInfo, Root } from "../../../lib/src/Render";
import type { IVector3, IVector4 } from "../../../lib/src/Types";
import {
	ColorAttribute,
	Geometry,
	Group,
	Indexed,
	State,
	Transform,
	TwoSidedLight,
} from "../../../lib/src/Scene";
import {
	Cull as CullVisitor,
	Draw as DrawVisitor,
} from "../../../lib/src/Visitors";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers. The camera and projection are both the identity, so the points
//	are where they end up on the screen: x and y from -1 to 1, with y up.
//
///////////////////////////////////////////////////////////////////////////////

const SIZE = 32;
const BLUE: IVector4 = [ 0, 0, 1, 1 ];
const RED: IVector4 = [ 1, 0, 0, 1 ];
const GREEN: IVector4 = [ 0, 1, 0, 1 ];
const YELLOW: IVector4 = [ 1, 1, 0, 1 ];

/**
 * Make a square in front of the camera.
 * @param {IVector3} center - The center.
 * @param {boolean} facingCamera - True if the front of it faces the camera.
 * @param {State} state - The state.
 * @returns {Geometry} The square.
 */
const makeSquare = ( center: IVector3, facingCamera: boolean, state: State ) : Geometry =>
{
	const h = 0.4;
	const [ x, y, z ] = center;
	const points = [ x - h, y - h, z,   x + h, y - h, z,   x + h, y + h, z,   x - h, y + h, z ];
	const indices = ( facingCamera ? [ 0, 1, 2,   0, 2, 3 ] : [ 0, 2, 1,   0, 3, 2 ] );
	const square = new Geometry ( {
		points: new Float32Array ( points ),
		primitives: new Indexed ( { topology: "triangle-list", indices: new Uint16Array ( indices ) } ),
	} );
	square.state = state;
	return square;
};

/**
 * Cull and draw the scene into a texture, and read the pixels.
 * @param {Group} scene - The scene.
 * @returns {Promise<IPixels>} The pixels.
 */
const drawScene = async ( scene: Group ) : Promise < IPixels > =>
{
	const root = new Root();
	const cv = new CullVisitor ( { root } );
	cv.renderGraphInfo = makeRenderGraphInfo();
	cv.reset();
	scene.accept ( cv );

	const texture = makeTexture ( SIZE );
	const dv = new DrawVisitor ( { texture } );
	dv.clearColor = BLUE;
	dv.draw ( root, 1 );
	const pixels = await readPixels ( texture );
	texture.destroy();
	return pixels;
};

/**
 * Get the pixel at a point on the screen.
 * @param {IPixels} pixels - The pixels.
 * @param {number} x - From -1 (left) to 1 (right).
 * @param {number} y - From -1 (bottom) to 1 (top).
 * @returns {number[]} The pixel, in RGBA order.
 */
const pixelAt = ( pixels: IPixels, x: number, y: number ) : number[] =>
{
	const column = Math.floor ( ( ( x + 1 ) / 2 ) * SIZE );
	const row = Math.floor ( ( ( 1 - y ) / 2 ) * SIZE );
	return getPixel ( pixels, column, row );
};

/**
 * Expect the pixel to be the default gray, give or take rounding.
 * @param {number[]} pixel - The pixel.
 */
const expectGray = ( pixel: number[] ) : void =>
{
	expect ( pixel[0] ).to.be.closeTo ( 128, 1 );
	expect ( pixel[1] ).to.be.closeTo ( 128, 1 );
	expect ( pixel[2] ).to.be.closeTo ( 128, 1 );
	expect ( pixel[3] ).to.equal ( 255 );
};

/**
 * Build a scene with a state that sets the color and two-sided lighting,
 * drawn first, and then a state that sets neither. The second has a square
 * that faces the camera and one that faces away.
 * @returns {Group} The scene.
 */
const buildResetScene = () : Group =>
{
	const scene = new Group();

	// Drawn first. The render graph keeps the states in the order it finds them.
	const first = FlatShading.makeState ( { topology: "triangle-list" } );
	first.name = "First state, red and two-sided";
	first.addAttribute ( new ColorAttribute ( RED ) );
	first.addAttribute ( new TwoSidedLight ( true ) );
	scene.addChild ( makeSquare ( [ -0.5, 0, 0.5 ], true, first ) );

	// Drawn second, with the shader's defaults.
	const second = FlatShading.makeState ( { topology: "triangle-list" } );
	second.name = "Second state, with no attributes";
	scene.addChild ( makeSquare ( [ 0.5, 0.5, 0.5 ], true, second ) );
	scene.addChild ( makeSquare ( [ 0.5, -0.5, 0.5 ], false, second ) );

	return scene;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Draw", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should not give a state the values of the state drawn before it", async function ()
		{
			const pixels = await drawScene ( buildResetScene() );

			// The first state's square is red.
			expect ( pixelAt ( pixels, -0.5, 0 ) ).to.deep.equal ( [ 255, 0, 0, 255 ] );

			// The second state's square that faces the camera is gray, not red.
			expectGray ( pixelAt ( pixels, 0.5, 0.5 ) );

			// The one that faces away is dark, because the lighting is one-sided.
			expect ( pixelAt ( pixels, 0.5, -0.5 ) ).to.deep.equal ( [ 0, 0, 0, 255 ] );

			// The background is the clear color.
			expect ( pixelAt ( pixels, -0.95, 0.95 ) ).to.deep.equal ( [ 0, 0, 255, 255 ] );
		} );

		it ( "Should draw a later layer in front of an earlier one, even when it's farther away", async function ()
		{
			// Makes a square in front of the camera, with its own color and layer.
			const square = ( center: IVector3, color: IVector4, layer: number ) : Geometry =>
			{
				const state = FlatShading.makeState ( { topology: "triangle-list" } );
				state.addAttribute ( new ColorAttribute ( color ) );
				state.layer = layer;
				return makeSquare ( center, true, state );
			};

			// Red is the nearest, but it's in the first layer. Green and yellow are
			// in the second layer, where yellow is nearer than green.
			const scene = new Group();
			scene.addChild ( square ( [ 0, 0, 0.2 ], RED, 0 ) );
			scene.addChild ( square ( [ 0.2, 0, 0.8 ], GREEN, 1 ) );
			scene.addChild ( square ( [ 0.4, 0, 0.5 ], YELLOW, 1 ) );

			const pixels = await drawScene ( scene );

			// Only red.
			expect ( pixelAt ( pixels, -0.3, 0 ) ).to.deep.equal ( [ 255, 0, 0, 255 ] );

			// Red and green: green is in the later layer.
			expect ( pixelAt ( pixels, -0.1, 0 ) ).to.deep.equal ( [ 0, 255, 0, 255 ] );

			// Red, green, and yellow: yellow is in the later layer, and nearer than
			// green in it.
			expect ( pixelAt ( pixels, 0.3, 0 ) ).to.deep.equal ( [ 255, 255, 0, 255 ] );

			// The background is still the clear color.
			expect ( pixelAt ( pixels, -0.95, 0.95 ) ).to.deep.equal ( [ 0, 0, 255, 255 ] );
		} );

		it ( "Should clear the background when there is nothing to draw", async function ()
		{
			const pixels = await drawScene ( new Group() );
			expect ( pixelAt ( pixels, 0, 0 ) ).to.deep.equal ( [ 0, 0, 255, 255 ] );
			expect ( pixelAt ( pixels, -0.95, 0.95 ) ).to.deep.equal ( [ 0, 0, 255, 255 ] );
		} );

		it ( "Should draw each object with its own matrix", async function ()
		{
			// One square, under two transforms that move it left and right.
			const state = FlatShading.makeState ( { topology: "triangle-list" } );
			state.addAttribute ( new ColorAttribute ( RED ) );
			const square = makeSquare ( [ 0, 0, 0.5 ], true, state );
			const scene = new Group();
			for ( const x of [ -0.5, 0.5 ] )
			{
				const transform = new Transform ( [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   x, 0, 0, 1 ] );
				transform.addChild ( square );
				scene.addChild ( transform );
			}

			const pixels = await drawScene ( scene );
			expect ( pixelAt ( pixels, -0.5, 0 ) ).to.deep.equal ( [ 255, 0, 0, 255 ] );
			expect ( pixelAt ( pixels, 0.5, 0 ) ).to.deep.equal ( [ 255, 0, 0, 255 ] );

			// Between them, and where the square was before it moved, is the background.
			expect ( pixelAt ( pixels, 0, 0 ) ).to.deep.equal ( [ 0, 0, 255, 255 ] );
		} );

		it ( "Should keep the light direction when the shader resets", function ()
		{
			const shader = FlatShading.instance;
			const original = shader.lightDir;
			try
			{
				shader.lightDir = [ 1, 0, 0, 0 ];
				shader.reset();
				expect ( shader.lightDir ).to.deep.equal ( [ 1, 0, 0, 0 ] );
			}
			finally
			{
				shader.lightDir = original;
			}
		} );

		it ( "Should draw the same after the shader releases its GPU objects", async function ()
		{
			const before = await drawScene ( buildResetScene() );
			FlatShading.instance.releaseGpuObjects();
			const after = await drawScene ( buildResetScene() );
			expect ( Array.from ( after.data ) ).to.deep.equal ( Array.from ( before.data ) );
			expect ( pixelAt ( after, -0.5, 0 ) ).to.deep.equal ( [ 255, 0, 0, 255 ] );
		} );
	} );
};
