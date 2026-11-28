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

import { test as testEdges } from "./Edges";
import { test as testLighting } from "./Lighting";
import { test as testObjectMatrices } from "./ObjectMatrices";
import { test as testShaders } from "./Shaders";
import { test as testUniformPool } from "./UniformPool";
import { test as testVertexColors } from "./VertexColors";

describe ( "Shaders", function ()
{
	testShaders();
	testLighting();
	testEdges();
	testUniformPool();
	testObjectMatrices();
	testVertexColors();
} );
