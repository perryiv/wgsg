///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for transforms.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Group, IDENTITY_MATRIX, Matrix44, Transform } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Transform Class", function ()
	{
		it ( "Should be able to make a transform", function ()
		{
			const tm = new Transform();
			expect ( tm ).to.exist;
			expect ( tm instanceof Transform ).to.be.true;
		} );

		it ( "Default transform should have zero children", function ()
		{
			const tm = new Transform();
			expect ( tm.size ).to.equal ( 0 );
		} );

		it ( "Transform should report correct type", function ()
		{
			const tr = new Transform();
			expect ( tr.type ).to.equal ( "Transform" );
		} );

		it ( "Should be able to add child nodes", function ()
		{
			const root = new Transform();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			expect ( root.size ).to.equal ( 1 );
			expect ( child0.hasParent ( root ) ).to.be.true;

			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );
			expect ( child1.hasParent ( root ) ).to.be.true;
		} );

		it ( "Should be able to remove child nodes", function ()
		{
			const root = new Transform();
			const child0 = new Group();
			const child1 = new Group();
			const child2 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );

			root.removeChild ( 0 );
			expect ( root.size ).to.equal ( 1 );

			root.addChild ( child0 );
			root.addChild ( child2 );
			expect ( root.size ).to.equal ( 3 );

			root.clear();
			expect ( root.size ).to.equal ( 0 );
		} );

		it ( "Removing child node should also remove parent relationship", function ()
		{
			const root = new Transform();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );
			expect ( child0.hasParent ( root ) ).to.be.true;
			expect ( child1.hasParent ( root ) ).to.be.true;

			expect ( root.removeChild ( 1 ) ).to.be.true;
			expect ( root.size ).to.equal ( 1 );
			expect ( child0.hasParent ( root ) ).to.be.true;
			expect ( child1.hasParent ( root ) ).to.be.false;
		} );

		it ( "Removing node at invalid index just returns false", function ()
		{
			const root = new Transform();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );

			expect ( root.removeChild ( -1 ) ).to.be.false;
			expect ( root.size ).to.equal ( 2 );

			expect ( root.removeChild ( 2 ) ).to.be.false;
			expect ( root.size ).to.equal ( 2 );

			expect ( root.removeChild ( 0 ) ).to.be.true;
			expect ( root.size ).to.equal ( 1 );
		} );

		it ( "Adding the same node twice to a transform should throw", function ()
		{
			const root = new Transform();
			const child = new Group();

			root.addChild ( child );
			expect ( root.size ).to.equal ( 1 );

			const message = "Given group is already a parent of this node";
			expect ( () => { root.addChild ( child ); } ).to.throw ( message );
			expect ( root.size ).to.equal ( 1 );
		} );

		it ( "Transform matrix should always be valid", function ()
		{
			const root = new Transform();
			expect ( ( root.matrix as Matrix44 ).length ).to.equal ( 16 ); // TODO: Why is the "as" necessary?
			expect ( root.matrix ).to.be.deep.equal ( IDENTITY_MATRIX );
			expect ( root.valid ).to.be.true;

			expect ( () => { root.matrix = [ 0, 1, 2, 3 ]; } ).to.throw (
				"Invalid array length 4 for transformation matrix, should be 16"
			);
			expect ( root.valid ).to.be.true;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			root.matrix[0] = "0";
			expect ( ( root.matrix as Matrix44 ).length ).to.equal ( 16 ); // TODO: Why is the "as" necessary?
			expect ( root.valid ).to.be.false;
		} );
	} );
};
