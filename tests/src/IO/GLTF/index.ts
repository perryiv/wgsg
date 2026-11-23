///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Load and run the other tests.
//
///////////////////////////////////////////////////////////////////////////////

import { test as testAccessors } from "./Accessors";
import { test as testContainer } from "./Container";
import { test as testTransforms } from "./Transforms";
import { test as testBuilder } from "./Builder";

export function test ()
{
	describe ( "GLTF", function ()
	{
		testContainer();
		testAccessors();
		testTransforms();
		testBuilder();
	} );
};
