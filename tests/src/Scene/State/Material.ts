///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the material state attribute.
//
///////////////////////////////////////////////////////////////////////////////

import { DEVELOPER_BUILD } from "../../../../lib/src/Tools/Environment";
import { expect } from "chai";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { IDENTITY_MATRIX } from "../../../../lib/src/Math/Constants";
import { SolidColor } from "../../../../lib/src/Shaders/SolidColor";
import { State } from "../../../../lib/src/Scene/State";
import type { IMatrix44, IVector4 } from "../../../../lib/src/Types";
import {
	ColorAttribute,
	CullFace,
	Material,
} from "../../../../lib/src/Scene/State/Attributes";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

const RED: IVector4 = [ 1, 0, 0, 1 ];
const GREEN: IVector4 = [ 0, 1, 0, 1 ];

/**
 * Apply the state to its shader, and reset it afterwards.
 * @param {State} state - The state.
 * @param {Function} check - Called while the state is applied.
 */
const whileApplied = ( state: State, check: () => void ) : void =>
{
	const input = { state, shader: state.shader!, projMatrix: [ ...IDENTITY_MATRIX ] as IMatrix44 };
	state.doApply ( input );
	try
	{
		check();
	}
	finally
	{
		state.doReset ( input );
	}
};

/**
 * Call the function and return what it printed with console.warn.
 * @param {Function} func - The function.
 * @returns {string[]} The warnings.
 */
const getWarnings = ( func: () => void ) : string[] =>
{
	const warnings: string[] = [];
	const original = console.warn;
	console.warn = ( ...args: unknown[] ) => { warnings.push ( args.join ( " " ) ); };
	try
	{
		func();
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
	describe ( "Material", function ()
	{
		it ( "Should have OpenGL's defaults", function ()
		{
			const material = new Material();
			expect ( material.ambient ).to.deep.equal ( [ 0.2, 0.2, 0.2, 1 ] );
			expect ( material.diffuse ).to.deep.equal ( [ 0.8, 0.8, 0.8, 1 ] );
			expect ( material.specular ).to.deep.equal ( [ 0, 0, 0, 1 ] );
			expect ( material.emission ).to.deep.equal ( [ 0, 0, 0, 1 ] );
			expect ( material.shininess ).to.equal ( 0 );
		} );

		it ( "Should use what it's given, and the defaults for the rest", function ()
		{
			const material = new Material ( { diffuse: RED, shininess: 20 } );
			expect ( material.diffuse ).to.deep.equal ( RED );
			expect ( material.shininess ).to.equal ( 20 );
			expect ( material.ambient ).to.deep.equal ( [ 0.2, 0.2, 0.2, 1 ] );

			// It copies the colors.
			const color: IVector4 = [ 0, 0, 1, 1 ];
			material.emission = color;
			color[0] = 1;
			expect ( material.emission ).to.deep.equal ( [ 0, 0, 1, 1 ] );
		} );

		it ( "Should have no alpha mask by default, and a cutoff of 0.5 for when it's on", function ()
		{
			const material = new Material();
			expect ( material.alphaMask ).to.be.false;
			expect ( material.alphaCutoff ).to.equal ( 0.5 );

			const masked = new Material ( { alphaMask: true, alphaCutoff: 0.25 } );
			expect ( masked.alphaMask ).to.be.true;
			expect ( masked.alphaCutoff ).to.equal ( 0.25 );
			expect ( masked.toString() ).to.include ( "alpha cutoff 0.25" );
			expect ( material.toString() ).to.not.include ( "alpha cutoff" );

			for ( const alphaCutoff of [ -0.1, 1.1, NaN ] )
			{
				expect ( () => new Material ( { alphaCutoff } ) ).to.throw ( "is not from 0 to 1" );
			}
		} );

		it ( "Should give the shader its alpha cutoff only when the mask is on", function ()
		{
			for ( const [ alphaMask, expected ] of [ [ true, 0.25 ], [ false, null ] ] as const )
			{
				const state = new State ( { shader: FlatShading.instance } );
				state.addAttribute ( new Material ( { alphaMask, alphaCutoff: 0.25 } ) );
				whileApplied ( state, () =>
				{
					expect ( FlatShading.instance.alphaCutoff ).to.equal ( expected );
				} );
			}

			// Resetting turns the mask off.
			expect ( FlatShading.instance.alphaCutoff ).to.be.null;
		} );

		it ( "Should have no clear coat by default, and give the shader its clear coat", function ()
		{
			const material = new Material();
			expect ( material.clearcoat ).to.equal ( 0 );
			expect ( material.clearcoatShininess ).to.equal ( 128 );
			expect ( material.toString() ).to.not.include ( "clear coat" );

			const coated = new Material ( { clearcoat: 0.5, clearcoatShininess: 30 } );
			expect ( coated.toString() ).to.include ( "clear coat 0.5 shininess 30" );
			expect ( () => new Material ( { clearcoat: 1.5 } ) ).to.throw ( "Clear coat 1.5 is not from 0 to 1" );
			expect ( () => new Material ( { clearcoatShininess: 200 } ) ).to.throw ( "Clear coat shininess 200 is not from 0 to 128" );

			const state = new State ( { shader: FlatShading.instance } );
			state.addAttribute ( coated );
			whileApplied ( state, () =>
			{
				expect ( FlatShading.instance.clearcoat ).to.equal ( 0.5 );
				expect ( FlatShading.instance.clearcoatShininess ).to.equal ( 30 );
			} );
			expect ( FlatShading.instance.clearcoat ).to.equal ( 0 );
			expect ( FlatShading.instance.clearcoatShininess ).to.equal ( 128 );
		} );

		it ( "Should reject a shininess that is not from 0 to 128", function ()
		{
			for ( const shininess of [ -1, 129, NaN ] )
			{
				expect ( () => new Material ( { shininess } ) ).to.throw ( "is not from 0 to 128" );
			}
			expect ( new Material ( { shininess: 128 } ).shininess ).to.equal ( 128 );
		} );

		it ( "Should have its values in its string and JSON, so states with different ones are told apart", function ()
		{
			const a = new Material ( { diffuse: RED } );
			const b = new Material ( { diffuse: GREEN } );
			expect ( a.toString() ).to.not.equal ( b.toString() );
			expect ( a.toString() ).to.include ( "diffuse [1, 0, 0, 1]" );
			expect ( a.toJSON() ).to.deep.include ( { diffuse: RED, shininess: 0 } );

			const state = new State ( { shader: FlatShading.instance } );
			state.addAttribute ( a );
			expect ( state.name ).to.include ( "Material" );
		} );

		it ( "Should give a lighting shader all its values, and an unlit shader its diffuse color", function ()
		{
			const values = {
				ambient: [ 0.1, 0.2, 0.3, 1 ] as IVector4,
				diffuse: RED,
				specular: GREEN,
				emission: [ 0, 0, 0.5, 1 ] as IVector4,
				shininess: 64,
			};

			const lit = new State ( { shader: FlatShading.instance } );
			lit.addAttribute ( new Material ( values ) );
			whileApplied ( lit, () =>
			{
				const shader = FlatShading.instance;
				expect ( shader.ambient ).to.deep.equal ( values.ambient );
				expect ( shader.diffuse ).to.deep.equal ( values.diffuse );
				expect ( shader.specular ).to.deep.equal ( values.specular );
				expect ( shader.emission ).to.deep.equal ( values.emission );
				expect ( shader.shininess ).to.equal ( 64 );
			} );

			// Resetting puts the defaults back.
			expect ( FlatShading.instance.diffuse ).to.deep.equal ( [ 0.8, 0.8, 0.8, 1 ] );
			expect ( FlatShading.instance.shininess ).to.equal ( 0 );

			const unlit = new State ( { shader: SolidColor.instance } );
			unlit.addAttribute ( new Material ( values ) );
			whileApplied ( unlit, () =>
			{
				expect ( SolidColor.instance.diffuse ).to.deep.equal ( RED );
			} );
		} );

		it ( "Should use the material, not the color, when a state has both, in either order", function ()
		{
			getWarnings ( () =>
			{
				for ( const colorFirst of [ true, false ] )
				{
					const state = new State ( { shader: FlatShading.instance } );
					const color = new ColorAttribute ( RED );
					const material = new Material ( { diffuse: GREEN } );
					state.addAttribute ( colorFirst ? color : material );
					state.addAttribute ( colorFirst ? material : color );
					whileApplied ( state, () =>
					{
						expect ( FlatShading.instance.diffuse ).to.deep.equal ( GREEN );
					} );
				}
			} );

			// The color alone sets only the diffuse color.
			const state = new State ( { shader: FlatShading.instance } );
			state.addAttribute ( new ColorAttribute ( RED ) );
			whileApplied ( state, () =>
			{
				expect ( FlatShading.instance.diffuse ).to.deep.equal ( RED );
				expect ( FlatShading.instance.ambient ).to.deep.equal ( [ 0.2, 0.2, 0.2, 1 ] );
			} );
		} );

		it ( "Should warn in developer builds when a state gets both a color and a material", function ()
		{
			if ( !DEVELOPER_BUILD )
			{
				this.skip();
			}

			// Only the attribute that makes it both warns.
			const state = new State ( { shader: FlatShading.instance } );
			expect ( getWarnings ( () => state.addAttribute ( new ColorAttribute ( RED ) ) ) ).to.deep.equal ( [] );
			expect ( getWarnings ( () => state.addAttribute ( new CullFace ( "back" ) ) ) ).to.deep.equal ( [] );
			const warnings = getWarnings ( () => state.addAttribute ( new Material() ) );
			expect ( warnings.length ).to.equal ( 1 );
			expect ( warnings[0] ).to.include ( "has both a color and a material, so the color is not used" );

			// The same in the other order.
			const other = new State ( { shader: FlatShading.instance } );
			expect ( getWarnings ( () => other.addAttribute ( new Material() ) ) ).to.deep.equal ( [] );
			expect ( getWarnings ( () => other.addAttribute ( new ColorAttribute ( RED ) ) ).length ).to.equal ( 1 );
		} );
	} );
};
