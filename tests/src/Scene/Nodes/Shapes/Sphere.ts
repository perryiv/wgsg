///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for sphere node.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	Geometry,
	Node,
	Shape,
	SphereNode as Sphere,
	State,
} from "../../../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Sphere", function ()
	{
		it ( "Should be able to make a sphere node", function ()
		{
			const sphere = new Sphere();
			expect ( sphere ).to.exist;
			expect ( sphere instanceof Sphere ).to.be.true;
			expect ( sphere instanceof Geometry ).to.be.true;
			expect ( sphere instanceof Shape ).to.be.true;
			expect ( sphere instanceof Node ).to.be.true;
		} );

		it ( "Should have correct default properties", function ()
		{
			const sphere = new Sphere();
			expect ( sphere.center ).to.deep.equal ( [ 0, 0, 0 ] );
			expect ( sphere.radius ).to.equal ( 1.0 );
			expect ( sphere.numSubdivisions ).to.equal ( 2 );
			expect ( sphere.state ).to.be.null;
		} );

		it ( "Should be able to construct with different values", function ()
		{
			const state = new State();
			state.name = "Sphere test state";
			const sphere = new Sphere ( {
				center: [ 1, 2, 3 ],
				radius: 4.0,
				numSubdivisions: 5,
				state,
			} );
			expect ( sphere.center ).to.deep.equal ( [ 1, 2, 3 ] );
			expect ( sphere.radius ).to.equal ( 4.0 );
			expect ( sphere.numSubdivisions ).to.equal ( 5 );
			expect ( sphere.state ).to.equal ( state );
			expect ( sphere.state?.name ).to.equal ( "Sphere test state" );
		} );

		it ( "Should have the correct bounding box", function ()
		{
			const sphere = new Sphere ( {
				center: [ 0, 0, 0 ],
				radius: 1.0,
				numSubdivisions: 1,
			} );
			sphere.update();
			const box = sphere.getBoundingBox();

			expect ( box.min[0] ).to.be.equal ( -1 );
			expect ( box.min[1] ).to.be.equal ( -1 );
			expect ( box.min[2] ).to.be.equal ( -1 );
			expect ( box.max[0] ).to.be.equal (  1 );
			expect ( box.max[1] ).to.be.equal (  1 );
			expect ( box.max[2] ).to.be.equal (  1 );
		} );

		it ( "Should have the correct bounding sphere", function ()
		{
			const sphere = new Sphere ( {
				center: [ 1, 0, 0 ],
				radius: 1.0,
				numSubdivisions: 1,
			} );
			const bounds = sphere.getBoundingSphere();

			expect ( bounds.center[0] ).to.be.equal ( 1 );
			expect ( bounds.center[1] ).to.be.equal ( 0 );
			expect ( bounds.center[2] ).to.be.equal ( 0 );
			expect ( bounds.radius ).to.be.equal ( 1 );
		} );
	} );
};
