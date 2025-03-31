///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	This file starts a headless browser and has it load the real tests.
//
///////////////////////////////////////////////////////////////////////////////

import puppeteer from "puppeteer-core";
import { pathToFileURL } from "url";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

await ( async () =>
{
	const browser = await puppeteer.launch ( {
		executablePath: "/usr/bin/chromium",
		args: [ "--enable-unsafe-webgpu" ] // Works on Linux.
	} );
	const page = await browser.newPage();
	await page.goto ( ( pathToFileURL ( "src/tests/index.html" ) ).toString() );
	// await page.pdf ( { path: "./index.pdf" } );
	await page.close();
	await browser.close();
	console.log ( "Done" );
} ) ();

// You want to write all the tests in TypeScript.
// You need mocha to run in the browser so that you can test WebGPU functionality.
// You need the browser to run headless in puppeteer.
// You need to wait for the mocha tests to finish before generating a PDF.
// Is there a better way to know if the tests passed?
