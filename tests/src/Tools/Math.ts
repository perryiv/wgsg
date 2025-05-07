///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for math functions.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	isFiniteNumber,
	isPositiveFiniteNumber,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Math Functions", function ()
	{
		it ( "Test isFiniteNumber", function ()
		{
			expect ( isFiniteNumber (  1 ) ).to.be.true;
			expect ( isFiniteNumber (  0 ) ).to.be.true;
			expect ( isFiniteNumber ( -1 ) ).to.be.true;
			expect ( isFiniteNumber (  Number.MAX_VALUE ) ).to.be.true;
			expect ( isFiniteNumber ( -Number.MAX_VALUE ) ).to.be.true;
			expect ( isFiniteNumber (  Number.MAX_SAFE_INTEGER ) ).to.be.true;
			expect ( isFiniteNumber ( -Number.MAX_SAFE_INTEGER ) ).to.be.true;
			expect ( isFiniteNumber (  Number.EPSILON ) ).to.be.true;
			expect ( isFiniteNumber ( -Number.EPSILON ) ).to.be.true;
			expect ( isFiniteNumber (  Number.NEGATIVE_INFINITY ) ).to.be.false;
			expect ( isFiniteNumber (  Number.POSITIVE_INFINITY ) ).to.be.false;
			expect ( isFiniteNumber (  Number.NaN ) ).to.be.false;
			expect ( isFiniteNumber ( "a" ) ).to.be.false;
			expect ( isFiniteNumber ( "1" ) ).to.be.false;
			expect ( isFiniteNumber ( {} ) ).to.be.false;
			expect ( isFiniteNumber ( [] ) ).to.be.false;
			expect ( isFiniteNumber ( Symbol ( "hi" ) ) ).to.be.false;
		} );

		it ( "Test isPositiveFiniteNumber", function ()
		{
			expect ( isPositiveFiniteNumber (  1 ) ).to.be.true;
			expect ( isPositiveFiniteNumber (  0 ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( -1 ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.MAX_VALUE ) ).to.be.true;
			expect ( isPositiveFiniteNumber ( -Number.MAX_VALUE ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.MAX_SAFE_INTEGER ) ).to.be.true;
			expect ( isPositiveFiniteNumber ( -Number.MAX_SAFE_INTEGER ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.EPSILON ) ).to.be.true;
			expect ( isPositiveFiniteNumber ( -Number.EPSILON ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.NEGATIVE_INFINITY ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.POSITIVE_INFINITY ) ).to.be.false;
			expect ( isPositiveFiniteNumber (  Number.NaN ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( "a" ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( "1" ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( {} ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( [] ) ).to.be.false;
			expect ( isPositiveFiniteNumber ( Symbol ( "hi" ) ) ).to.be.false;
		} );
	} );
};
