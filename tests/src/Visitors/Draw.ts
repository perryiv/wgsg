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
import { getPixel, makeTexture, readPixels, toPixel, type IPixels } from "../Helpers/Pixels";
import { loseDevice } from "../Helpers/DeviceLoss";
import { buildTransparentScene } from "../../../lib/src/Builders/Transparent";
import { makeRenderGraphInfo, Root } from "../../../lib/src/Render";
import { TRANSPARENT_BIN } from "../../../lib/src/Tools/Constants";
import type { IVector3, IVector4 } from "../../../lib/src/Types";
import {
	ColorAttribute,
	Depth,
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

// The ambient light (0.1) times the default ambient color (0.2), as a pixel
// value. It's added to every lit color, so black is [ A, A, A ].
const A = toPixel ( 0.02 );

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
 * Expect the pixel to be close to the expected one, give or take rounding.
 * @param {number[]} pixel - The pixel.
 * @param {number[]} expected - The expected pixel, in RGBA order.
 */
const expectPixel = ( pixel: number[], expected: number[] ) : void =>
{
	expect ( pixel.length ).to.equal ( expected.length );
	for ( let i = 0; i < expected.length; ++i )
	{
		expect ( pixel[i], `channel ${i} of [${pixel.join ( ", " )}]` ).to.be.closeTo ( expected[i], 2 );
	}
};

/**
 * Make a semi-transparent state in the transparent bin.
 * @param {IVector4} color - The color. Its alpha should be below one.
 * @param {boolean} depthWrite - Whether to write depth.
 * @returns {State} The state.
 */
const makeTransparentState = ( color: IVector4, depthWrite: boolean ) : State =>
{
	const state = FlatShading.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new ColorAttribute ( color ) );
	state.addAttribute ( new Depth ( { write: depthWrite } ) );
	state.bin = TRANSPARENT_BIN;
	return state;
};

/**
 * Expect the pixel to be the default diffuse gray (0.8) plus the ambient
 * (0.02), give or take rounding.
 * @param {number[]} pixel - The pixel.
 */
const expectGray = ( pixel: number[] ) : void =>
{
	const gray = toPixel ( 0.82 );
	expectPixel ( pixel, [ gray, gray, gray, 255 ] );
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
			expectPixel ( pixelAt ( pixels, -0.5, 0 ), [ 255, A, A, 255 ] );

			// The second state's square that faces the camera is gray, not red.
			expectGray ( pixelAt ( pixels, 0.5, 0.5 ) );

			// The one that faces away only has the ambient light, because the
			// lighting is one-sided.
			expectPixel ( pixelAt ( pixels, 0.5, -0.5 ), [ A, A, A, 255 ] );

			// The background is the clear color.
			expectPixel ( pixelAt ( pixels, -0.95, 0.95 ), [ 0, 0, 255, 255 ] );
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
			expectPixel ( pixelAt ( pixels, -0.3, 0 ), [ 255, A, A, 255 ] );

			// Red and green: green is in the later layer.
			expectPixel ( pixelAt ( pixels, -0.1, 0 ), [ A, 255, A, 255 ] );

			// Red, green, and yellow: yellow is in the later layer, and nearer than
			// green in it.
			expectPixel ( pixelAt ( pixels, 0.3, 0 ), [ 255, 255, A, 255 ] );

			// The background is still the clear color.
			expectPixel ( pixelAt ( pixels, -0.95, 0.95 ), [ 0, 0, 255, 255 ] );
		} );

		it ( "Should show a farther transparent shape through a nearer one drawn before it", async function ()
		{
			// Two half-transparent windows that overlap in the middle, and an
			// opaque square in front of the right side. The near red window is
			// added first, so it's drawn before the far green one.
			const build = ( depthWrite: boolean ) : Group =>
			{
				const scene = new Group();
				scene.addChild ( makeSquare ( [ -0.2, 0, 0.3 ], true, makeTransparentState ( [ 1, 0, 0, 0.5 ], depthWrite ) ) );
				scene.addChild ( makeSquare ( [ 0.2, 0, 0.6 ], true, makeTransparentState ( [ 0, 1, 0, 0.5 ], depthWrite ) ) );
				const opaque = FlatShading.makeState ( { topology: "triangle-list" } );
				opaque.addAttribute ( new ColorAttribute ( YELLOW ) );
				scene.addChild ( makeSquare ( [ 0.6, 0, 0.1 ], true, opaque ) );
				return scene;
			};

			// Without depth writes, green shows where they overlap. Nothing sorts
			// the transparent shapes, so green, drawn last, blends over red, which
			// blends over the blue background. Each lit color has the ambient
			// 0.02 too, so red over blue is [ 0.5, 0.01, 0.51 ], and green over
			// that is [ 0.26, 0.505, 0.265 ]. The blending is in linear values.
			const pixels = await drawScene ( build ( false ) );
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ toPixel ( 0.26 ), toPixel ( 0.505 ), toPixel ( 0.265 ), 255 ] );

			// Only red over the background.
			expectPixel ( pixelAt ( pixels, -0.4, 0 ), [ toPixel ( 0.5 ), toPixel ( 0.01 ), toPixel ( 0.51 ), 255 ] );

			// The depth test is still done, so the opaque square in front hides
			// the green window, although it's drawn first.
			expectPixel ( pixelAt ( pixels, 0.4, 0 ), [ 255, 255, A, 255 ] );

			// With depth writes, red hides green, as if red were opaque there.
			const written = await drawScene ( build ( true ) );
			expectPixel ( pixelAt ( written, 0, 0 ), [ toPixel ( 0.5 ), toPixel ( 0.01 ), toPixel ( 0.51 ), 255 ] );
		} );

		it ( "Should draw a transparent shape's back faces and then its front faces", async function ()
		{
			// A thin closed shape: a near face that faces the camera and a far face
			// that faces away, like the front and back of a box.
			const points = [
				-0.4, -0.4, 0.3,   0.4, -0.4, 0.3,   0.4, 0.4, 0.3,   -0.4, 0.4, 0.3,
				-0.4, -0.4, 0.6,   0.4, -0.4, 0.6,   0.4, 0.4, 0.6,   -0.4, 0.4, 0.6,
			];
			const indices = [ 0, 1, 2,   0, 2, 3,   4, 6, 5,   4, 7, 6 ];
			const shape = new Geometry ( {
				points: new Float32Array ( points ),
				primitives: new Indexed ( { topology: "triangle-list", indices: new Uint16Array ( indices ) } ),
			} );

			// The back faces are green and the front faces are red.
			const makeState = ( color: IVector4 ) : State =>
			{
				const state = FlatShading.makeState ( { topology: "triangle-list" } );
				state.addAttribute ( new ColorAttribute ( color ) );
				return state;
			};
			const back = makeState ( [ 0, 1, 0, 0.5 ] );
			const front = makeState ( [ 1, 0, 0, 0.5 ] );
			const transparent = buildTransparentScene ( { geometry: shape, back, front } );

			// Put the front faces' group first, so only the bins can put it last.
			const scene = new Group();
			scene.addChild ( transparent.getChild ( 1 ) );
			scene.addChild ( transparent.getChild ( 0 ) );

			// Red over green over the background, which is [ 0.505, 0.26, 0.265 ]
			// with the ambient light. The other order would be green over red,
			// which is [ 0.26, 0.505, 0.265 ].
			const pixels = await drawScene ( scene );
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ toPixel ( 0.505 ), toPixel ( 0.26 ), toPixel ( 0.265 ), 255 ] );

			// Outside the shape is the background.
			expectPixel ( pixelAt ( pixels, -0.95, 0.95 ), [ 0, 0, 255, 255 ] );
		} );

		it ( "Should blend in linear values", async function ()
		{
			// Half-transparent white over the blue background is half white,
			// in linear values, which is 188 of 255, not 128.
			const scene = new Group();
			scene.addChild ( makeSquare ( [ 0, 0, 0.5 ], true, makeTransparentState ( [ 1, 1, 1, 0.5 ], false ) ) );
			const pixels = await drawScene ( scene );
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ toPixel ( 0.5 ), toPixel ( 0.5 ), 255, 255 ] );
		} );

		it ( "Should clear to the clear color as it's given, because it's sRGB", async function ()
		{
			const texture = makeTexture ( SIZE );
			const dv = new DrawVisitor ( { texture } );
			dv.clearColor = [ 0.2, 0.4, 0.6, 1 ];
			dv.draw ( new Root(), 1 );
			const pixels = await readPixels ( texture );
			texture.destroy();
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ 51, 102, 153, 255 ] );
		} );

		it ( "Should clear the background when there is nothing to draw", async function ()
		{
			const pixels = await drawScene ( new Group() );
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ 0, 0, 255, 255 ] );
			expectPixel ( pixelAt ( pixels, -0.95, 0.95 ), [ 0, 0, 255, 255 ] );
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
			expectPixel ( pixelAt ( pixels, -0.5, 0 ), [ 255, A, A, 255 ] );
			expectPixel ( pixelAt ( pixels, 0.5, 0 ), [ 255, A, A, 255 ] );

			// Between them, and where the square was before it moved, is the background.
			expectPixel ( pixelAt ( pixels, 0, 0 ), [ 0, 0, 255, 255 ] );
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

		it ( "Should draw the same after the device is lost and made again", async function ()
		{
			const before = await drawScene ( buildResetScene() );
			const scene = buildResetScene();
			const first = await drawScene ( scene );
			expect ( Array.from ( first.data ) ).to.deep.equal ( Array.from ( before.data ) );

			// The same scene, so its arrays have buffers from the old device.
			await loseDevice();
			await Device.recover();
			const after = await drawScene ( scene );
			expect ( Array.from ( after.data ) ).to.deep.equal ( Array.from ( before.data ) );
			expectPixel ( pixelAt ( after, -0.5, 0 ), [ 255, A, A, 255 ] );
		} );

		it ( "Should draw the same after the shader releases its GPU objects", async function ()
		{
			const before = await drawScene ( buildResetScene() );
			FlatShading.instance.releaseGpuObjects();
			const after = await drawScene ( buildResetScene() );
			expect ( Array.from ( after.data ) ).to.deep.equal ( Array.from ( before.data ) );
			expectPixel ( pixelAt ( after, -0.5, 0 ), [ 255, A, A, 255 ] );
		} );
	} );
};
