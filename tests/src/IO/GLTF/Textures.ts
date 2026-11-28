///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test reading the textures of glTF files.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../../lib/src/Tools/Device";
import { expect } from "chai";
import { GLTF } from "../../../../lib/src/IO/Readers/GLTF";
import { decodePng, makePng } from "../../Helpers/Png";
import { drawScene, expectPixel, pixelAt } from "../../Helpers/Squares";
import { Group, TextureSet, type State } from "../../../../lib/src/Scene";
import type { IRawImage, Texture } from "../../../../lib/src/Textures/Texture";
import { getGeometries, GltfMaker, read } from "./Helpers";
import {
	GLTF_CLAMP_TO_EDGE,
	GLTF_FLOAT,
	GLTF_LINEAR,
	GLTF_LINEAR_MIPMAP_NEAREST,
	GLTF_MIRRORED_REPEAT,
	GLTF_NEAREST,
	GLTF_UNSIGNED_BYTE,
	GLTF_UNSIGNED_SHORT,
	type IGltfSampler,
	type IGltfTexture,
} from "../../../../lib/src/IO/Readers/GLTF/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

// A checker of four pixels: red and green on the top row, blue and white on
// the bottom row.
const CHECKER: IRawImage = {
	width: 2,
	height: 2,
	data: new Uint8Array ( [
		255, 0, 0, 255,     0, 255, 0, 255,
		0, 0, 255, 255,     255, 255, 255, 255,
	] ),
};

// A square in front of the camera, facing it, with the top of the image at
// the top.
const POINTS = [ -0.8, -0.8, 0,   0.8, -0.8, 0,   0.8, 0.8, 0,   -0.8, 0.8, 0 ];
const INDICES = [ 0, 1, 2,   0, 2, 3 ];
const TEX_COORDS = [ 0, 1,   1, 1,   1, 0,   0, 0 ];

/**
 * Make a square whose material has a base color texture.
 * @param {object} [input] - What to change.
 * @param {Partial<IGltfTexture>} [input.texture] - More of the texture.
 * @param {IGltfSampler} [input.sampler] - The sampler, if any.
 * @param {number} [input.texCoord] - Which texture coordinates the material uses.
 * @returns {GltfMaker} The maker.
 */
const makeTexturedSquare = ( input?: { texture?: Partial<IGltfTexture>, sampler?: IGltfSampler, texCoord?: number } ) : GltfMaker =>
{
	const maker = new GltfMaker();
	const POSITION = maker.addPoints ( POINTS );
	const TEXCOORD_0 = maker.addAccessor ( TEX_COORDS, GLTF_FLOAT, "VEC2" );
	const indices = maker.addAccessor ( INDICES, GLTF_UNSIGNED_SHORT, "SCALAR" );
	const source = maker.addImage ( makePng ( CHECKER ) );
	const sampler = ( input?.sampler ? maker.addSampler ( input.sampler ) : undefined );
	const index = maker.addTexture ( { source, ...( ( undefined === sampler ) ? {} : { sampler } ), ...input?.texture } );
	const texCoord = input?.texCoord;
	const material = maker.addMaterial ( { pbrMetallicRoughness: {
		baseColorTexture: { index, ...( ( undefined === texCoord ) ? {} : { texCoord } ) },
	} } );
	maker.addMeshNode ( [ { attributes: { POSITION, TEXCOORD_0 }, indices, material } ] );
	return maker;
};

/**
 * Get the diffuse texture of the state, if any.
 * @param {State} state - The state.
 * @returns {Texture | null} The texture, if any.
 */
const getDiffuse = ( state: State ) : ( Texture | null ) =>
{
	const set = state.getAttribute ( TextureSet.getClassName() );
	return ( ( set instanceof TextureSet ) ? set.diffuse : null );
};

/**
 * Call the function and return what it printed with console.warn.
 * @param {Function} func - The function.
 * @returns {Promise<string[]>} The warnings.
 */
const getWarnings = async ( func: () => Promise < unknown > ) : Promise < string[] > =>
{
	const warnings: string[] = [];
	const original = console.warn;
	console.warn = ( ...args: unknown[] ) => { warnings.push ( args.join ( " " ) ); };
	try
	{
		await func();
	}
	finally
	{
		console.warn = original;
	}
	return warnings;
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
		it ( "Should make PNGs that the test decoder reads back", function ()
		{
			const image = decodePng ( makePng ( CHECKER ) );
			expect ( image.width ).to.equal ( 2 );
			expect ( image.height ).to.equal ( 2 );
			expect ( Array.from ( image.data ) ).to.deep.equal ( Array.from ( CHECKER.data ) );
		} );

		it ( "Should read the texture coordinates, as floats or normalized integers", async function ()
		{
			const floats = getGeometries ( await read ( makeTexturedSquare().glb() ) )[0];
			expect ( floats.hasTexCoords ).to.be.true;
			expect ( Array.from ( floats.texCoords!.values! ) ).to.deep.equal ( TEX_COORDS );

			const maker = new GltfMaker();
			const POSITION = maker.addPoints ( POINTS.slice ( 0, 9 ) );
			const TEXCOORD_0 = maker.addAccessor ( [ 0, 255,   255, 255,   255, 0 ], GLTF_UNSIGNED_BYTE, "VEC2", { normalized: true } );
			maker.addMeshNode ( [ { attributes: { POSITION, TEXCOORD_0 } } ] );
			const bytes = getGeometries ( await read ( maker.glb() ) )[0];
			expect ( Array.from ( bytes.texCoords!.values! ) ).to.deep.equal ( [ 0, 1,   1, 1,   1, 0 ] );
		} );

		it ( "Should reject texture coordinates of the wrong number", async function ()
		{
			const maker = new GltfMaker();
			const POSITION = maker.addPoints ( POINTS.slice ( 0, 9 ) );
			const TEXCOORD_0 = maker.addAccessor ( [ 0, 0,   1, 1 ], GLTF_FLOAT, "VEC2" );
			maker.addMeshNode ( [ { attributes: { POSITION, TEXCOORD_0 } } ] );
			let message = "";
			try
			{
				await read ( maker.glb() );
			}
			catch ( error )
			{
				message = ( error as Error ).message;
			}
			expect ( message ).to.include ( "There are 2 texture coordinates but 3 points" );
		} );

		it ( "Should give a material's base color texture to its state, as an sRGB texture with mipmaps", async function ()
		{
			const geom = getGeometries ( await read ( makeTexturedSquare().glb() ) )[0];
			const texture = getDiffuse ( geom.state! )!;
			expect ( texture.width ).to.equal ( 2 );
			expect ( texture.height ).to.equal ( 2 );
			expect ( texture.srgb ).to.be.true;
			expect ( texture.mipmaps ).to.be.true;
			expect ( texture.samplerSettings ).to.deep.equal ( { wrapU: "repeat", wrapV: "repeat", magFilter: "linear", minFilter: "linear", mipmapFilter: "linear" } );
		} );

		it ( "Should use the sampler's settings", async function ()
		{
			const cases: [ IGltfSampler, object, boolean ][] = [
				[ { wrapS: GLTF_CLAMP_TO_EDGE, wrapT: GLTF_MIRRORED_REPEAT }, { wrapU: "clamp-to-edge", wrapV: "mirror-repeat" }, true ],
				[ { magFilter: GLTF_NEAREST, minFilter: GLTF_LINEAR_MIPMAP_NEAREST }, { magFilter: "nearest", minFilter: "linear", mipmapFilter: "nearest" }, true ],
				[ { minFilter: GLTF_NEAREST }, { minFilter: "nearest" }, false ],
				[ { minFilter: GLTF_LINEAR }, { minFilter: "linear" }, false ],
			];
			for ( const [ sampler, settings, mipmaps ] of cases )
			{
				const geom = getGeometries ( await read ( makeTexturedSquare ( { sampler } ).glb() ) )[0];
				const texture = getDiffuse ( geom.state! )!;
				expect ( texture.samplerSettings, JSON.stringify ( sampler ) ).to.deep.include ( settings );
				expect ( texture.mipmaps ).to.equal ( mipmaps );
			}
		} );

		it ( "Should share textures and decode each image once", async function ()
		{
			// Two textures of one image, and two materials that use the first.
			const maker = new GltfMaker();
			const POSITION = maker.addPoints ( POINTS.slice ( 0, 9 ) );
			const TEXCOORD_0 = maker.addAccessor ( TEX_COORDS.slice ( 0, 6 ), GLTF_FLOAT, "VEC2" );
			const source = maker.addImage ( makePng ( CHECKER ) );
			const first = maker.addTexture ( { source } );
			const second = maker.addTexture ( { source } );
			const a = maker.addMaterial ( { pbrMetallicRoughness: { baseColorTexture: { index: first } } } );
			const b = maker.addMaterial ( { pbrMetallicRoughness: { baseColorTexture: { index: first } }, doubleSided: true } );
			const c = maker.addMaterial ( { pbrMetallicRoughness: { baseColorTexture: { index: second } } } );
			maker.addMeshNode ( [
				{ attributes: { POSITION, TEXCOORD_0 }, material: a },
				{ attributes: { POSITION, TEXCOORD_0 }, material: b },
				{ attributes: { POSITION, TEXCOORD_0 }, material: c },
			] );

			const reader = new GLTF();
			let decoded = 0;
			reader.imageDecoder = async ( bytes: Uint8Array ) => { ++decoded; return Promise.resolve ( decodePng ( bytes ) ); };
			const [ ga, gb, gc ] = getGeometries ( await reader.read ( maker.glb() ) );
			expect ( decoded ).to.equal ( 1 );
			expect ( getDiffuse ( ga.state! ) ).to.equal ( getDiffuse ( gb.state! ) );
			expect ( getDiffuse ( gc.state! ) ).to.not.equal ( getDiffuse ( ga.state! ) );
			expect ( getDiffuse ( gc.state! )!.image ).to.equal ( getDiffuse ( ga.state! )!.image );
		} );

		it ( "Should read an image in a data URI", async function ()
		{
			const maker = makeTexturedSquare();
			const png = makePng ( CHECKER );
			maker.json.images![0] = { uri: `data:image/png;base64,${btoa ( String.fromCharCode ( ...png ) )}` };
			const geom = getGeometries ( await read ( maker.glb() ) )[0];
			expect ( getDiffuse ( geom.state! )!.width ).to.equal ( 2 );
		} );

		it ( "Should skip textures it can't read, with a warning, and still read the model", async function ()
		{
			const cases: [ string, GltfMaker ][] = [];

			const external = makeTexturedSquare();
			external.json.images![0] = { uri: "checker.png" };
			cases.push ( [ "is in another file, 'checker.png'", external ] );

			cases.push ( [ "texture coordinates other than TEXCOORD_0", makeTexturedSquare ( { texCoord: 1 } ) ] );

			const noSource = makeTexturedSquare();
			delete noSource.json.textures![0].source;
			cases.push ( [ "has no image that's supported", noSource ] );

			const noType = makeTexturedSquare();
			delete noType.json.images![0].mimeType;
			cases.push ( [ "has no MIME type", noType ] );

			for ( const [ expected, maker ] of cases )
			{
				let scene: ( Group | null ) = null;
				const warnings = await getWarnings ( async () => { scene = await read ( maker.glb() ) as Group; } );
				expect ( warnings.join ( "\n" ), expected ).to.include ( expected );
				const geom = getGeometries ( scene! )[0];
				expect ( getDiffuse ( geom.state! ) ).to.be.null;
			}
		} );

		it ( "Should give a material's emissive texture to its state", async function ()
		{
			const maker = makeTexturedSquare();
			const material = maker.json.materials![0];
			material.emissiveTexture = { index: 0 };
			material.emissiveFactor = [ 1, 1, 1 ];
			const geom = getGeometries ( await read ( maker.glb() ) )[0];
			const set = geom.state!.getAttribute ( TextureSet.getClassName() ) as TextureSet;
			expect ( set.emissive ).to.equal ( set.diffuse );
			expect ( set.emissive!.srgb ).to.be.true;
		} );

		it ( "Should make a shape glow only where its emissive texture is light", async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}

			// Black, with white emission times a texture that is black except
			// for its top right pixel, like the lights of a car.
			const maker = makeTexturedSquare ( { sampler: { magFilter: GLTF_NEAREST } } );
			const lights: IRawImage = { width: 2, height: 2, data: new Uint8Array ( [
				0, 0, 0, 255,     255, 255, 255, 255,
				0, 0, 0, 255,     0, 0, 0, 255,
			] ) };
			const source = maker.addImage ( makePng ( lights ) );
			const emissive = maker.addTexture ( { source, sampler: 0 } );
			maker.json.materials![0] = { pbrMetallicRoughness: { baseColorFactor: [ 0, 0, 0, 1 ] }, emissiveFactor: [ 1, 1, 1 ], emissiveTexture: { index: emissive } };
			const scene = new Group();
			scene.addChild ( await read ( maker.glb() ) );
			const pixels = await drawScene ( scene );
			expectPixel ( pixelAt ( pixels, 0.4, 0.4 ), [ 255, 255, 255, 255 ] );
			expectPixel ( pixelAt ( pixels, -0.4, 0.4 ), [ 0, 0, 0, 255 ] );
			expectPixel ( pixelAt ( pixels, -0.4, -0.4 ), [ 0, 0, 0, 255 ] );
		} );

		it ( "Should draw an opaque material opaque, even where its texture is clear", async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}

			// The checker with its green pixel clear. The material is opaque, by
			// default, so green is drawn, not the background.
			const maker = makeTexturedSquare ( { sampler: { magFilter: GLTF_NEAREST } } );
			const clear = new Uint8Array ( CHECKER.data );
			clear[7] = 0;
			maker.json.images![0] = { bufferView: maker.addView ( makePng ( { width: 2, height: 2, data: clear } ) ), mimeType: "image/png" };
			const scene = new Group();
			scene.addChild ( await read ( maker.glb() ) );
			expectPixel ( pixelAt ( await drawScene ( scene ), 0.4, 0.4 ), [ 0, 255, 0, 255 ] );
		} );

		it ( "Should draw the texture on the shape", async function ()
		{
			if ( !Device.valid )
			{
				await Device.init();
			}
			const scene = new Group();
			scene.addChild ( await read ( makeTexturedSquare ( { sampler: { magFilter: GLTF_NEAREST } } ).glb() ) );
			const pixels = await drawScene ( scene );
			expectPixel ( pixelAt ( pixels, -0.4, 0.4 ), [ 255, 0, 0, 255 ] );
			expectPixel ( pixelAt ( pixels, 0.4, 0.4 ), [ 0, 255, 0, 255 ] );
			expectPixel ( pixelAt ( pixels, -0.4, -0.4 ), [ 0, 0, 255, 255 ] );
			expectPixel ( pixelAt ( pixels, 0.4, -0.4 ), [ 255, 255, 255, 255 ] );
		} );
	} );
};
