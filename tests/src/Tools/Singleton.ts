///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the singleton helper.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { makeSingleton } from "../../../lib/src/Tools/Singleton";


///////////////////////////////////////////////////////////////////////////////
//
//	A class with one instance, which counts how many are made and destroyed.
//
///////////////////////////////////////////////////////////////////////////////

class Counted
{
	public static made = 0;
	public static destroyed = 0;
	static readonly #singleton = makeSingleton ( () => new Counted() );

	protected constructor ()
	{
		++Counted.made;
	}

	public static get instance () : Counted
	{
		return Counted.#singleton.get();
	}

	public static destroy () : void
	{
		Counted.#singleton.destroy();
	}

	public destroy () : void
	{
		++Counted.destroyed;
	}
}


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Singleton", function ()
	{
		it ( "Should make the instance the first time it's needed, and only once", function ()
		{
			expect ( Counted.made ).to.equal ( 0 );
			const a = Counted.instance;
			const b = Counted.instance;
			expect ( a ).to.equal ( b );
			expect ( Counted.made ).to.equal ( 1 );
		} );

		it ( "Should destroy the instance, and make a new one after that", function ()
		{
			const a = Counted.instance;
			Counted.destroy();
			expect ( Counted.destroyed ).to.equal ( 1 );

			// Destroying again does nothing, because there is no instance.
			Counted.destroy();
			expect ( Counted.destroyed ).to.equal ( 1 );

			const b = Counted.instance;
			expect ( b ).to.not.equal ( a );
			expect ( Counted.made ).to.equal ( 2 );
		} );

		it ( "Should give each shader class one instance", function ()
		{
			expect ( FlatShading.instance ).to.equal ( FlatShading.instance );
			expect ( FlatShading.instance ).to.be.instanceOf ( FlatShading );
		} );
	} );
};
