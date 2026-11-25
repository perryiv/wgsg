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

import { test as testBox } from "./Box";
import { test as testFrustum } from "./Frustum";
import { test as testPlane } from "./Plane";
import { test as testSphere } from "./Sphere";
import { test as testValidate } from "./Validate";

describe ( "Math", function ()
{
	testBox();
	testPlane();
	testFrustum();
	testSphere();
	testValidate();
} );
