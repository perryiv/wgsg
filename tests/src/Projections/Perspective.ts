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
import { Perspective } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Perspective", function ()
	{
		it ( "Should be able to call the constructor with no arguments", function ()
		{
			expect ( () => { new Perspective() } ).to.not.throw;
		} );

		it ( "Default construction should have correct properties", function ()
		{
			const proj = new Perspective();
			expect ( proj.type ).to.be.equal ( "Projections.Perspective" );
			expect ( proj.fov ).to.be.equal ( 45 );
			expect ( proj.aspect ).to.be.equal ( 1 );
			expect ( proj.near ).to.be.equal ( 1 );
			expect ( proj.far ).to.be.equal ( 10000 );
			expect ( proj.matrix ).to.be.deep.equal ( [
				1.792590986919304, 0, 0, 0,
				0, 1.792590986919304, 0, 0,
				0, 0, -1.0002000200020003, -1,
				0, 0, -2.0002000200020005, 0
			] );
		} );

		it ( "Should be able to construct with input", function ()
		{
			expect ( () => { new Perspective ( { fov: 60 } ) } ).to.not.throw;
			expect ( () => { new Perspective ( { fov: 60, aspect: 2 } ) } ).to.not.throw;
			expect ( () => { new Perspective ( { fov: 60, aspect: 2, near: 2 } ) } ).to.not.throw;
			expect ( () => { new Perspective ( { fov: 60, aspect: 2, near: 2, far: 100 } ) } ).to.not.throw;

			const proj = new Perspective ( { fov: 60, aspect: 2, near: 2, far: 100 } );
			expect ( proj.fov ).to.be.equal ( 60 );
			expect ( proj.aspect ).to.be.equal ( 2 );
			expect ( proj.near ).to.be.equal ( 2 );
			expect ( proj.far ).to.be.equal ( 100 );
		} );

		it ( "Constructing with bad input should throw", function ()
		{
			expect ( () => { new Perspective ( { fov:  0 } ) } ).to.throw ( "Invalid field-of-view: 0"  );
			expect ( () => { new Perspective ( { fov: -1 } ) } ).to.throw ( "Invalid field-of-view: -1" );

			expect ( () => { new Perspective ( { aspect:  0 } ) } ).to.throw ( "Invalid aspect ratio: 0"  );
			expect ( () => { new Perspective ( { aspect: -1 } ) } ).to.throw ( "Invalid aspect ratio: -1" );

			expect ( () => { new Perspective ( { near:  0 } ) } ).to.throw ( "Invalid near distance: 0"  );
			expect ( () => { new Perspective ( { near: -1 } ) } ).to.throw ( "Invalid near distance: -1" );

			expect ( () => { new Perspective ( { far:  0 } ) } ).to.throw ( "Invalid far distance: 0"  );
			expect ( () => { new Perspective ( { far: -1 } ) } ).to.throw ( "Invalid far distance: -1" );
		} );

		it ( "Setting bad input should throw", function ()
		{
			const proj = new Perspective();

			expect ( () => { proj.setFrom ( { fov:  0 } ) } ).to.throw ( "Invalid field-of-view: 0"  );
			expect ( () => { proj.setFrom ( { fov: -1 } ) } ).to.throw ( "Invalid field-of-view: -1" );

			expect ( () => { proj.setFrom ( { aspect:  0 } ) } ).to.throw ( "Invalid aspect ratio: 0"  );
			expect ( () => { proj.setFrom ( { aspect: -1 } ) } ).to.throw ( "Invalid aspect ratio: -1" );

			expect ( () => { proj.setFrom ( { near:  0 } ) } ).to.throw ( "Invalid near distance: 0"  );
			expect ( () => { proj.setFrom ( { near: -1 } ) } ).to.throw ( "Invalid near distance: -1" );

			expect ( () => { proj.setFrom ( { far:  0 } ) } ).to.throw ( "Invalid far distance: 0"  );
			expect ( () => { proj.setFrom ( { far: -1 } ) } ).to.throw ( "Invalid far distance: -1" );
		} );

		it ( "Can use setter members", function ()
		{
			const proj = new Perspective();

			expect ( proj.fov ).to.be.equal ( 45 );
			expect ( proj.aspect ).to.be.equal ( 1 );
			expect ( proj.near ).to.be.equal ( 1 );
			expect ( proj.far ).to.be.equal ( 10000 );

			proj.fov = 55;
			proj.aspect = 1.5;
			proj.near = 10;
			proj.far = 100;

			expect ( proj.fov ).to.be.equal ( 55 );
			expect ( proj.aspect ).to.be.equal ( 1.5 );
			expect ( proj.near ).to.be.equal ( 10 );
			expect ( proj.far ).to.be.equal ( 100 );
		} );

		it ( "Passing bad walues to setter members will throw", function ()
		{
			const proj = new Perspective();

			expect ( proj.fov ).to.be.equal ( 45 );
			expect ( proj.aspect ).to.be.equal ( 1 );
			expect ( proj.near ).to.be.equal ( 1 );
			expect ( proj.far ).to.be.equal ( 10000 );

			expect ( () => { proj.fov =  0; } ).to.throw ( "Given field-of-view '0' is not a positive finite number" );
			expect ( () => { proj.fov = -1; } ).to.throw ( "Given field-of-view '-1' is not a positive finite number" );

			expect ( () => { proj.aspect =  0; } ).to.throw ( "Given aspect ratio '0' is not a positive finite number" );
			expect ( () => { proj.aspect = -1; } ).to.throw ( "Given aspect ratio '-1' is not a positive finite number" );

			expect ( () => { proj.near =  0; } ).to.throw ( "Given near distance '0' is not a positive finite number" );
			expect ( () => { proj.near = -1; } ).to.throw ( "Given near distance '-1' is not a positive finite number" );

			expect ( () => { proj.far =  0; } ).to.throw ( "Given far distance '0' is not a positive finite number" );
			expect ( () => { proj.far = -1; } ).to.throw ( "Given far distance '-1' is not a positive finite number" );
		} );
	} );
};
