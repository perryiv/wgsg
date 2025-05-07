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

void ( async () =>
{
	mocha.setup ( "bdd" );
	mocha.checkLeaks();

	// This one should be first.
	await import ( "./Tools" );

	// These can be in any order.
	await import ( "./Base" );
	await import ( "./Projections" );
	await import ( "./Scene" );
	await import ( "./Types" );
	await import ( "./Viewers" );
	await import ( "./Visitors" );

	mocha.run();
} ) ();
