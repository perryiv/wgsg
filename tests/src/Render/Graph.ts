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
	const layers: ILayerMap = new Map < number, ILayer > ();

	describe ( "Render Graph", function ()
	{
		this.beforeAll ( function ()
		{
			const cv = new CullVisitor();
			cv.layers = layers;
			
			const scene = buildScene();
			scene.accept ( cv );
		} );

		it ( "Can generate a render graph from a scene", function ()
		{
			expect ( layers.size ).to.be.equal ( 1 );
		} );

		it ( "The render graph has the expected structure", function ()
		{
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

			const name = "default_state";
			const states: IStateMap = pmd.states;
			expect ( states ).to.not.be.undefined;
			expect ( states instanceof Map ).to.be.true;
			expect ( states.size ).to.be.equal ( 1 );
			expect ( states.has ( name ) ).to.be.true;

			const sd: ( IStateData | undefined ) = states.get ( name );
			expect ( sd ).to.not.be.undefined;
			expect ( sd ).to.not.be.null;
			expect ( "object" === ( typeof sd ) ).to.be.true;

			// This if statement is to make the TypeScript compiler happy.
			if ( "undefined" === typeof sd )
			{
				throw new Error ( `State data for '${ name }' is not valid` );
			}

			const state: State = sd.state;
			expect ( state ).to.not.be.undefined;
			expect ( state instanceof State ).to.be.true;
			expect ( state.name ).to.be.equal ( name );

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
			const dv = new DrawVisitor();
			dv.visitLayers ( layers );
		} );
	} );
};
