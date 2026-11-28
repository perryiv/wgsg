///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test how materials are lit. The light is a headlight, along -z.
//
///////////////////////////////////////////////////////////////////////////////

import { DEFAULT_AMBIENT_LIGHT } from "../../../lib/src/Tools/Constants";
import { Device } from "../../../lib/src/Tools/Device";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { PhongEdges } from "../../../lib/src/Shaders/PhongEdges";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import type { IMaterialInput } from "../../../lib/src/Scene/State/Attributes/Material";
import type { IVector3, IVector4 } from "../../../lib/src/Types";
import {
	Group,
	Material,
	TwoSidedLight,
} from "../../../lib/src/Scene";
import {
	drawScene,
	expectPixel,
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

const BLACK: IVector4 = [ 0, 0, 0, 1 ];
const WHITE: IVector4 = [ 1, 1, 1, 1 ];

// Normals towards the camera, away from it, and halfway between towards it
// and to the right.
const TOWARDS: IVector3 = [ 0, 0, 1 ];
const AWAY: IVector3 = [ 0, 0, -1 ];
const TILTED: IVector3 = [ Math.SQRT1_2, 0, Math.SQRT1_2 ];

// As pixels: the ambient light (0.1) on white, half, the light on a surface
// at 45 degrees (0.707), and a highlight with a shininess of 10 there
// (0.707 ^ 10). The colors are linear, and the pixels are sRGB.
const A = toPixel ( 0.1 );
const H = toPixel ( 0.5 );
const T = toPixel ( Math.SQRT1_2 );
const S = toPixel ( Math.pow ( Math.SQRT1_2, 10 ) );

/**
 * Draw one square with the shader and material, and return its center pixel.
 * The material's colors are black unless given.
 * @param {IShaderClass} shader - The shader class.
 * @param {IMaterialInput} values - The material's values.
 * @param {IVector3} [normal] - The normal of the square's corners.
 * @param {boolean} [twoSided] - Whether to light both sides.
 * @returns {Promise<number[]>} The pixel.
 */
const drawMaterial = async ( shader: IShaderClass, values: IMaterialInput, normal: IVector3 = TOWARDS, twoSided = false ) : Promise < number[] > =>
{
	const state = shader.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new Material ( { ambient: BLACK, diffuse: BLACK, ...values } ) );
	if ( twoSided )
	{
		state.addAttribute ( new TwoSidedLight ( true ) );
	}
	const scene = new Group();
	scene.addChild ( makeSquare ( [ 0, 0, 0 ], state, null, normal ) );

	// Away from the triangle edges, which the edge shaders draw.
	return pixelAt ( await drawScene ( scene ), 0.2, -0.1 );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Materials", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should light the diffuse color by the angle to the light", async function ()
		{
			for ( const shader of [ PhongShading, PhongEdges ] )
			{
				expectPixel ( await drawMaterial ( shader, { diffuse: [ 1, 0.5, 0, 1 ] } ), [ 255, toPixel ( 0.5 ), 0, 255 ] );
				expectPixel ( await drawMaterial ( shader, { diffuse: WHITE }, TILTED ), [ T, T, T, 255 ] );
				expectPixel ( await drawMaterial ( shader, { diffuse: WHITE }, AWAY ), [ 0, 0, 0, 255 ] );
			}
		} );

		it ( "Should light the back like the front with two-sided lighting", async function ()
		{
			for ( const shader of [ PhongShading, PhongEdges ] )
			{
				expectPixel ( await drawMaterial ( shader, { diffuse: [ 1, 0, 0, 1 ] }, AWAY, true ), [ 255, 0, 0, 255 ] );
			}
		} );

		it ( "Should show the emission without light", async function ()
		{
			for ( const shader of [ PhongShading, PhongEdges ] )
			{
				expectPixel ( await drawMaterial ( shader, { emission: [ 0, 0.5, 0, 1 ] }, AWAY ), [ 0, toPixel ( 0.5 ), 0, 255 ] );
			}
		} );

		it ( "Should light the ambient color with the ambient light", async function ()
		{
			// The default ambient light is 0.1.
			expectPixel ( await drawMaterial ( PhongShading, { ambient: WHITE }, AWAY ), [ A, A, A, 255 ] );
			expectPixel ( await drawMaterial ( PhongShading, { ambient: [ 1, 0, 0, 1 ] }, AWAY ), [ A, 0, 0, 255 ] );

			// A brighter one.
			const shader = PhongShading.instance;
			shader.ambientLight = [ 0.5, 0.5, 0.5, 1 ];
			try
			{
				expectPixel ( await drawMaterial ( PhongShading, { ambient: WHITE }, AWAY ), [ H, H, H, 255 ] );
			}
			finally
			{
				shader.ambientLight = DEFAULT_AMBIENT_LIGHT;
			}
		} );

		it ( "Should make a highlight that gets smaller with the shininess", async function ()
		{
			for ( const shader of [ PhongShading, PhongEdges ] )
			{
				// Towards the light and the viewer, the highlight is the whole color.
				expectPixel ( await drawMaterial ( shader, { specular: WHITE, shininess: 50 } ), [ 255, 255, 255, 255 ] );

				// At 45 degrees, N.H is 0.707. With a shininess of 0, the lit side is
				// the specular color, and with 10, it's 0.707 ^ 10, which is 0.031.
				expectPixel ( await drawMaterial ( shader, { specular: WHITE, shininess: 0 }, TILTED ), [ 255, 255, 255, 255 ] );
				expectPixel ( await drawMaterial ( shader, { specular: WHITE, shininess: 10 }, TILTED ), [ S, S, S, 255 ] );

				// None on the side away from the light.
				expectPixel ( await drawMaterial ( shader, { specular: WHITE }, AWAY ), [ 0, 0, 0, 255 ] );
			}
		} );

		it ( "Should add the colors together and keep them in range", async function ()
		{
			const values = { diffuse: [ 0.6, 0.6, 0, 1 ] as IVector4, emission: [ 0.6, 0, 0, 1 ] as IVector4 };
			expectPixel ( await drawMaterial ( PhongShading, values ), [ 255, toPixel ( 0.6 ), 0, 255 ] );
		} );

		it ( "Should light flat shading the same way", async function ()
		{
			// Flat shading ignores the normals, and the square faces the camera.
			expectPixel ( await drawMaterial ( FlatShading, { diffuse: [ 1, 0.5, 0, 1 ] } ), [ 255, toPixel ( 0.5 ), 0, 255 ] );
			expectPixel ( await drawMaterial ( FlatShading, { emission: [ 0, 0.5, 0, 1 ], ambient: WHITE } ), [ A, toPixel ( 0.6 ), A, 255 ] );
		} );

		it ( "Should draw the diffuse color without lighting with the solid color shader", async function ()
		{
			const values = { diffuse: [ 1, 0.5, 0, 1 ] as IVector4, ambient: WHITE, emission: WHITE, specular: WHITE };
			expectPixel ( await drawMaterial ( SolidColor, values, AWAY ), [ 255, toPixel ( 0.5 ), 0, 255 ] );
		} );
	} );
};
