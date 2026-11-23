///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for geometry.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	Arrays,
	Geometry,
	Group,
	Indexed,
	Node,
	Shape,
	State,
} from "../../../../../lib/src/Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

// Three points on the x axis, at 0, 2, and 6.
const POINTS = [ 0, 0, 0,   2, 0, 0,   6, 0, 0 ];

/**
 * Make a geometry with the points above and one list of primitives.
 * @param {Indexed | Arrays} primitives The primitives.
 * @returns {Geometry} The geometry.
 */
const makeGeometry = ( primitives: ( Indexed | Arrays ) ) : Geometry =>
{
	return new Geometry ( { points: POINTS, primitives } );
};

/**
 * Get the center and radius of the node's bounds. The points are on the x
 * axis, so the center is half way between the smallest and largest x that
 * the primitives use, and the radius is half of the distance between them.
 * @param {Node} node The node.
 * @returns {number[]} The center's x value and the radius.
 */
const getBounds = ( node: Node ) : number[] =>
{
	const { valid, center, radius } = node.bounds;
	expect ( valid ).to.be.true;
	expect ( center[1] ).to.equal ( 0 );
	expect ( center[2] ).to.equal ( 0 );
	return [ center[0], radius ];
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Geometry", function ()
	{
		it ( "Should be able to make a shape", function ()
		{
			const shape = new Geometry();
			expect ( shape ).to.exist;
			expect ( shape instanceof Geometry ).to.be.true;
			expect ( shape instanceof Shape ).to.be.true;
			expect ( shape instanceof Node ).to.be.true;
		} );

		it ( "Default shape should have null state", function ()
		{
			const geom = new Geometry();
			expect ( geom.state ).to.be.null;
		} );

		it ( "Should be able to set the state", function ()
		{
			const geom = new Geometry();
			geom.state = new State();
			expect ( geom.state ).to.exist;
			expect ( geom.state instanceof State ).to.be.true;
		} );

		it ( "Should be able to construct with state", function ()
		{
			const state = new State();
			const geom = new Geometry ( { state } );
			expect ( geom.state ).to.exist;
			expect ( geom.state instanceof State ).to.be.true;
			expect ( geom.state ).to.equal ( state );
		} );

		describe ( "Bounds", function ()
		{
			it ( "Should only use the points that the primitives use", function ()
			{
				const geom = makeGeometry ( new Indexed ( { topology: "line-list", indices: [ 0, 1 ] } ) );
				expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
			} );

			it ( "Should update when the points are set", function ()
			{
				const geom = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
				expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
				geom.points = [ 0, 0, 0,   4, 0, 0 ];
				expect ( getBounds ( geom ) ).to.deep.equal ( [ 2, 2 ] );
			} );

			it ( "Should update when the primitives are set", function ()
			{
				const geom = makeGeometry ( new Indexed ( { topology: "line-list", indices: [ 0, 1 ] } ) );
				expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
				geom.primitives = new Indexed ( { topology: "line-list", indices: [ 0, 2 ] } );
				expect ( getBounds ( geom ) ).to.deep.equal ( [ 3, 3 ] );
			} );

			it ( "Should be invalid when the points or primitives are set to null", function ()
			{
				const geom = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
				expect ( geom.bounds.valid ).to.be.true;
				geom.points = null;
				expect ( geom.bounds.valid ).to.be.false;

				const other = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
				expect ( other.bounds.valid ).to.be.true;
				other.primitives = null;
				expect ( other.bounds.valid ).to.be.false;
			} );

			it ( "Should update the parent's bounds when the points are set", function ()
			{
				const geom = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
				const group = new Group();
				group.addChild ( geom );
				expect ( getBounds ( group ) ).to.deep.equal ( [ 1, 1 ] );
				geom.points = [ 0, 0, 0,   4, 0, 0 ];
				expect ( getBounds ( group ) ).to.deep.equal ( [ 2, 2 ] );
			} );

			it ( "Should update the parent's bounds when the primitives are set", function ()
			{
				const geom = makeGeometry ( new Indexed ( { topology: "line-list", indices: [ 0, 1 ] } ) );
				const group = new Group();
				group.addChild ( geom );
				expect ( getBounds ( group ) ).to.deep.equal ( [ 1, 1 ] );
				geom.primitives = new Indexed ( { topology: "line-list", indices: [ 1, 2 ] } );
				expect ( getBounds ( group ) ).to.deep.equal ( [ 4, 2 ] );
			} );

			// These changes don't reach the geometry, so it has to be told.
			describe ( "Changes that need dirtyBounds()", function ()
			{
				it ( "Should update after setting the values of the points", function ()
				{
					const geom = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
					geom.points!.values = new Float32Array ( [ 0, 0, 0,   4, 0, 0,   6, 0, 0 ] );
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
					geom.dirtyBounds();
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 2, 2 ] );
				} );

				it ( "Should update after changing the values in place", function ()
				{
					const geom = makeGeometry ( new Arrays ( { topology: "line-list", first: 0, count: 2 } ) );
					const group = new Group();
					group.addChild ( geom );
					expect ( getBounds ( group ) ).to.deep.equal ( [ 1, 1 ] );
					geom.points!.values![3] = 4;
					geom.dirtyBounds();
					expect ( getBounds ( group ) ).to.deep.equal ( [ 2, 2 ] );
				} );

				it ( "Should update after setting the indices", function ()
				{
					const indexed = new Indexed ( { topology: "line-list", indices: [ 0, 1 ] } );
					const geom = makeGeometry ( indexed );
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
					indexed.indices = [ 0, 2 ];
					geom.dirtyBounds();
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 3, 3 ] );
				} );

				it ( "Should update after changing the first and count", function ()
				{
					const arrays = new Arrays ( { topology: "line-list", first: 0, count: 2 } );
					const geom = makeGeometry ( arrays );
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 1, 1 ] );
					arrays.first = 1;
					geom.dirtyBounds();
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 4, 2 ] );
					arrays.count = 1;
					geom.dirtyBounds();
					expect ( getBounds ( geom ) ).to.deep.equal ( [ 2, 0 ] );
				} );
			} );
		} );
	} );
};
