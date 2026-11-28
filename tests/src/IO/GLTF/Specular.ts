///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test approximating glTF's metallic and roughness with a specular color
//	and shininess.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { getSpecular } from "../../../../lib/src/IO/Readers/GLTF/Specular";
import { Material } from "../../../../lib/src/Scene";
import { GltfMaker, read, getGeometries, TRIANGLE_POINTS } from "./Helpers";
import type { IGltfMaterial } from "../../../../lib/src/IO/Readers/GLTF/Types";
import type { IVector4 } from "../../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Expect the colors to be close.
 * @param {number[]} actual - The color.
 * @param {number[]} expected - The expected color.
 */
const expectColor = ( actual: readonly number[], expected: readonly number[] ) : void =>
{
	expect ( actual.length ).to.equal ( expected.length );
	actual.forEach ( ( value, i ) => { expect ( value, `channel ${i} of [${actual.join ( ", " )}]` ).to.be.closeTo ( expected[i], 1e-4 ); } );
};

/**
 * Read a triangle with the material and return its state's material.
 * @param {IGltfMaterial} material - The glTF material.
 * @returns {Promise<Material>} The material attribute.
 */
const readMaterial = async ( material: IGltfMaterial ) : Promise < Material > =>
{
	const maker = new GltfMaker();
	const POSITION = maker.addPoints ( TRIANGLE_POINTS );
	maker.addMeshNode ( [ { attributes: { POSITION }, material: maker.addMaterial ( material ) } ] );
	const geom = getGeometries ( await read ( maker.glb() ) )[0];
	return geom.state!.getAttribute ( Material.getClassName() ) as Material;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Specular", function ()
	{
		const RED: IVector4 = [ 1, 0, 0, 1 ];
		const ORANGE: IVector4 = [ 0.5, 0.25, 0, 1 ];

		it ( "Should make the shininess from the roughness, at most 128", function ()
		{
			// 2 / roughness^4 - 2.
			expect ( getSpecular ( RED, 0, 0.5 ).shininess ).to.be.closeTo ( 30, 1e-9 );
			expect ( getSpecular ( RED, 0, 0.9 ).shininess ).to.be.closeTo ( ( 2 / Math.pow ( 0.9, 4 ) ) - 2, 1e-9 );
			expect ( getSpecular ( RED, 0, 0.25 ).shininess ).to.equal ( 128 );
			expect ( getSpecular ( RED, 0, 0 ).shininess ).to.equal ( 128 );
		} );

		it ( "Should give a non-metal a gray highlight of 0.04, made brighter for small highlights", function ()
		{
			// ( 30 + 8 ) / 8 = 4.75 times 0.04.
			expectColor ( getSpecular ( RED, 0, 0.5 ).specular, [ 0.19, 0.19, 0.19, 1 ] );
		} );

		it ( "Should give a metal a highlight of its color, scaled to fit without changing its hue", function ()
		{
			// 17 times orange is more than 1, so it's scaled to fit.
			expectColor ( getSpecular ( ORANGE, 1, 0 ).specular, [ 1, 0.5, 0, 1 ] );

			// Half metal: 0.52, 0.02, and 0.02, times 4.75, scaled to fit.
			expectColor ( getSpecular ( RED, 0.5, 0.5 ).specular, [ 1, ( 0.02 / 0.52 ), ( 0.02 / 0.52 ), 1 ] );
		} );

		it ( "Should give a very rough surface no highlight", function ()
		{
			for ( const metallic of [ 0, 1 ] )
			{
				expect ( getSpecular ( RED, metallic, 1 ) ).to.deep.equal ( { specular: [ 0, 0, 0, 1 ], shininess: 0 } );
			}
		} );

		it ( "Should read a glTF material's metallic and roughness, which are 1 by default", async function ()
		{
			// Fully metal and rough, by default, so no highlight.
			const plain = await readMaterial ( {} );
			expect ( [ ...plain.specular ] ).to.deep.equal ( [ 0, 0, 0, 1 ] );
			expect ( plain.shininess ).to.equal ( 0 );

			// A shiny non-metal. The diffuse color stays the base color.
			const shiny = await readMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 1, 0, 0, 1 ], metallicFactor: 0, roughnessFactor: 0.5 } } );
			expectColor ( shiny.specular, [ 0.19, 0.19, 0.19, 1 ] );
			expect ( shiny.shininess ).to.be.closeTo ( 30, 1e-6 );
			expect ( [ ...shiny.diffuse ] ).to.deep.equal ( [ 1, 0, 0, 1 ] );

			// A metal keeps its base color as its diffuse color too.
			const metal = await readMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 0.5, 0.25, 0, 1 ], roughnessFactor: 0 } } );
			expectColor ( metal.specular, [ 1, 0.5, 0, 1 ] );
			expect ( [ ...metal.diffuse ] ).to.deep.equal ( [ 0.5, 0.25, 0, 1 ] );
		} );

		it ( "Should give no highlight when the metallic and roughness are in a texture", async function ()
		{
			const textured = await readMaterial ( { pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.5, metallicRoughnessTexture: { index: 0 } } } );
			expect ( [ ...textured.specular ] ).to.deep.equal ( [ 0, 0, 0, 1 ] );
			expect ( textured.shininess ).to.equal ( 0 );
		} );

		it ( "Should read a material's clear coat, with its shininess like its roughness", async function ()
		{
			const none = await readMaterial ( {} );
			expect ( none.clearcoat ).to.equal ( 0 );

			const smooth = await readMaterial ( { extensions: { KHR_materials_clearcoat: { clearcoatFactor: 1 } } } );
			expect ( smooth.clearcoat ).to.equal ( 1 );
			expect ( smooth.clearcoatShininess ).to.equal ( 128 );

			const rough = await readMaterial ( { extensions: { KHR_materials_clearcoat: { clearcoatFactor: 0.25, clearcoatRoughnessFactor: 0.5 } } } );
			expect ( rough.clearcoat ).to.equal ( 0.25 );
			expect ( rough.clearcoatShininess ).to.be.closeTo ( 30, 1e-6 );

			let error = "";
			try
			{
				await readMaterial ( { extensions: { KHR_materials_clearcoat: { clearcoatFactor: 2 } } } );
			}
			catch ( e )
			{
				error = ( e as Error ).message;
			}
			expect ( error ).to.include ( "Material 0 has a clear coat of 2, which is not from 0 to 1" );
		} );

		it ( "Should reject a metallic or roughness that is not from 0 to 1", async function ()
		{
			for ( const [ pbr, message ] of [
				[ { metallicFactor: 2 }, "Material 0 has a metallic of 2, which is not from 0 to 1" ],
				[ { roughnessFactor: -1 }, "Material 0 has a roughness of -1, which is not from 0 to 1" ],
			] as const )
			{
				let error = "";
				try
				{
					await readMaterial ( { pbrMetallicRoughness: pbr } );
				}
				catch ( e )
				{
					error = ( e as Error ).message;
				}
				expect ( error ).to.include ( message );
			}
		} );
	} );
};
