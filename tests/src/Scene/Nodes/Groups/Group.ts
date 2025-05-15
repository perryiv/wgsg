///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for groups.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Group } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Group", function ()
	{
		it ( "Should be able to make a group", function ()
		{
			const group = new Group();
			expect ( group ).to.exist;
			expect ( group instanceof Group ).to.be.true;
		} );

		it ( "Default group should have zero children", function ()
		{
			const group = new Group();
			expect ( group.size ).to.equal ( 0 );
		} );

		it ( "Group should report correct type", function ()
		{
			const group = new Group();
			expect ( group.type ).to.equal ( "Scene.Nodes.Groups.Group" );
		} );

		it ( "Should be able to add child nodes", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			expect ( root.size ).to.equal ( 1 );
			expect ( child0.hasParent ( root.id ) ).to.be.true;

			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );
			expect ( child1.hasParent ( root.id ) ).to.be.true;
		} );

		it ( "Should be able to remove child nodes", function ()
		{
			const root = new Group();
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
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );
			expect ( child0.hasParent ( root.id ) ).to.be.true;
			expect ( child1.hasParent ( root.id ) ).to.be.true;

			expect ( root.removeChild ( 1 ) ).to.be.true;
			expect ( root.size ).to.equal ( 1 );
			expect ( child0.hasParent ( root.id ) ).to.be.true;
			expect ( child1.hasParent ( root.id ) ).to.be.false;
		} );

		it ( "Removing node at invalid index just returns false", function ()
		{
			const root = new Group();
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

		it ( "Adding the same node twice to a group should throw", function ()
		{
			const root = new Group();
			const child = new Group();

			root.addChild ( child );
			expect ( root.size ).to.equal ( 1 );

			const message = "Given group is already a parent of this node";
			expect ( () => { root.addChild ( child ); } ).to.throw ( message );
			expect ( root.size ).to.equal ( 1 );
		} );
	} );
};
