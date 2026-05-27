///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Load and run the tests.
//
///////////////////////////////////////////////////////////////////////////////

describe ( "Command-Line Test Bootstrap", function ()
{
	this.timeout ( 0 );

	before ( async function ()
	{
		try
		{
			await import ( "./Algorithms" );
			await import ( "./Math" );
			await import ( "./Types" );
		}
		catch ( error )
		{
			const text = ( error instanceof Error ) ? ( error.stack ?? error.message ) : String ( error );
			throw new Error ( `Failed to import command-line test modules: ${text}` );
		}
	} );

	it ( "Loads test modules", function ()
	{
		// If we got here then module loading succeeded.
	} );
} );
