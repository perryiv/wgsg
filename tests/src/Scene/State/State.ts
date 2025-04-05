///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for state.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { State } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

describe ( "State", function ()
{
	it ( "Should be able to make a state", function ()
	{
		const state = new State();
		expect ( state ).to.exist;
		expect ( state instanceof State ).to.be.true;
	} );
} );
