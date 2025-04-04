///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Load and run the other tests.
//
///////////////////////////////////////////////////////////////////////////////

import { test as testNodes } from "./Nodes/index";
import { test as testShaders } from "./Shaders/index";
import { test as testState } from "./State/index";


describe ( "Scene", function ()
{
	testShaders();
	testState();
	testNodes();
} );
