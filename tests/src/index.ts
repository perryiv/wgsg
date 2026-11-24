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
	mocha.timeout ( 0 ); // Disable timeouts.

	// This has to be first. It checks that nothing made scene objects when
	// the library and the test files were imported.
	const { test: testCreationOrder } = await import ( "./CreationOrder" );
	testCreationOrder();

	// This one should be next.
	await import ( "./Tools" );

	// These can be in any order.
	await import ( "./Algorithms" );
	await import ( "./Arrays" );
	await import ( "./Base" );
	await import ( "./Builders" );
	await import ( "./IO" );
	await import ( "./Math" );
	await import ( "./Projections" );
	await import ( "./Render" );
	await import ( "./Scene" );
	await import ( "./Shaders" );
	await import ( "./Types" );
	await import ( "./Viewers" );
	await import ( "./Visitors" );

	mocha.run();
} ) ();
