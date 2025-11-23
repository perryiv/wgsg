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
	IMatrix44,
	ISize,
	IVector2,
	IVector3,
	IVector4,
	IViewport,
} from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	// In many of these cases we're really checking for compile errors.
	describe ( "Types", function ()
	{
		it ( "IDeviceOptions", function ()
		{
			const a: IDeviceOptions = { requestAdapterOptions: undefined, deviceDescriptor: undefined }
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

		it ( "IVector2", function ()
		{
			const a: IVector2 = [ 1, 2 ];
			expect ( a ).to.exist;
			expect ( a.length ).to.be.equal ( 2 );
		} );

		it ( "IVector3", function ()
		{
			const a: IVector3 = [ 1, 2, 3 ];
			expect ( a ).to.exist;
			expect ( a.length ).to.be.equal ( 3 );
		} );

		it ( "IVector4", function ()
		{
			const a: IVector4 = [ 1, 2, 3, 4 ];
			expect ( a ).to.exist;
			expect ( a.length ).to.be.equal ( 4 );
		} );

		it ( "IMatrix44", function ()
		{
			const a: IMatrix44 = [
				1, 2, 3, 4,
				1, 2, 3, 4,
				1, 2, 3, 4,
				1, 2, 3, 4
			];
			expect ( a ).to.exist;
			expect ( a.length ).to.be.equal ( 16 );
		} );
	} );
};
