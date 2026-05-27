///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { getNextId } from "../../../lib/src/Tools/Functions";
import { mat4 } from "gl-matrix";
import { Perspective } from "../../../lib/src/Projections/Perspective";
import { Sphere } from "../../../lib/src/Math/Sphere";
import { SphereNode } from "../../../lib/src/Scene/Nodes";
import { Viewer } from "../../../lib/src/Viewers/Viewer";
import type { IMatrix44, IVector3 } from "../../../lib/src/Types";
import {
	DEG_TO_RAD,
	IDENTITY_MATRIX,
	MAX_FAR_DISTANCE,
	MIN_NEAR_DISTANCE,
} from "../../../lib/src/Tools/Constants";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Viewer", function ()
	{
		this.beforeAll ( async function ()
		{
			await Device.init();
		} );

		it ( "Should not be able to make a viewer with zero arguments", function ()
		{
			// @ts-expect-error Viewer does not have a default constructor.
			expect ( () => { new Viewer() } ).to.throw();
		} );

		it ( "Should be able to make a viewer with canvas and device", function ()
		{
			expect ( Device.instance ).to.exist;
			expect ( Device.instance instanceof Device ).to.be.true;

			const id = getNextId ( "Viewers.Viewer" );
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.id ).to.exist;
			expect ( typeof viewer.id ).to.be.equal ( "number" );
			expect ( viewer.id ).to.be.greaterThan ( id );

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( canvas.getContext ( "webgpu" ) );
		} );

		it ( "Should be able to make a viewer with a canvas, device, name, and context", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const context = Device.instance.getConfiguredContext ( canvas );
			const viewer = new Viewer ( { canvas } );

			expect ( viewer ).to.exist;
			expect ( viewer instanceof Viewer ).to.be.true;

			expect ( viewer.canvas ).to.exist;
			expect ( viewer.canvas instanceof HTMLCanvasElement ).to.be.true;
			expect ( viewer.canvas ).to.equal ( canvas );

			expect ( viewer.context ).to.exist;
			expect ( viewer.context instanceof GPUCanvasContext ).to.be.true;
			expect ( viewer.context ).to.equal ( context );
		} );

		it ( "Should have correct default projection", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 100, 100 );

			const proj = viewer.projection;
			expect ( proj ).to.exist;
			expect ( proj instanceof Perspective ).to.be.true;

			const pp = ( proj as Perspective );
			expect ( pp.fov ).to.equal ( 45 );
			expect ( pp.aspect ).to.equal ( 1 );
			expect ( pp.near ).to.equal ( 0.1 );
			expect ( pp.far ).to.equal ( 10000 );
		} );

		it ( "Should have correct default matrices", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 100, 100 );

			expect ( viewer.projMatrix ).to.deep.equal ( mat4.perspective (
				[ ...IDENTITY_MATRIX ], 45, 1, 0.1, 10000
			) );

			expect ( viewer.viewMatrix ).to.deep.equal ( IDENTITY_MATRIX );
		} );

		it ( "Should be able to view the bounds", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 100, 100 );

			const sphere = new Sphere ( [ 0, 0, 0 ], 1 );
			viewer.viewSphere ( { sphere, animate: false } );

			// See comments in Trackball viewSphere for explanation of hypotenuse.
			const hypotenuse = 1 / Math.sin ( 22.5 * DEG_TO_RAD );

			const dm: IMatrix44 = [ ...IDENTITY_MATRIX ];
			mat4.translate ( dm, IDENTITY_MATRIX, [ 0, 0, -hypotenuse ] );
			expect ( viewer.viewMatrix ).to.deep.equal ( dm );
		} );

		it ( "Should be able to find ideal near and far clipping planes", function ()
		{
			const canvas = document.createElement ( "canvas" );
			const viewer = new Viewer ( { canvas } );
			viewer.resize ( 1000, 1000 );

			// The view matrix should still be identity.
			expect ( viewer.viewMatrix ).to.deep.equal ( IDENTITY_MATRIX );

			// Make the viewer's scene be a sphere at the origin.
			const center: IVector3 = [ 0, 0, 0 ];
			const radius = 1;
			const sphere = new SphereNode ( { center, radius } );
			viewer.modelScene = sphere;

			// Perspective projection should be the default.
			expect ( viewer.projection ).to.exist;
			expect ( viewer.projection instanceof Perspective ).to.be.true;

			// The bounds should be the same as the scene's sphere.
			const { bounds: b1 } = viewer.modelScene;
			expect ( b1 ).to.exist;
			expect ( b1.center ).to.deep.equal ( sphere.center );
			expect ( b1.radius ).to.equal ( sphere.radius );

			// The projection should have the default near and far distances.
			const proj = ( viewer.projection as Perspective );
			const { fov, near: n1, far: f1 } = proj;
			expect ( n1 ).to.be.equal ( 0.1 );
			expect ( f1 ).to.be.equal ( 10000 );

			// This should change the view matrix.
			viewer.viewAll ( { animate: false } );

			// See Trackball viewSphere() for why this equation is used here.
			const distance = radius / Math.sin ( fov * 0.5 * DEG_TO_RAD );
			expect ( viewer.viewMatrix ).to.deep.equal ( [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, -distance, 1
			] );

			// The bounds should not change because it's in the model's space.
			const { bounds: b2 } = viewer.modelScene;
			expect ( b2 ).to.exist;
			expect ( b2.center ).to.deep.equal ( sphere.center );
			expect ( b2.radius ).to.equal ( sphere.radius );

			// The projection should be the same.
			const { near: n2, far: f2 } = proj;
			expect ( n2 ).to.be.equal ( n1 );
			expect ( f2 ).to.be.equal ( f1 );

			// This should change the projection's near and far distances.
			viewer.render();

			// The distances should not be the extremes, and not intersect the sphere.
			const { near: n3, far: f3 } = proj;
			expect ( n3, "Line 202" ).to.be.lessThan ( distance - radius );
			expect ( n3, "Line 203" ).to.be.greaterThan ( MIN_NEAR_DISTANCE );
			expect ( f3, "Line 204" ).to.be.greaterThan ( distance + radius );
			expect ( f3, "Line 205" ).to.be.lessThan ( MAX_FAR_DISTANCE );
		} );
	} );
};
