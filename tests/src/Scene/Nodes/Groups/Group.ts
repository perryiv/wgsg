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
	describe ( "Group Class", function ()
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

		it ( "Should be able to add child nodes", function ()
		{
			const root = new Group();
			const child1 = new Group();
			const child2 = new Group();

			root.addChild ( child1 );
			expect ( root.size ).to.equal ( 1 );
			expect ( child1.hasParent ( root ) ).to.be.true;

			root.addChild ( child2 );
			expect ( root.size ).to.equal ( 2 );
			expect ( child2.hasParent ( root ) ).to.be.true;
		} );

		it ( "Should be able to remove child nodes", function ()
		{
			const group = new Group();
			group.addChild ( new Group() );
			group.addChild ( new Group() );
			expect ( group.size ).to.equal ( 2 );
			group.removeChild ( 0 );
			expect ( group.size ).to.equal ( 1 );
			group.addChild ( new Group() );
			group.addChild ( new Group() );
			expect ( group.size ).to.equal ( 3 );
			group.clear();
		} );
	} );
};
