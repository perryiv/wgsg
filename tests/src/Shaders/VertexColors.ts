///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test drawing with vertex colors.
//
///////////////////////////////////////////////////////////////////////////////

import { buildBoundingBoxes } from "../../../lib/src/Builders/Box";
import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatEdges } from "../../../lib/src/Shaders/FlatEdges";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { getPixel, makeTexture, readPixels, type IPixels } from "../Helpers/Pixels";
import { makePipelineKey } from "../../../lib/src/Shaders/ShaderBase";
import { makeRenderGraphInfo, Root } from "../../../lib/src/Render";
import { PhongEdges } from "../../../lib/src/Shaders/PhongEdges";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
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
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

const SIZE = 32;
const BLUE: IVector4 = [ 0, 0, 1, 1 ];
const RED: IVector4 = [ 1, 0, 0, 1 ];
const GREEN: IVector4 = [ 0, 1, 0, 1 ];

// The state's color and the vertices' color, as pixels.
const MATERIAL: IVector4 = [ 0.5, 1, 1, 1 ];
const VERTEX: IVector4 = [ 1, 0.5, 0, 1 ];
const MATERIAL_PIXEL = [ 128, 255, 255, 255 ];
const VERTEX_PIXEL = [ 255, 128, 0, 255 ];

/**
 * Make a square in front of the camera, facing it.
 * @param {IVector3} center - The center.
 * @param {State} state - The state.
 * @param {IVector4[] | null} colors - The color of each corner, if any, in
 * the order lower left, lower right, upper right, and upper left.
 * @returns {Geometry} The square.
 */
const makeSquare = ( center: IVector3, state: State, colors: ( IVector4[] | null ) ) : Geometry =>
{
	const h = 0.4;
	const [ x, y, z ] = center;
	const points = [ x - h, y - h, z,   x + h, y - h, z,   x + h, y + h, z,   x - h, y + h, z ];
	const square = new Geometry ( {
		points: new Float32Array ( points ),
		normals: new Float32Array ( [ 0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1 ] ),
		colors: ( colors ? new Float32Array ( colors.flat() ) : null ),
		primitives: new Indexed ( { topology: "triangle-list", indices: new Uint16Array ( [ 0, 1, 2,   0, 2, 3 ] ) } ),
	} );
	square.state = state;
	return square;
};

/**
 * Make a state with the shader and color.
 * @param {object} shader - The shader class.
 * @param {Function} shader.makeState - Makes the state.
 * @param {IVector4} color - The color.
 * @returns {State} The state.
 */
const makeState = ( shader: { makeState: ( input: { topology: GPUPrimitiveTopology } ) => State }, color: IVector4 ) : State =>
{
	const state = shader.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new ColorAttribute ( color ) );
	return state;
};

/**
 * Cull the scene.
 * @param {Group} scene - The scene.
 * @returns {object} The render graph and its info.
 */
const cull = ( scene: Group ) : { root: Root, info: IRenderGraphInfo } =>
{
	const root = new Root();
	const cv = new CullVisitor ( { root } );
	const info = makeRenderGraphInfo();
	cv.renderGraphInfo = info;
	cv.reset();
	scene.accept ( cv );
	return { root, info };
};

/**
 * Cull and draw the scene into a texture, and read the pixels.
 * @param {Group} scene - The scene.
 * @returns {Promise<IPixels>} The pixels.
 */
const drawScene = async ( scene: Group ) : Promise < IPixels > =>
{
	const { root } = cull ( scene );
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


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Vertex colors", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should only have vertex colors with a color for each point", function ()
		{
			const state = makeState ( FlatShading, MATERIAL );
			expect ( makeSquare ( [ 0, 0, 0 ], state, null ).hasVertexColors ).to.be.false;
			expect ( makeSquare ( [ 0, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX, VERTEX ] ).hasVertexColors ).to.be.true;
			expect ( makeSquare ( [ 0, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX ] ).hasVertexColors ).to.be.false;
			expect ( new Geometry ( { colors: new Float32Array ( 4 ) } ).hasVertexColors ).to.be.false;
		} );

		it ( "Should tell pipelines with and without vertex colors apart", function ()
		{
			const options = { topology: "triangle-list", cullMode: "none", depthWrite: true } as const;
			const without = makePipelineKey ( options );
			expect ( makePipelineKey ( { ...options, vertexColors: false } ) ).to.equal ( without );
			expect ( makePipelineKey ( { ...options, vertexColors: true } ) ).not.to.equal ( without );
		} );

		it ( "Should put shapes with and without vertex colors in different pipelines", function ()
		{
			const state = makeState ( FlatShading, MATERIAL );
			const scene = new Group();
			scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], state, null ) );
			scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX, VERTEX ] ) );
			expect ( cull ( scene ).info.numPipelines ).to.equal ( 2 );

			// Too few colors are ignored.
			const fewer = new Group();
			fewer.addChild ( makeSquare ( [ -0.5, 0, 0 ], state, null ) );
			fewer.addChild ( makeSquare ( [ 0.5, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX ] ) );
			expect ( cull ( fewer ).info.numPipelines ).to.equal ( 1 );
		} );

		it ( "Should use the vertex colors instead of the state's color, with each shader", async function ()
		{
			for ( const shader of [ FlatShading, PhongShading, SolidColor, FlatEdges, PhongEdges ] )
			{
				const state = makeState ( shader, MATERIAL );
				const scene = new Group();
				scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX, VERTEX ] ) );
				scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], state, null ) );
				const pixels = await drawScene ( scene );

				// Away from the triangle edges, which the edge shaders draw.
				expectPixel ( pixelAt ( pixels, -0.3, -0.2 ), VERTEX_PIXEL );
				expectPixel ( pixelAt ( pixels, 0.7, -0.2 ), MATERIAL_PIXEL );
			}
		} );

		it ( "Should blend the vertex colors across the triangles", async function ()
		{
			// Red on the left and green on the right.
			const state = makeState ( FlatShading, MATERIAL );
			const scene = new Group();
			scene.addChild ( makeSquare ( [ 0, 0, 0 ], state, [ RED, GREEN, GREEN, RED ] ) );
			const pixels = await drawScene ( scene );

			const left = pixelAt ( pixels, -0.35, 0 );
			const middle = pixelAt ( pixels, 0, 0 );
			const right = pixelAt ( pixels, 0.35, 0 );
			expect ( left[0] ).to.be.above ( 200 );
			expect ( left[1] ).to.be.below ( 55 );
			expect ( right[0] ).to.be.below ( 55 );
			expect ( right[1] ).to.be.above ( 200 );
			expect ( middle[0] ).to.be.closeTo ( 128, 20 );
			expect ( middle[1] ).to.be.closeTo ( 128, 20 );
		} );

		it ( "Should make each bounding box the color of its shape", function ()
		{
			const scene = new Group();
			scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], makeState ( FlatShading, RED ), null ) );
			scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], makeState ( PhongShading, [ 0, 1, 0, 0.5 ] ), null ) );
			const boxes = buildBoundingBoxes ( scene );
			expect ( boxes.hasVertexColors ).to.be.true;

			// Each box has eight corners: the two squares, and then the group,
			// which has no state.
			const colors = Array.from ( boxes.colors!.values! );
			expect ( colors.length ).to.equal ( 3 * 8 * 4 );
			expect ( colors.slice ( 0, 4 ) ).to.deep.equal ( [ 1, 0, 0, 1 ] );
			expect ( colors.slice ( 32, 36 ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
			expect ( colors.slice ( 64, 68 ) ).to.deep.equal ( [ 0.5, 0.5, 0.5, 1 ] );
		} );
	} );
};
