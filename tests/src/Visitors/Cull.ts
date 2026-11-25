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
import { Frustum, ViewFrustum } from "../../../lib/src/Math";
import { mat4 } from "gl-matrix";
import { State } from "../../../lib/src/Scene/State/State";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import { makeRenderGraphInfo, Root, type StateGroup } from "../../../lib/src/Render";
import type { IMatrix44 } from "../../../lib/src/Types";
import {
	Arrays,
	Geometry,
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
 * @param {Frustum | null} [frustum] - The frustum to cull with, if any.
 * @returns {object} The render graph root, and the matrix of each shape.
 */
const cullScene = ( scene: Group, frustum: ( Frustum | null ) = null ) =>
{
	const root = new Root();
	const cv = new CullVisitor ( { root } );
	cv.renderGraphInfo = makeRenderGraphInfo();
	cv.frustum = frustum;
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
	describe ( "Frustum culling", function ()
	{
		// The frustum of the identity projection: x and y from -1 to 1, and z
		// from 0 to 1.
		const view = () => new ViewFrustum();

		const ball = ( x: number, y = 0, r = 0.1 ) : Sphere =>
		{
			return new Sphere ( { center: [ x, y, 0.5 ], radius: r } );
		};

		const makeScene = () : Group =>
		{
			const scene = new Group();
			scene.state = SolidColor.makeState ( { topology: "triangle-list" } );
			return scene;
		};

		it ( "Should not cull without a frustum", function ()
		{
			const scene = makeScene();
			const far = ball ( 5 );
			scene.addChild ( far );
			const { info, matrices } = cullScene ( scene );
			expect ( matrices.has ( far ) ).to.be.true;
			expect ( info.numCulled ).to.equal ( 0 );
		} );

		it ( "Should leave out the shapes that are outside, and count them", function ()
		{
			const scene = makeScene();
			const [ inside, outside, crossing ] = [ ball ( 0 ), ball ( 5 ), ball ( 0.95 ) ];
			scene.addChild ( inside );
			scene.addChild ( outside );
			scene.addChild ( crossing );
			const { info, matrices } = cullScene ( scene, view() );
			expect ( matrices.has ( inside ) ).to.be.true;
			expect ( matrices.has ( crossing ) ).to.be.true;
			expect ( matrices.has ( outside ) ).to.be.false;
			expect ( info.numShapes ).to.equal ( 2 );
			expect ( info.numCulled ).to.equal ( 1 );
		} );

		it ( "Should skip a whole group that is outside, and count it once", function ()
		{
			const scene = makeScene();
			const group = new Group();
			const children = [ ball ( 5 ), ball ( 5.2 ), ball ( 5.4 ) ];
			children.forEach ( ( child ) => group.addChild ( child ) );
			scene.addChild ( group );
			scene.addChild ( ball ( 0 ) );
			const { info, matrices } = cullScene ( scene, view() );
			children.forEach ( ( child ) => expect ( matrices.has ( child ) ).to.be.false );
			expect ( info.numShapes ).to.equal ( 1 );
			expect ( info.numCulled ).to.equal ( 1 );
		} );

		it ( "Should test a transform's bounds, and its children in its coordinates", function ()
		{
			const scene = makeScene();

			// Moved out of view.
			const away = ball ( 0 );
			const t1 = new Transform ( moveX ( 5 ) );
			t1.addChild ( away );

			// Moved into view.
			const back = ball ( 5 );
			const t2 = new Transform ( moveX ( -5 ) );
			t2.addChild ( back );

			// Moved out and back in by nested transforms.
			const nested = ball ( 0 );
			const outer = new Transform ( moveX ( 3 ) );
			const inner = new Transform ( moveX ( -3 ) );
			inner.addChild ( nested );
			outer.addChild ( inner );

			// One child in view and one out, under the same transform.
			const kept = ball ( -2 );
			const dropped = ball ( 2 );
			const t3 = new Transform ( moveX ( 2 ) );
			t3.addChild ( kept );
			t3.addChild ( dropped );

			[ t1, t2, outer, t3 ].forEach ( ( t ) => scene.addChild ( t ) );
			const { info, matrices } = cullScene ( scene, view() );
			expect ( matrices.has ( away ) ).to.be.false;
			expect ( matrices.has ( back ) ).to.be.true;
			expect ( matrices.has ( nested ) ).to.be.true;
			expect ( matrices.has ( kept ) ).to.be.true;
			expect ( matrices.has ( dropped ) ).to.be.false;
			expect ( info.numCulled ).to.equal ( 2 );
		} );

		it ( "Should use a shape's box when its sphere crosses the frustum", function ()
		{
			// A long, thin rod along x. Its sphere is as wide as it is long.
			const makeRod = ( y: number ) : Geometry =>
			{
				const rod = new Geometry ( {
					points: new Float32Array ( [ -3, y, 0.5,   3, y, 0.5,   0, y + 0.05, 0.5 ] ),
					primitives: new Arrays ( { topology: "triangle-list", count: 3 } ),
				} );
				return rod;
			};

			// Just above the top of the view: the sphere crosses it, the box doesn't.
			const above = makeRod ( 1.05 );
			expect ( view().classifySphere ( above.bounds ) ).to.equal ( "intersects" );
			expect ( view().classifyBox ( above.box ) ).to.equal ( "outside" );

			// Just below the top, crossing the sides.
			const below = makeRod ( 0.9 );

			const scene = makeScene();
			scene.addChild ( above );
			scene.addChild ( below );
			const { info, matrices } = cullScene ( scene, view() );
			expect ( matrices.has ( above ) ).to.be.false;
			expect ( matrices.has ( below ) ).to.be.true;
			expect ( info.numCulled ).to.equal ( 1 );
		} );

		it ( "Should never cull nodes that don't add to the bounds, even under a group that is outside", function ()
		{
			const scene = makeScene();

			// A grid out of view, which is never culled.
			const grid = ball ( 50 );
			grid.addsToBounds = false;

			// A grid in view, two levels under a group that is out of view.
			const deepGrid = ball ( 0 );
			deepGrid.addsToBounds = false;
			const far = ball ( 5 );
			const group = new Group();
			const middle = new Group();
			middle.addChild ( deepGrid );
			middle.addChild ( ball ( 5.5 ) );
			group.addChild ( far );
			group.addChild ( middle );

			scene.addChild ( grid );
			scene.addChild ( group );
			expect ( group.hasNodesOutsideBounds ).to.be.true;

			const { matrices } = cullScene ( scene, view() );
			expect ( matrices.has ( grid ) ).to.be.true;
			expect ( matrices.has ( deepGrid ) ).to.be.true;
			expect ( matrices.has ( far ) ).to.be.false;
		} );

		it ( "Should cull what is under a projection node with its own frustum", function ()
		{
			// The projection sees x and y from -10 to 10.
			const ortho = Array.from ( mat4.orthoZO ( mat4.create(), -10, 10, -10, 10, -1, 1 ) ) as IMatrix44;
			const projection = new ProjectionNode ( ortho );
			const seen = ball ( 5 );
			const unseen = ball ( 50 );
			projection.addChild ( seen );
			projection.addChild ( unseen );

			const scene = makeScene();
			scene.addChild ( projection );
			const { matrices } = cullScene ( scene, view() );
			expect ( matrices.has ( seen ) ).to.be.true;
			expect ( matrices.has ( unseen ) ).to.be.false;
		} );

		it ( "Should start over with the frustum it was given each traversal", function ()
		{
			const scene = makeScene();
			const t = new Transform ( moveX ( -5 ) );
			const moved = ball ( 5 );
			t.addChild ( moved );
			scene.addChild ( t );

			const root = new Root();
			const cv = new CullVisitor ( { root } );
			cv.renderGraphInfo = makeRenderGraphInfo();
			const given = view();
			cv.frustum = given;
			for ( let i = 0; i < 3; ++i )
			{
				cv.renderGraphInfo = makeRenderGraphInfo();
				cv.reset();
				scene.accept ( cv );
				expect ( cv.renderGraphInfo.numShapes ).to.equal ( 1 );
				expect ( cv.renderGraphInfo.numCulled ).to.equal ( 0 );
			}

			// It made its own copy, and puts it back.
			expect ( cv.frustum ).to.not.equal ( given );
			const kept = cv.frustum;
			expect ( kept ).to.not.be.null;
			expect ( kept?.getPlane ( 0 ).coefficients ).to.deep.equal ( given.getPlane ( 0 ).coefficients );
		} );
	} );
};
