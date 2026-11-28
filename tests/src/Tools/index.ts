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
import { test as testColor } from "./Color";
import { test as testConstants } from "./Constants";
import { test as testDevice } from "./Device";
import { test as testFunctions } from "./Functions";
import { test as testThree } from "./Three";

describe ( "Tools", function ()
{
	testBits();
	testColor();
	testConstants();
	testDevice();
	testFunctions();
	testThree();
} );
