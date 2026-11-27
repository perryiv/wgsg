///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the builder for semi-transparent scenes.
//
///////////////////////////////////////////////////////////////////////////////

import { buildBox } from "../../../lib/src/Builders/Box";
import { buildTransparentScene } from "../../../lib/src/Builders/Transparent";
import { expect } from "chai";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import {
	ColorAttribute,
	CullFace,
	Geometry,
	Group,
	Indexed,
	State,
	defaultApplyFunction,
	defaultResetFunction,
	type IStateApplyInput,
} from "../../../lib/src/Scene";
import { TRANSPARENT_BIN } from "../../../lib/src/Tools/Constants";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

// Custom apply and reset functions, to see that they're copied.
const apply = ( input: IStateApplyInput ) : void => { defaultApplyFunction ( input ); };
const reset = ( input: IStateApplyInput ) : void => { defaultResetFunction ( input ); };

export function test ()
{
	describe ( "Transparent", function ()
	{
		it ( "Should put the geometry under a group for the back faces and one for the front faces", function ()
		{
			const geometry = buildBox();
			const back = new State();
			const front = new State();
			const scene = buildTransparentScene ( { geometry, back, front } );

			expect ( scene.size ).to.equal ( 2 );
			const groups = [ scene.getChild ( 0 ), scene.getChild ( 1 ) ] as Group[];
			expect ( groups[0].state ).to.equal ( back );
			expect ( groups[1].state ).to.equal ( front );
			for ( const group of groups )
			{
				expect ( group ).to.be.instanceOf ( Group );
				expect ( group.size ).to.equal ( 1 );
				expect ( group.getChild ( 0 ) ).to.equal ( geometry );
			}
			expect ( geometry.state ).to.be.null;
		} );

		it ( "Should draw the back faces first, and then the front faces, without depth writes", function ()
		{
			const back = new State();
			const front = new State();
			buildTransparentScene ( { geometry: buildBox(), back, front } );

			expect ( back.bin ).to.equal ( TRANSPARENT_BIN );
			expect ( front.bin ).to.equal ( TRANSPARENT_BIN + 1 );
			expect ( back.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "front", depthWrite: false } );
			expect ( front.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "back", depthWrite: false } );

			// Only the back faces need two-sided lighting.
			expect ( back.name ).to.include ( "TwoSidedLight" );
			expect ( front.name ).not.to.include ( "TwoSidedLight" );
		} );

		it ( "Should remove the geometry's state when the states are given", function ()
		{
			const geometry = buildBox();
			geometry.state = new State();
			const back = new State();
			const front = new State();
			const scene = buildTransparentScene ( { geometry, back, front } );

			expect ( geometry.state ).to.be.null;
			expect ( ( scene.getChild ( 0 ) as Group ).state ).to.equal ( back );
			expect ( ( scene.getChild ( 1 ) as Group ).state ).to.equal ( front );
		} );

		it ( "Should copy the geometry's state when the states are not given", function ()
		{
			const geometry = buildBox();
			const color = new ColorAttribute ( [ 1, 0, 0, 0.4 ] );
			const original = new State ( {
				name: "Glass",
				layer: 2,
				bin: 7,
				shader: FlatShading.instance,
				topology: "triangle-list",
				apply,
				reset,
			} );
			original.addAttribute ( color );
			original.addAttribute ( new CullFace ( "back" ) );
			geometry.state = original;

			const scene = buildTransparentScene ( { geometry } );
			expect ( geometry.state ).to.be.null;
			const back = ( scene.getChild ( 0 ) as Group ).state!;
			const front = ( scene.getChild ( 1 ) as Group ).state!;
			expect ( back ).not.to.equal ( original );
			expect ( front ).not.to.equal ( original );
			expect ( front ).not.to.equal ( back );

			for ( const state of [ back, front ] )
			{
				// Copied.
				expect ( state.shader ).to.equal ( FlatShading.instance );
				expect ( state.topology ).to.equal ( "triangle-list" );
				expect ( state.layer ).to.equal ( 2 );
				expect ( state.apply ).to.equal ( apply );
				expect ( state.reset ).to.equal ( reset );

				// The color is shared, so changing it changes both sides.
				expect ( state.getAttribute ( ColorAttribute.getClassName() ) ).to.equal ( color );

				// Not copied: the name is made, and the bin is the transparent one.
				expect ( state.name ).not.to.equal ( "Glass" );
				expect ( state.bin ).to.be.at.least ( TRANSPARENT_BIN );
			}

			// The geometry's culling is replaced, on each side, and the original
			// state is not changed.
			expect ( back.pipelineOptions.cullMode ).to.equal ( "front" );
			expect ( front.pipelineOptions.cullMode ).to.equal ( "back" );
			expect ( original.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "back", depthWrite: true } );
			expect ( original.bin ).to.equal ( 7 );
		} );

		it ( "Should make half-transparent gray states when the geometry has none", function ()
		{
			const check = ( geometry: Geometry, shader: object ) =>
			{
				const scene = buildTransparentScene ( { geometry } );
				for ( const index of [ 0, 1 ] )
				{
					const state = ( scene.getChild ( index ) as Group ).state!;
					expect ( state.shader ).to.equal ( shader );
					expect ( state.topology ).to.equal ( "triangle-list" );
					const color = state.getAttribute ( ColorAttribute.getClassName() ) as ColorAttribute;
					expect ( Array.from ( color.color ) ).to.deep.equal ( [ 0.5, 0.5, 0.5, 0.5 ] );
				}
				const back = ( scene.getChild ( 0 ) as Group ).state!;
				const front = ( scene.getChild ( 1 ) as Group ).state!;
				expect ( back ).not.to.equal ( front );
				expect ( back.bin ).to.equal ( TRANSPARENT_BIN );
				expect ( front.bin ).to.equal ( TRANSPARENT_BIN + 1 );
			};

			// The box has no normals, so it gets flat shading.
			const box = buildBox();
			expect ( box.normals ).to.be.null;
			check ( box, FlatShading.instance );

			// With normals, Phong shading.
			const square = new Geometry ( {
				points: new Float32Array ( [ 0, 0, 0,   1, 0, 0,   0, 1, 0 ] ),
				normals: new Float32Array ( [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] ),
				primitives: new Indexed ( { topology: "triangle-list", indices: new Uint16Array ( [ 0, 1, 2 ] ) } ),
			} );
			check ( square, PhongShading.instance );
		} );

		it ( "Should give the new states the alpha given", function ()
		{
			const scene = buildTransparentScene ( { geometry: buildBox(), alpha: 0.25 } );
			for ( const index of [ 0, 1 ] )
			{
				const state = ( scene.getChild ( index ) as Group ).state!;
				const color = state.getAttribute ( ColorAttribute.getClassName() ) as ColorAttribute;
				expect ( Array.from ( color.color ) ).to.deep.equal ( [ 0.5, 0.5, 0.5, 0.25 ] );
			}

			// It's only for new states, so a copied state's color is kept.
			const geometry = buildBox();
			geometry.state = FlatShading.makeState ( { topology: "triangle-list" } );
			const color = new ColorAttribute ( [ 1, 0, 0, 0.4 ] );
			geometry.state.addAttribute ( color );
			const copied = buildTransparentScene ( { geometry, alpha: 0.25 } );
			const state = ( copied.getChild ( 0 ) as Group ).state!;
			expect ( state.getAttribute ( ColorAttribute.getClassName() ) ).to.equal ( color );
			expect ( Array.from ( color.color ) ).to.deep.equal ( [ 1, 0, 0, 0.4 ] );

			// It has to be from 0 to 1.
			for ( const alpha of [ -0.1, 1.1, NaN ] )
			{
				expect ( () => buildTransparentScene ( { geometry: buildBox(), alpha } ) ).to.throw ( "not from 0 to 1" );
			}
		} );

		it ( "Should make the state that is not given", function ()
		{
			const geometry = buildBox();
			const front = new State();
			const scene = buildTransparentScene ( { geometry, front } );
			const back = ( scene.getChild ( 0 ) as Group ).state!;
			expect ( back ).not.to.equal ( front );
			expect ( back.shader ).to.equal ( FlatShading.instance );
			expect ( ( scene.getChild ( 1 ) as Group ).state ).to.equal ( front );
		} );

		it ( "Should not take one state for both sides", function ()
		{
			const state = new State();
			expect ( () => buildTransparentScene ( { geometry: buildBox(), back: state, front: state } ) ).to.throw ( "different states" );
		} );
	} );
}
