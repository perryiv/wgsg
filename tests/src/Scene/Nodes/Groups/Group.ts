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
import { Group, Node } from "../../../wgsg";


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

		it ( "Should be able to clear all child nodes", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );

			root.clear();
			expect ( root.size ).to.equal ( 0 );
		} );

		it ( "Should be able to remove all child nodes", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );

			root.removeChild ( 0 );
			expect ( root.size ).to.equal ( 1 );

			root.removeChild ( 0 );
			expect ( root.size ).to.equal ( 0 );
		} );

		it ( "Should be able to get child nodes", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 2 );

			expect ( root.getChild ( 0 ) ).to.equal ( child0 );
			expect ( root.getChild ( 1 ) ).to.equal ( child1 );
			expect ( root.getChild ( 2 ) ).to.be.null;
		} );

		it ( "Can traverse the group", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();
			const child2 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );
			root.addChild ( child2 );

			child0.addChild ( new Group() );
			child0.addChild ( new Group() );
			child0.addChild ( new Group() );
			child0.addChild ( new Group() );
			child1.addChild ( new Group() );
			child1.addChild ( new Group() );
			child1.addChild ( new Group() );
			child1.addChild ( new Group() );
			child2.addChild ( new Group() );
			child2.addChild ( new Group() );
			child2.addChild ( new Group() );
			child2.addChild ( new Group() );

			let count = 0;
			root.traverse ( () => { ++count; } );
			expect ( count ).to.equal ( 16 );
		} );

		it ( "Should be initially dirty", function ()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );

			expect ( root.dirty ).to.be.true;
			expect ( child0.dirty ).to.be.true;
			expect ( child1.dirty ).to.be.true;
		} );

		it ( "Can change the dirty state of a group", function ()
		{
			const group = new Group();
			expect ( group.dirty ).to.be.true;

			group.dirty = false;
			expect ( group.dirty ).to.be.false;
		} );

		it ( "Can change the dirty state of a child node", function()
		{
			const root = new Group();
			const child0 = new Group();
			const child1 = new Group();

			root.addChild ( child0 );
			root.addChild ( child1 );

			const child00 = new Group();
			const child01 = new Group();

			child0.addChild ( child00 );
			child0.addChild ( child01 );

			const child10 = new Group();
			const child11 = new Group();

			child1.addChild ( child10 );
			child1.addChild ( child11 );

			expect ( root.dirty ).to.be.true;
			expect ( child0.dirty ).to.be.true;
			expect ( child1.dirty ).to.be.true;
			expect ( child00.dirty ).to.be.true;
			expect ( child01.dirty ).to.be.true;
			expect ( child10.dirty ).to.be.true;
			expect ( child11.dirty ).to.be.true;

			let count = 0;
			root.traverse ( ( child: Node ) =>
			{
				expect ( child.dirty ).to.be.true;
				child.dirty = false;
				++count;
			} );
			expect ( count ).to.equal ( 7 );

			expect ( root.dirty ).to.be.false;
			expect ( child0.dirty ).to.be.false;
			expect ( child1.dirty ).to.be.false;
			expect ( child00.dirty ).to.be.false;
			expect ( child01.dirty ).to.be.false;
			expect ( child10.dirty ).to.be.false;
			expect ( child11.dirty ).to.be.false;

			child00.dirty = true;

			expect ( root.dirty ).to.be.true;
			expect ( child0.dirty ).to.be.true;
			expect ( child1.dirty ).to.be.false;
			expect ( child00.dirty ).to.be.true;
			expect ( child01.dirty ).to.be.false;
			expect ( child10.dirty ).to.be.false;
			expect ( child11.dirty ).to.be.false;
		} );
	} );
};
