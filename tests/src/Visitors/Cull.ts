///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the visitor classes.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { State } from "../../../lib/src/Scene/State/State";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import { makeRenderGraphInfo, Root, type StateGroup } from "../../../lib/src/Render";
import type { IMatrix44 } from "../../../lib/src/Types";
import {
	Group,
	ProjectionNode,
	type Shape,
	SphereNode as Sphere,
	Transform,
} from "../../../lib/src/Scene";
import {
	Cull as CullVisitor,
	Multiply,
	Visitor,
} from "../../../lib/src/Visitors";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Make a matrix that moves along x.
 * @param {number} x - How far to move.
 * @returns {IMatrix44} The matrix.
 */
const moveX = ( x: number ) : IMatrix44 =>
{
	return [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   x, 0, 0, 1 ];
};

/**
 * Cull the scene, and get the index of each shape's matrix in the render
 * graph.
 * @param {Group} scene - The scene.
 * @returns {object} The render graph root, and the matrix of each shape.
 */
const cullScene = ( scene: Group ) =>
{
	const root = new Root();
	const cv = new CullVisitor ( { root } );
	cv.renderGraphInfo = makeRenderGraphInfo();
	cv.reset();
	scene.accept ( cv );

	const matrices = new Map < Shape, number > ();
	root.forEachLayer ( ( layer ) =>
	{
		layer.forEachBin ( ( bin ) =>
		{
			bin.forEachPipeline ( ( pipeline ) =>
			{
				pipeline.forEachProjMatrixGroup ( ( pmg ) =>
				{
					pmg.forEachStateGroup ( ( sg: StateGroup ) =>
					{
						sg.forEachShape ( ( shape: Shape, _index: number, matrix: number ) =>
						{
							matrices.set ( shape, matrix );
						} );
					} );
				} );
			} );
		} );
	} );

	return { root, info: cv.renderGraphInfo, matrices };
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Cull", function ()
	{
		it ( "Should be able to make a cull visitor", function ()
		{
			const a = new CullVisitor ( { defaultState: new State() } );
			expect ( a instanceof Visitor ).to.be.true;
			expect ( a instanceof Multiply ).to.be.true;
			expect ( a.type ).to.be.equal ( "Visitors.Cull" );
		} );

		it ( "Should give the shapes under the same transform one matrix", function ()
		{
			const [ a, b, c, d, e ] = [ new Sphere(), new Sphere(), new Sphere(), new Sphere(), new Sphere() ];
			// a, then b and c under one transform, d under another, then e.
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			const t1 = new Transform ( moveX ( 1 ) );
			const t2 = new Transform ( moveX ( 2 ) );
			t1.addChild ( b );
			t1.addChild ( c );
			t2.addChild ( d );
			scene.addChild ( a );
			scene.addChild ( t1 );
			scene.addChild ( t2 );
			scene.addChild ( e );

			const { root, info, matrices } = cullScene ( scene );

			// The shapes outside the transforms share the first matrix.
			expect ( root.numMatrices ).to.equal ( 3 );
			expect ( info.numMatrices ).to.equal ( 3 );
			expect ( matrices.get ( a ) ).to.equal ( 0 );
			expect ( matrices.get ( b ) ).to.equal ( 1 );
			expect ( matrices.get ( c ) ).to.equal ( 1 );
			expect ( matrices.get ( d ) ).to.equal ( 2 );
			expect ( matrices.get ( e ) ).to.equal ( 0 );

			expect ( Array.from ( root.getMatrix ( 0 ) ) ).to.deep.equal ( moveX ( 0 ) );
			expect ( Array.from ( root.getMatrix ( 1 ) ) ).to.deep.equal ( moveX ( 1 ) );
			expect ( Array.from ( root.getMatrix ( 2 ) ) ).to.deep.equal ( moveX ( 2 ) );

			// They all have the same state, so they are in one state group.
			expect ( info.numStateGroups ).to.equal ( 1 );
			expect ( info.numShapes ).to.equal ( 5 );
		} );

		it ( "Should not add a matrix for a transform with no shapes", function ()
		{
			const a = new Sphere();
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			const empty = new Transform ( moveX ( 1 ) );
			empty.addChild ( new Group() );
			scene.addChild ( empty );
			scene.addChild ( a );

			const { root, matrices } = cullScene ( scene );
			expect ( root.numMatrices ).to.equal ( 1 );
			expect ( matrices.get ( a ) ).to.equal ( 0 );
		} );

		it ( "Should multiply nested transforms", function ()
		{
			const [ a, b ] = [ new Sphere(), new Sphere() ];
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			const outer = new Transform ( moveX ( 1 ) );
			const inner = new Transform ( moveX ( 2 ) );
			inner.addChild ( a );
			outer.addChild ( inner );
			outer.addChild ( b );
			scene.addChild ( outer );

			const { root, matrices } = cullScene ( scene );
			expect ( root.numMatrices ).to.equal ( 2 );
			expect ( Array.from ( root.getMatrix ( matrices.get ( a )! ) ) ).to.deep.equal ( moveX ( 3 ) );
			expect ( Array.from ( root.getMatrix ( matrices.get ( b )! ) ) ).to.deep.equal ( moveX ( 1 ) );
		} );

		it ( "Should put shapes with another projection in their own group", function ()
		{
			const [ a, b, c ] = [ new Sphere(), new Sphere(), new Sphere() ];
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			const projection = new ProjectionNode ( moveX ( 5 ) );
			projection.addChild ( b );
			scene.addChild ( a );
			scene.addChild ( projection );
			scene.addChild ( c );

			const { info, matrices } = cullScene ( scene );
			expect ( info.numProjMatrixGroups ).to.equal ( 2 );

			// The projection doesn't change the model-view matrix.
			expect ( info.numMatrices ).to.equal ( 1 );
			expect ( matrices.get ( b ) ).to.equal ( 0 );
		} );

		it ( "Should start over with the matrices when it resets", function ()
		{
			const a = new Sphere();
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			const t = new Transform ( moveX ( 1 ) );
			t.addChild ( a );
			scene.addChild ( t );

			const root = new Root();
			const cv = new CullVisitor ( { root } );
			cv.renderGraphInfo = makeRenderGraphInfo();
			for ( let i = 0; i < 3; ++i )
			{
				cv.reset();
				scene.accept ( cv );
				expect ( root.numMatrices ).to.equal ( 1 );
			}
		} );
	} );

	describe ( "Render graph matrices", function ()
	{
		it ( "Should keep many matrices, and forget them when cleared", function ()
		{
			const root = new Root();
			const info = makeRenderGraphInfo();
			for ( let i = 0; i < 100; ++i )
			{
				expect ( root.addMatrix ( info, moveX ( i ) ) ).to.equal ( i );
			}
			expect ( root.numMatrices ).to.equal ( 100 );
			expect ( info.numMatrices ).to.equal ( 100 );
			for ( let i = 0; i < 100; ++i )
			{
				expect ( Array.from ( root.getMatrix ( i ) ) ).to.deep.equal ( moveX ( i ) );
			}

			root.clear();
			expect ( root.numMatrices ).to.equal ( 0 );
			expect ( () => root.getMatrix ( 0 ) ).to.throw();
		} );

		it ( "Should reject an index that is not a matrix", function ()
		{
			const root = new Root();
			root.addMatrix ( makeRenderGraphInfo(), moveX ( 1 ) );
			expect ( () => root.getMatrix ( -1 ) ).to.throw();
			expect ( () => root.getMatrix ( 1 ) ).to.throw();
			expect ( () => root.getMatrix ( 0.5 ) ).to.throw();
		} );
	} );
};
