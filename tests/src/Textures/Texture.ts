///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the texture class and the texture set attribute.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { getWhiteTexture } from "../../../lib/src/Textures/Defaults";
import { Group } from "../../../lib/src/Scene/Nodes";
import { IDENTITY_MATRIX } from "../../../lib/src/Math/Constants";
import { loseDevice } from "../Helpers/DeviceLoss";
import { State, TextureSet } from "../../../lib/src/Scene/State";
import { Texture, type IRawImage } from "../../../lib/src/Textures/Texture";
import type { IMatrix44 } from "../../../lib/src/Types";
import { cull, makeSquare } from "../Helpers/Squares";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Make raw pixels of one color.
 * @param {number} width - The width.
 * @param {number} height - The height.
 * @param {number[]} rgba - The color, from 0 to 255.
 * @returns {IRawImage} The image.
 */
const makeImage = ( width: number, height: number, rgba = [ 255, 0, 0, 255 ] ) : IRawImage =>
{
	const data = new Uint8Array ( width * height * 4 );
	for ( let i = 0; i < data.length; i += 4 )
	{
		data.set ( rgba, i );
	}
	return { width, height, data };
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Texture", function ()
	{
		this.beforeAll ( async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}
		} );

		it ( "Should be an sRGB color texture with repeat and linear filtering by default", function ()
		{
			const texture = new Texture ( { image: makeImage ( 2, 3 ) } );
			expect ( texture.width ).to.equal ( 2 );
			expect ( texture.height ).to.equal ( 3 );
			expect ( texture.srgb ).to.be.true;
			expect ( texture.format ).to.equal ( "rgba8unorm-srgb" );
			expect ( texture.samplerSettings ).to.deep.equal ( { wrapU: "repeat", wrapV: "repeat", magFilter: "linear", minFilter: "linear" } );
		} );

		it ( "Should use the settings it's given", function ()
		{
			const texture = new Texture ( { image: makeImage ( 1, 1 ), srgb: false, wrapU: "clamp-to-edge", minFilter: "nearest" } );
			expect ( texture.format ).to.equal ( "rgba8unorm" );
			expect ( texture.samplerSettings ).to.deep.equal ( { wrapU: "clamp-to-edge", wrapV: "repeat", magFilter: "linear", minFilter: "nearest" } );

			// Changing some settings keeps the rest.
			texture.samplerSettings = { wrapV: "mirror-repeat" };
			expect ( texture.samplerSettings ).to.deep.equal ( { wrapU: "clamp-to-edge", wrapV: "mirror-repeat", magFilter: "linear", minFilter: "nearest" } );
		} );

		it ( "Should reject images that can't be used", function ()
		{
			expect ( () => new Texture ( { image: makeImage ( 0, 1 ) } ) ).to.throw ( "Texture image is 0 by 1 pixels" );
			expect ( () => new Texture ( { image: { width: 2, height: 2, data: new Uint8Array ( 15 ) } } ) ).to.throw ( "has 15 bytes instead of 16" );

			const max = Device.instance.device.limits.maxTextureDimension2D;
			const tooWide = new Texture ( { image: { width: ( max + 1 ), height: 1, data: new Uint8Array ( ( max + 1 ) * 4 ) } } );
			expect ( () => tooWide.view ).to.throw ( `larger than this GPU's limit of ${max}` );
		} );

		it ( "Should make its GPU texture when needed, and again when the image or format changes", function ()
		{
			const texture = new Texture ( { image: makeImage ( 4, 4 ) } );
			const before = Texture.totalBytes;
			const view = texture.view;
			expect ( texture.view ).to.equal ( view );
			expect ( Texture.totalBytes ).to.equal ( before + 64 );

			texture.image = makeImage ( 2, 2 );
			expect ( Texture.totalBytes ).to.equal ( before );
			const second = texture.view;
			expect ( second ).to.not.equal ( view );
			expect ( Texture.totalBytes ).to.equal ( before + 16 );

			// Setting the same format again keeps it, and a new one makes it again.
			texture.srgb = true;
			expect ( texture.view ).to.equal ( second );
			texture.srgb = false;
			expect ( texture.view ).to.not.equal ( second );

			texture.releaseGpuObjects();
			expect ( Texture.totalBytes ).to.equal ( before );
		} );

		it ( "Should release its GPU texture when nothing uses it, and keep its image", function ()
		{
			const texture = new Texture ( { image: makeImage ( 4, 4 ) } );
			texture.ref();
			const view = texture.view;
			const before = Texture.totalBytes;
			texture.unref();
			expect ( Texture.totalBytes ).to.equal ( before - 64 );
			expect ( texture.width ).to.equal ( 4 );

			// Used again, it makes a new one.
			texture.ref();
			expect ( texture.view ).to.not.equal ( view );
			texture.unref();
		} );

		it ( "Should make its GPU texture again after the device is lost", async function ()
		{
			const texture = new Texture ( { image: makeImage ( 1, 1 ) } );
			const view = texture.view;
			const sampler = texture.sampler;
			await loseDevice();
			await Device.recover();
			expect ( texture.view ).to.not.equal ( view );
			expect ( texture.sampler ).to.not.equal ( sampler );
			texture.releaseGpuObjects();
		} );

		it ( "Should share the samplers of textures with the same settings", function ()
		{
			const a = new Texture ( { image: makeImage ( 1, 1 ) } );
			const b = new Texture ( { image: makeImage ( 1, 1 ) } );
			const c = new Texture ( { image: makeImage ( 1, 1 ), wrapU: "clamp-to-edge" } );
			expect ( a.sampler ).to.equal ( b.sampler );
			expect ( a.sampler ).to.not.equal ( c.sampler );
		} );

		it ( "Should have a white texture with nearest filtering for when there is none", function ()
		{
			const white = getWhiteTexture();
			expect ( getWhiteTexture() ).to.equal ( white );
			expect ( Array.from ( ( white.image as IRawImage ).data ) ).to.deep.equal ( [ 255, 255, 255, 255 ] );
			expect ( white.samplerSettings.magFilter ).to.equal ( "nearest" );
			expect ( white.samplerSettings.minFilter ).to.equal ( "nearest" );
		} );
	} );

	describe ( "TextureSet", function ()
	{
		it ( "Should count its textures only while it's used", function ()
		{
			const a = new Texture ( { image: makeImage ( 1, 1 ) } );
			const b = new Texture ( { image: makeImage ( 1, 1 ) } );
			const set = new TextureSet ( { diffuse: a } );
			expect ( a.refCount ).to.equal ( 0 );

			set.ref();
			expect ( a.refCount ).to.equal ( 1 );

			// A new texture is counted instead of the old one.
			set.diffuse = b;
			expect ( a.refCount ).to.equal ( 0 );
			expect ( b.refCount ).to.equal ( 1 );

			set.diffuse = null;
			expect ( b.refCount ).to.equal ( 0 );
			set.unref();
		} );

		it ( "Should release the GPU texture when no shape uses it", function ()
		{
			const texture = new Texture ( { image: makeImage ( 4, 4 ) } );
			const state = FlatShading.makeState ( { topology: "triangle-list" } );
			state.addAttribute ( new TextureSet ( { diffuse: texture } ) );
			const root = new Group();
			root.ref();
			root.addChild ( makeSquare ( [ 0, 0, 0 ], state ) );
			void texture.view;
			const before = Texture.totalBytes;
			expect ( texture.refCount ).to.equal ( 1 );

			root.removeChild ( 0 );
			expect ( texture.refCount ).to.equal ( 0 );
			expect ( Texture.totalBytes ).to.equal ( before - 64 );
		} );

		it ( "Should tell states with different textures apart", function ()
		{
			const a = new Texture ( { image: makeImage ( 1, 1 ) } );
			const b = new Texture ( { image: makeImage ( 1, 1 ) } );
			const makeState = ( texture: Texture ) : State =>
			{
				const state = FlatShading.makeState ( { topology: "triangle-list" } );
				state.addAttribute ( new TextureSet ( { diffuse: texture } ) );
				return state;
			};
			expect ( new TextureSet ( { diffuse: a } ).toString() ).to.include ( `diffuse ${a.id}` );
			expect ( new TextureSet().toString() ).to.include ( "diffuse none" );

			const scene = new Group();
			scene.addChild ( makeSquare ( [ -0.5, 0, 0 ], makeState ( a ) ) );
			scene.addChild ( makeSquare ( [ 0.5, 0, 0 ], makeState ( b ) ) );
			scene.addChild ( makeSquare ( [ 0, 0.5, 0 ], makeState ( a ) ) );
			expect ( cull ( scene ).info.numStateGroups ).to.equal ( 2 );
		} );

		it ( "Should give the shader its texture, and the shader should forget it when it resets", function ()
		{
			const texture = new Texture ( { image: makeImage ( 1, 1 ) } );
			const state = FlatShading.makeState ( { topology: "triangle-list" } );
			state.addAttribute ( new TextureSet ( { diffuse: texture } ) );
			const shader = FlatShading.instance;
			const input = { state, shader, projMatrix: [ ...IDENTITY_MATRIX ] as IMatrix44 };
			state.doApply ( input );
			expect ( shader.diffuseTexture ).to.equal ( texture );
			state.doReset ( input );
			expect ( shader.diffuseTexture ).to.be.null;
		} );
	} );
};
