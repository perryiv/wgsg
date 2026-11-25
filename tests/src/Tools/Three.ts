///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the depth range of the projections, and unprojecting screen points.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { IDENTITY_MATRIX } from "../../../lib/src/Tools/Constants";
import { makeLine, unProject } from "../../../lib/src/Tools/Three";
import { Orthographic } from "../../../lib/src/Projections/Orthographic";
import { Perspective } from "../../../lib/src/Projections/Perspective";
import { vec4 } from "gl-matrix";
import type { IMatrix44, IVector3, IVector4, IViewport } from "../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers.
//
///////////////////////////////////////////////////////////////////////////////

const TOLERANCE = 1e-6;

/**
 * Get the depth that WebGPU uses for a point in eye coordinates: the clip
 * coordinates' z divided by w. WebGPU draws depths from 0 to 1.
 * @param {IMatrix44} projection - The projection matrix.
 * @param {IVector3} point - The point, in eye coordinates.
 * @returns {number} The depth.
 */
const getDepth = ( projection: Readonly<IMatrix44>, point: Readonly<IVector3> ) : number =>
{
	const clip: IVector4 = [ 0, 0, 0, 0 ];
	vec4.transformMat4 ( clip, [ point[0], point[1], point[2], 1 ], projection );
	return ( clip[2] / clip[3] );
};

/**
 * Expect the point to be close to the expected one.
 * @param {IVector3 | null} actual - The point.
 * @param {IVector3} expected - The expected point.
 * @param {number} tolerance - How close it has to be.
 */
const expectPoint = ( actual: ( Readonly<IVector3> | null ), expected: Readonly<IVector3>, tolerance: number ) : void =>
{
	expect ( actual ).to.not.be.null;
	for ( let i = 0; i < 3; ++i )
	{
		expect ( actual![i] ).to.be.closeTo ( expected[i], tolerance );
	}
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Depth range", function ()
	{
		it ( "Should put the near plane at depth 0 and the far plane at 1 with a perspective projection", function ()
		{
			const proj = new Perspective ( { fov: 1, aspect: 1, near: 2, far: 50 } );
			const m = proj.matrix;
			expect ( getDepth ( m, [ 0, 0, -2 ] ) ).to.be.closeTo ( 0, TOLERANCE );
			expect ( getDepth ( m, [ 0, 0, -50 ] ) ).to.be.closeTo ( 1, TOLERANCE );

			// Just past the near plane is drawn, which wasn't true with depth from
			// -1 to 1, when WebGPU cut off everything nearer than about 4 here.
			const depth = getDepth ( m, [ 0, 0, -2.5 ] );
			expect ( depth ).to.be.greaterThan ( 0 );
			expect ( depth ).to.be.lessThan ( 1 );
		} );

		it ( "Should put the near plane at depth 0 and the far plane at 1 with an orthographic projection", function ()
		{
			const proj = new Orthographic();
			const { near, far } = proj;
			const m = proj.matrix;
			expect ( getDepth ( m, [ 0, 0, -near ] ) ).to.be.closeTo ( 0, TOLERANCE );
			expect ( getDepth ( m, [ 0, 0, -far ] ) ).to.be.closeTo ( 1, TOLERANCE );
			expect ( getDepth ( m, [ 0, 0, -( near + far ) / 2 ] ) ).to.be.closeTo ( 0.5, TOLERANCE );
		} );

		it ( "Should unproject depth 0 to the near plane and 1 to the far plane", function ()
		{
			const proj = new Perspective ( { fov: 1, aspect: 1, near: 2, far: 50 } );
			const viewport: IViewport = { x: 0, y: 0, width: 100, height: 100 };
			const projMatrix = proj.matrix;
			const viewMatrix = [ ...IDENTITY_MATRIX ] as IMatrix44;

			// The middle of the screen is on the axis, which the eye looks down.
			const near = unProject ( { screenPoint: [ 50, 50, 0 ], projMatrix, viewMatrix, viewport } );
			const far = unProject ( { screenPoint: [ 50, 50, 1 ], projMatrix, viewMatrix, viewport } );
			expectPoint ( near, [ 0, 0, -2 ], 1e-5 );
			expectPoint ( far, [ 0, 0, -50 ], 1e-3 );
		} );

		it ( "Should make a line from the near plane to the far plane", function ()
		{
			const proj = new Perspective ( { fov: 1, aspect: 1, near: 2, far: 50 } );
			const viewport: IViewport = { x: 0, y: 0, width: 100, height: 100 };
			const line = makeLine ( {
				screenPoint: [ 50, 50 ],
				projMatrix: proj.matrix,
				viewMatrix: [ ...IDENTITY_MATRIX ] as IMatrix44,
				viewport,
			} );
			expect ( line ).to.not.be.null;
			expectPoint ( line!.start, [ 0, 0, -2 ], 1e-5 );
			expectPoint ( line!.end, [ 0, 0, -50 ], 1e-3 );
		} );
	} );
}
