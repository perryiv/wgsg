///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the mipmaps of textures.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { loseDevice } from "../Helpers/DeviceLoss";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import { Texture, type IRawImage, type ITextureInput } from "../../../lib/src/Textures/Texture";
import { drawScene, makeSquare, pixelAt } from "../Helpers/Squares";
import { Group, Material, TextureSet } from "../../../lib/src/Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Make a checker of black and white pixels.
 * @param {number} size - The width and height.
 * @returns {IRawImage} The image.
 */
const makeChecker = ( size: number ) : IRawImage =>
{
	const data = new Uint8Array ( size * size * 4 );
	for ( let y = 0; y < size; ++y )
	{
		for ( let x = 0; x < size; ++x )
		{
			const value = ( ( ( x + y ) % 2 ) ? 255 : 0 );
			data.set ( [ value, value, value, 255 ], ( ( ( y * size ) + x ) * 4 ) );
		}
	}
	return { width: size, height: size, data };
};

/**
 * Read the first pixel of a level of the texture.
 * @param {Texture} texture - The texture.
 * @param {number} level - The level.
 * @returns {Promise<number[]>} The pixel, as it's stored: red, green, blue, alpha.
 */
const readLevel = async ( texture: Texture, level: number ) : Promise < number[] > =>
{
	const { device } = Device.instance;
	const buffer = device.createBuffer ( { size: 256, usage: ( GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ ) } );
	const encoder = device.createCommandEncoder();
	encoder.copyTextureToBuffer ( { texture: texture.gpuTexture, mipLevel: level }, { buffer, bytesPerRow: 256 }, [ 1, 1 ] );
	device.queue.submit ( [ encoder.finish() ] );
	await buffer.mapAsync ( GPUMapMode.READ );
	const pixel = Array.from ( new Uint8Array ( buffer.getMappedRange(), 0, 4 ) );
	buffer.unmap();
	buffer.destroy();
	return pixel;
};

/**
 * Draw a small square with a checker repeated many times, so that each
 * pixel covers many texture pixels, and return its center pixel.
 * @param {ITextureInput} input - The texture.
 * @returns {Promise<number[]>} The pixel.
 */
const drawFar = async ( input: ITextureInput ) : Promise < number[] > =>
{
	const state = SolidColor.makeState ( { topology: "triangle-list" } );
	state.addAttribute ( new Material ( { diffuse: [ 1, 1, 1, 1 ] } ) );
	state.addAttribute ( new TextureSet ( { diffuse: new Texture ( input ) } ) );
	const n = 64;
	const scene = new Group();
	scene.addChild ( makeSquare ( [ 0, 0, 0 ], state, null, [ 0, 0, 1 ], [ 0, n,   n, n,   n, 0,   0, 0 ] ) );
	return pixelAt ( await drawScene ( scene ), 0.03, 0.03 );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Mipmaps", function ()
	{
		this.beforeAll ( async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}
		} );

		it ( "Should have a level for each halving of the larger side, down to one pixel", function ()
		{
			const cases: [ number, number, number ][] = [ [ 1, 1, 1 ], [ 2, 2, 2 ], [ 8, 4, 4 ], [ 5, 3, 3 ], [ 1, 16, 5 ] ];
			for ( const [ width, height, levels ] of cases )
			{
				const texture = new Texture ( { image: { width, height, data: new Uint8Array ( width * height * 4 ) } } );
				expect ( texture.numLevels, `${width} by ${height}` ).to.equal ( levels );
				expect ( texture.gpuTexture.mipLevelCount ).to.equal ( levels );
				texture.releaseGpuObjects();
			}

			// Without mipmaps there is one.
			const one = new Texture ( { image: makeChecker ( 8 ), mipmaps: false } );
			expect ( one.numLevels ).to.equal ( 1 );
			expect ( one.gpuTexture.mipLevelCount ).to.equal ( 1 );

			// Turning them on makes the texture again.
			const view = one.view;
			one.mipmaps = true;
			expect ( one.view ).to.not.equal ( view );
			expect ( one.gpuTexture.mipLevelCount ).to.equal ( 4 );
			one.releaseGpuObjects();
		} );

		it ( "Should average the pixels of each level in linear values", async function ()
		{
			// Half black and half white is linear 0.5, which is 188 in sRGB.
			const texture = new Texture ( { image: makeChecker ( 4 ) } );
			for ( const level of [ 1, 2 ] )
			{
				const [ r, g, b, a ] = await readLevel ( texture, level );
				expect ( r, `level ${level}` ).to.be.closeTo ( 188, 2 );
				expect ( g ).to.be.closeTo ( 188, 2 );
				expect ( b ).to.be.closeTo ( 188, 2 );
				expect ( a ).to.equal ( 255 );
			}
			texture.releaseGpuObjects();
		} );

		it ( "Should average a data texture's pixels as they are", async function ()
		{
			const texture = new Texture ( { image: makeChecker ( 4 ), srgb: false } );
			const [ r ] = await readLevel ( texture, 1 );
			expect ( r ).to.be.closeTo ( 128, 1 );
			texture.releaseGpuObjects();
		} );

		it ( "Should make the mipmaps again after the device is lost", async function ()
		{
			const texture = new Texture ( { image: makeChecker ( 4 ) } );
			void texture.view;
			await loseDevice();
			await Device.recover();
			const [ r ] = await readLevel ( texture, 1 );
			expect ( r ).to.be.closeTo ( 188, 2 );
			texture.releaseGpuObjects();
		} );

		it ( "Should draw a texture far away as its average color, not black or white", async function ()
		{
			// Nearest filtering within a level, so that the only difference is
			// the mipmaps. With them, each pixel comes from a small level, whose
			// pixels are the checker's average, linear 0.5, which is 188.
			const smooth = await drawFar ( { image: makeChecker ( 64 ), minFilter: "nearest" } );
			expect ( smooth[0] ).to.be.closeTo ( 188, 6 );

			// Without them, each pixel is one pixel of the checker, black or white.
			const rough = await drawFar ( { image: makeChecker ( 64 ), minFilter: "nearest", mipmaps: false } );
			expect ( [ 0, 255 ] ).to.include ( rough[0] );
		} );
	} );
};
