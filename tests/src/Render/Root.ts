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
	Bin,
	Cull as CullVisitor,
	Device,
	Draw as DrawVisitor,
	Group,
	IDENTITY_MATRIX,
	Layer,
	ModelMatrixGroup,
	Pipeline,
	ProjMatrixGroup,
	Root,
	Shape,
	SolidColor,
	Sphere,
	State,
	StateGroup,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Build a scene for testing.
//
///////////////////////////////////////////////////////////////////////////////

function buildScene ()
{
	const root = new Group();
	root.state = new State ( {
		name: "State for test scene that contains four spheres",
		shader: SolidColor.instance
	} );
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
	let scene: ( Group | null ) = null;
	let cv: ( CullVisitor | null ) = null;
	const root = new Root();

	describe ( "Render Graph", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Cull visitor has expected properties", function ()
		{
			cv = new CullVisitor ( { root } );

			expect ( cv ).to.exist;
			expect ( cv instanceof CullVisitor ).to.be.true;
			expect ( cv.defaultState ).to.exist;
			expect ( cv.defaultState instanceof State ).to.be.true;
			expect ( cv.defaultState.name ).to.be.equal ( "Cull visitor default state" );
			expect ( cv.defaultState.layer ).to.be.equal ( 0 );
			expect ( cv.defaultState.bin ).to.be.equal ( 0 );
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
			expect ( scene ).to.be.instanceof ( Group );
			scene = scene!;

			expect ( root.numLayers ).to.be.equal ( 1 );

			const layer = root.getLayer ( 0 );
			expect ( layer instanceof Layer ).to.be.true;
			expect ( layer.numBins ).to.be.equal ( 1 );

			const bin = layer.getBin ( 0 );
			expect ( bin instanceof Bin ).to.be.true;
			expect ( bin.numPipelines ).to.be.equal ( 1 );

			const { state } = scene;
			expect ( state ).to.exist;
			expect ( state instanceof State ).to.be.true;

			const { shader } = state!;
			expect ( shader ).to.exist;
			expect ( shader instanceof SolidColor ).to.be.true;

			const pipeline = bin.getPipeline ( state! );
			expect ( pipeline instanceof Pipeline ).to.be.true;
			expect ( pipeline.numProjMatrices ).to.be.equal ( 1 );

			const pmg = pipeline.getProjMatrixGroup ( IDENTITY_MATRIX );
			expect ( pmg instanceof ProjMatrixGroup ).to.be.true;
			expect ( pmg.numModelMatrices ).to.be.equal ( 1 );
			expect ( pmg.matrix instanceof Array ).to.be.true;
			expect ( pmg.matrix.length ).to.be.equal ( 16 );
			expect ( pmg.matrix ).to.be.deep.equal ( IDENTITY_MATRIX );

			const mmg = pmg.getModelMatrixGroup ( IDENTITY_MATRIX );
			expect ( mmg instanceof ModelMatrixGroup ).to.be.true;
			expect ( mmg.numStateGroups ).to.be.equal ( 1 );
			expect ( mmg.matrix instanceof Array ).to.be.true;
			expect ( mmg.matrix.length ).to.be.equal ( 16 );
			expect ( mmg.matrix ).to.be.deep.equal ( IDENTITY_MATRIX );

			mmg.forEachStateGroup ( ( sg: StateGroup ) =>
			{
				expect ( sg.numShapes ).to.be.equal ( 4 );

				sg.forEachShape ( ( shape: Shape, index: number ) =>
				{
					expect ( index ).to.be.greaterThanOrEqual ( 0 );
					expect ( index ).to.be.lessThan ( 4 );

					expect ( "object" === ( typeof shape ) ).to.be.true;
					expect ( shape instanceof Sphere ).to.be.true;

					const sphere = ( shape as Sphere );
					expect ( sphere.radius ).to.be.equal ( 1 );
					expect ( sphere.center ).to.be.deep.equal ( [ index * 2, 0, 0 ] );
				} );
			} );
		} );

		it ( "Can draw the scene", function ()
		{
			expect ( Device.instance instanceof Device ).to.be.true;

			const canvas = document.createElement ( "canvas" );
			const context = Device.instance.getConfiguredContext ( canvas );

			const dv = new DrawVisitor ( { context } );
			dv.draw ( root );
		} );
	} );
};
