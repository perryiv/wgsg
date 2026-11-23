///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test that nothing makes scene objects before the tests run.
//
//	In developer builds each class counts its own ids, starting at 1. All the
//	test files are imported before any test runs, so if this runs first and
//	the first object of a class does not get id 1, then something made one
//	when the library or a test file was imported. These tests have to run
//	before all the others, so they are registered first in index.ts.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { DEVELOPER_BUILD } from "../../lib/src/Tools/Environment";
import {
	Geometry,
	Group,
	SphereNode,
	State,
	Transform,
} from "../../lib/src/Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Creation order", function ()
	{
		const cases: [ string, () => { id: number } ][] = [
			[ "Group", () => new Group() ],
			[ "Transform", () => new Transform() ],
			[ "Geometry", () => new Geometry() ],
			[ "Sphere", () => new SphereNode() ],
			[ "State", () => new State() ],
		];

		for ( const [ name, make ] of cases )
		{
			it ( `Should make the first ${name} with id 1, then 2`, function ()
			{
				// Production builds use one counter for all classes.
				if ( !DEVELOPER_BUILD )
				{
					this.skip();
				}

				expect ( make().id ).to.equal ( 1 );
				expect ( make().id ).to.equal ( 2 );
			} );
		}
	} );
};
