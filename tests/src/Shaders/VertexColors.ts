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
import { makePipelineKey } from "../../../lib/src/Shaders/ShaderBase";
import { PhongEdges } from "../../../lib/src/Shaders/PhongEdges";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import type { IVector4 } from "../../../lib/src/Types";
import {
	ColorAttribute,
	Geometry,
	Group,
	Material,
	State,
} from "../../../lib/src/Scene";
import {
	cull,
	drawScene,
	expectPixel,
	makeColorState,
	makeSquare,
	pixelAt,
	type IShaderClass,
} from "../Helpers/Squares";
import { toPixel } from "../Helpers/Pixels";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

const BLUE: IVector4 = [ 0, 0, 1, 1 ];
const RED: IVector4 = [ 1, 0, 0, 1 ];
const GREEN: IVector4 = [ 0, 1, 0, 1 ];

// The material's diffuse color and the vertices' color, and as pixels, the
// material's color alone and times the vertex color.
const MATERIAL: IVector4 = [ 0.5, 1, 1, 1 ];
const VERTEX: IVector4 = [ 1, 0.5, 0, 1 ];
const MATERIAL_PIXEL = [ toPixel ( 0.5 ), 255, 255, 255 ];
const BOTH_PIXEL = [ toPixel ( 0.5 ), toPixel ( 0.5 ), 0, 255 ];
const BLACK: IVector4 = [ 0, 0, 0, 1 ];
const WHITE: IVector4 = [ 1, 1, 1, 1 ];

/**
 * Make a state with the shader and a material with the diffuse color and no
 * ambient color, so that the lit colors are only the diffuse color.
 * @param {IShaderClass} shader - The shader class.
 * @param {IVector4} diffuse - The diffuse color.
 * @returns {State} The state.
 */
const makeMaterialState = ( shader: IShaderClass, diffuse: IVector4 ) : State =>
{
	const state = shader.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new Material ( { diffuse, ambient: BLACK } ) );
	return state;
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
			const state = makeColorState ( FlatShading, MATERIAL );
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
			const state = makeColorState ( FlatShading, MATERIAL );
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

		it ( "Should multiply the material's color by the vertex colors, with each shader", async function ()
		{
			for ( const shader of [ FlatShading, PhongShading, SolidColor, FlatEdges, PhongEdges ] )
			{
				const state = makeMaterialState ( shader, MATERIAL );
				const scene = new Group();
				scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], state, [ VERTEX, VERTEX, VERTEX, VERTEX ] ) );
				scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], state, null ) );
				const pixels = await drawScene ( scene );

				// Away from the triangle edges, which the edge shaders draw.
				expectPixel ( pixelAt ( pixels, -0.3, -0.2 ), BOTH_PIXEL );
				expectPixel ( pixelAt ( pixels, 0.7, -0.2 ), MATERIAL_PIXEL );
			}
		} );

		it ( "Should multiply the ambient color by the vertex colors too", async function ()
		{
			// Only the ambient light, which is 0.1, on a white ambient color,
			// and a white vertex color on the left and red on the right.
			const state = FlatShading.makeState ( { topology: "triangle-list" } );
			state.addAttribute ( new Material ( { ambient: WHITE, diffuse: BLACK } ) );
			const scene = new Group();
			scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], state, [ WHITE, WHITE, WHITE, WHITE ] ) );
			scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], state, [ RED, RED, RED, RED ] ) );
			const pixels = await drawScene ( scene );

			// The diffuse alpha is black's, which is 1.
			expectPixel ( pixelAt ( pixels, -0.5, 0 ), [ toPixel ( 0.1 ), toPixel ( 0.1 ), toPixel ( 0.1 ), 255 ] );
			expectPixel ( pixelAt ( pixels, 0.5, 0 ), [ toPixel ( 0.1 ), 0, 0, 255 ] );
		} );

		it ( "Should blend the vertex colors across the triangles", async function ()
		{
			// Red on the left and green on the right.
			const state = makeMaterialState ( FlatShading, WHITE );
			const scene = new Group();
			scene.addChild ( makeSquare ( [ 0, 0, 0 ], state, [ RED, GREEN, GREEN, RED ] ) );
			const pixels = await drawScene ( scene );

			const left = pixelAt ( pixels, -0.35, 0 );
			const middle = pixelAt ( pixels, 0, 0 );
			const right = pixelAt ( pixels, 0.35, 0 );
			// Near the sides it's mostly one color, and in the middle it's half
			// of each, in linear values.
			expect ( left[0] ).to.be.above ( toPixel ( 0.8 ) );
			expect ( left[1] ).to.be.below ( toPixel ( 0.2 ) );
			expect ( right[0] ).to.be.below ( toPixel ( 0.2 ) );
			expect ( right[1] ).to.be.above ( toPixel ( 0.8 ) );
			expect ( middle[0] ).to.be.closeTo ( toPixel ( 0.5 ), 10 );
			expect ( middle[1] ).to.be.closeTo ( toPixel ( 0.5 ), 10 );
		} );

		it ( "Should make each bounding box the color of its node", function ()
		{
			// A shape with a color, a shape with a material, which wins over its
			// color, and a group with a color, around a group without a state.
			const scene = new Group();
			scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], makeColorState ( FlatShading, RED ), null ) );
			const both = makeColorState ( PhongShading, RED );
			both.addAttribute ( new Material ( { diffuse: [ 0, 1, 0, 0.5 ] } ) );
			scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], both, null ) );
			const outer = new Group();
			outer.state = makeColorState ( SolidColor, BLUE );
			outer.addChild ( scene );
			const boxes = buildBoundingBoxes ( outer );
			expect ( boxes.hasVertexColors ).to.be.true;

			// Each box has eight corners: the two squares, then the inner group,
			// which has no state and is gray, and then the outer group. The
			// lines are opaque.
			const colors = Array.from ( boxes.colors!.values! );
			expect ( colors.length ).to.equal ( 4 * 8 * 4 );
			expect ( colors.slice ( 0, 4 ) ).to.deep.equal ( [ 1, 0, 0, 1 ] );
			expect ( colors.slice ( 32, 36 ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
			expect ( colors.slice ( 64, 68 ) ).to.deep.equal ( [ 0.5, 0.5, 0.5, 1 ] );
			expect ( colors.slice ( 96, 100 ) ).to.deep.equal ( [ 0, 0, 1, 1 ] );

			// The state is white, so the vertex colors are drawn as they are.
			const color = boxes.state!.getAttribute ( ColorAttribute.getClassName() ) as ColorAttribute;
			expect ( [ ...color.color ] ).to.deep.equal ( [ 1, 1, 1, 1 ] );
		} );

		it ( "Should give all the shapes' or groups' bounding boxes the given colors", function ()
		{
			const inner = new Group();
			inner.state = makeColorState ( SolidColor, BLUE );
			inner.addChild ( makeSquare ( [ -0.5, 0, 0 ], makeColorState ( FlatShading, RED ), null ) );
			const scene = new Group();
			scene.addChild ( inner );

			const shapes = Array.from ( buildBoundingBoxes ( scene, { shapeColor: GREEN } ).colors!.values! );
			expect ( shapes.slice ( 0, 4 ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
			expect ( shapes.slice ( 32, 36 ) ).to.deep.equal ( [ 0, 0, 1, 1 ] );
			expect ( shapes.slice ( 64, 68 ) ).to.deep.equal ( [ 0.5, 0.5, 0.5, 1 ] );

			const groups = Array.from ( buildBoundingBoxes ( scene, { groupColor: GREEN } ).colors!.values! );
			expect ( groups.slice ( 0, 4 ) ).to.deep.equal ( [ 1, 0, 0, 1 ] );
			expect ( groups.slice ( 32, 36 ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
			expect ( groups.slice ( 64, 68 ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
		} );
	} );
};
