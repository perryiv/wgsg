///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the render graph.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	Cull as CullVisitor,
	Device,
	Draw as DrawVisitor,
	getIMatrixAsString,
	Group,
	IDENTITY_MATRIX,
	ILayer,
	IMatrix44,
	IModelMatrixData,
	IModelMatrixMap,
	IProjMatrixData,
	IProjMatrixMap,
	IStateData,
	IStateMap,
	SolidColor,
	Sphere,
	State,
	type ILayerMap,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Build a scene for testing.
//
///////////////////////////////////////////////////////////////////////////////

function buildScene ()
{
	const root = new Group();
	root.addChild ( new Sphere ( { center: [ 0, 0, 0 ], radius: 1 } ) );
	root.addChild ( new Sphere ( { center: [ 2, 0, 0 ], radius: 1 } ) );
	root.addChild ( new Sphere ( { center: [ 4, 0, 0 ], radius: 1 } ) );
	root.addChild ( new Sphere ( { center: [ 6, 0, 0 ], radius: 1 } ) );
	return root;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	const names = {
		state: "test_render_graph_default_state"
	};

	let device: ( Device | null ) = null;
	let scene: ( Group | null ) = null;
	let cv: ( CullVisitor | null ) = null;
	const layers: ILayerMap = new Map < number, ILayer > ();

	describe ( "Render Graph", function ()
	{
		this.beforeAll ( async function ()
		{
			device = await Device.create();
		} );

		it ( "Cull visitor has expected properties", function ()
		{
			cv = new CullVisitor ( {
				defaultState: new State ( {
					name: names.state,
					shader: new SolidColor ( { device: device! } )
				} ),
				layers
			} );

			expect ( cv ).to.exist;
			expect ( cv instanceof CullVisitor ).to.be.true;
			expect ( cv.layers ).to.equal ( layers );
			expect ( cv.defaultState ).to.exist;
			expect ( cv.defaultState instanceof State ).to.be.true;
			expect ( cv.defaultState.name ).to.be.equal ( names.state );
			expect ( cv.defaultState.layer ).to.be.equal ( 0 );
			expect ( cv.defaultState.renderBin ).to.be.equal ( 0 );
			expect ( cv.defaultState.apply ).to.not.be.undefined;
			expect ( cv.defaultState.reset ).to.not.be.undefined;
			expect ( cv.defaultState.shader ).to.exist;
			expect ( cv.defaultState.shader instanceof SolidColor ).to.be.true;
		} );

		it ( "Can build and cull the scene", function ()
		{
			cv = cv!;

			expect ( scene ).to.be.null;
			expect ( cv ).to.exist;
			expect ( cv instanceof CullVisitor ).to.be.true;

			scene = buildScene();
			scene.accept ( cv );
		} );

		it ( "The render graph has the expected structure", function ()
		{
			expect ( layers.size ).to.be.equal ( 1 );

			const layer = layers.get ( 0 );
			expect ( layer ).to.not.be.undefined;
			expect ( "object" === ( typeof layer ) ).to.be.true;

			// This if statement is to make the TypeScript compiler happy.
			if ( "undefined" === typeof layer )
			{
				throw new Error ( "Layer is not defined" );
			}

			const clipped: IProjMatrixMap = layer.clipped;
			const unclipped: IProjMatrixMap = layer.unclipped;

			expect ( clipped ).to.not.be.undefined;
			expect ( clipped instanceof Map ).to.be.true;
			expect ( clipped.size ).to.be.equal ( 1 );

			expect ( unclipped ).to.not.be.undefined;
			expect ( unclipped instanceof Map ).to.be.true;
			expect ( unclipped.size ).to.be.equal ( 0 );

			const pmd: ( IProjMatrixData | undefined ) = clipped.get ( getIMatrixAsString ( IDENTITY_MATRIX ) );
			expect ( pmd ).to.not.be.undefined;
			expect ( "object" === ( typeof pmd ) ).to.be.true;

			// This if statement is to make the TypeScript compiler happy.
			if ( "undefined" === typeof pmd )
			{
				throw new Error ( "Projection matrix data is not defined" );
			}

			const projMatrix: IMatrix44 = pmd.projMatrix;
			expect ( projMatrix ).to.not.be.undefined;
			expect ( projMatrix instanceof Array ).to.be.true;
			expect ( projMatrix.length ).to.be.equal ( 16 );
			expect ( projMatrix ).to.be.deep.equal ( IDENTITY_MATRIX );

			const states: IStateMap = pmd.states;
			expect ( states ).to.not.be.undefined;
			expect ( states instanceof Map ).to.be.true;
			expect ( states.size ).to.be.equal ( 1 );
			expect ( states.has ( names.state ) ).to.be.true;

			const sd: ( IStateData | undefined ) = states.get ( names.state );
			expect ( sd ).to.not.be.undefined;
			expect ( sd ).to.not.be.null;
			expect ( "object" === ( typeof sd ) ).to.be.true;

			// This if statement is to make the TypeScript compiler happy.
			if ( "undefined" === typeof sd )
			{
				throw new Error ( `State data for '${ names.state }' is not valid` );
			}

			const state: State = sd.state;
			expect ( state ).to.not.be.undefined;
			expect ( state instanceof State ).to.be.true;
			expect ( state.name ).to.be.equal ( names.state );

			const modelMatrices: IModelMatrixMap = sd.modelMatrices;
			expect ( modelMatrices ).to.not.be.undefined;
			expect ( modelMatrices instanceof Map ).to.be.true;
			expect ( modelMatrices.size ).to.be.equal ( 1 );

			const mmd: ( IModelMatrixData | undefined ) = modelMatrices.get ( getIMatrixAsString ( IDENTITY_MATRIX ) );
			expect ( mmd ).to.not.be.undefined;
			expect ( "object" === ( typeof mmd ) ).to.be.true;

			// This if statement is to make the TypeScript compiler happy.
			if ( "undefined" === typeof mmd )
			{
				throw new Error ( "Model matrix data is not defined" );
			}

			const modelMatrix: IMatrix44 = mmd.modelMatrix;
			expect ( modelMatrix ).to.not.be.undefined;
			expect ( modelMatrix instanceof Array ).to.be.true;
			expect ( modelMatrix.length ).to.be.equal ( 16 );
			expect ( modelMatrix ).to.be.deep.equal ( IDENTITY_MATRIX );

			const shapes = mmd.shapes;
			expect ( shapes ).to.not.be.undefined;
			expect ( shapes instanceof Array ).to.be.true;
			expect ( shapes.length ).to.be.equal ( 4 );

			for ( const shape of shapes )
			{
				expect ( shape ).to.not.be.undefined;
				expect ( "object" === ( typeof shape ) ).to.be.true;
				expect ( shape instanceof Sphere ).to.be.true;
			}
		} );

		it ( "Can draw the scene", function ()
		{
			expect ( device ).to.not.be.null;
			expect ( device ).to.not.be.undefined;
			if ( !device )
			{
				throw new Error ( "Device is not defined" );
			}
			expect ( device instanceof Device ).to.be.true;

			const canvas = document.createElement ( "canvas" );
			const context = device.getContext ( canvas );

			const dv = new DrawVisitor ( { context, device } );
			dv.visitLayers ( layers );
		} );
	} );
};
