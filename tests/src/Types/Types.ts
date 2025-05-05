///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the types.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import type {
	IDeviceOptions,
	ISize,
	IViewport,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	// In most of these cases we're really checking for compile errors.
	describe ( "Types", function ()
	{
		it ( "IDeviceOptions", function ()
		{
			const a: IDeviceOptions = { rao: undefined, dd: undefined }
			expect ( a ).to.exist;
		} );

		it ( "IViewport", function ()
		{
			const a: IViewport = { x: 0, y: 0, width: 1, height: 1 };
			expect ( a ).to.exist;
		} );

		it ( "ISize", function ()
		{
			const a: ISize = { width: 1, height: 1 };
			expect ( a ).to.exist;
		} );
	} );
};
