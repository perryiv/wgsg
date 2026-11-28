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

import { test as testBits } from "./Bits";
import { test as testBox } from "./Box";
import { test as testColor } from "./Color";
import { test as testConstants } from "./Constants";
import { test as testFrustum } from "./Frustum";
import { test as testPlane } from "./Plane";
import { test as testSphere } from "./Sphere";
import { test as testValidate } from "./Validate";

describe ( "Math", function ()
{
	testBits();
	testBox();
	testColor();
	testConstants();
	testPlane();
	testFrustum();
	testSphere();
	testValidate();
} );
