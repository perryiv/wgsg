
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	3D math functions.
//
//	Many were copied from here and converted to TypeScript:
//	https://github.com/perryiv/usul/blob/master/source/Usul/Math/Three.h
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "./Constants";
import { Line } from "../Math";
import { mat4, vec4 } from "gl-matrix";
import type {
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
	IViewport,
} from "../Types"


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IUnProjectInput
{
	screenPoint: ( IVector2 | IVector3 );
	viewMatrix: IMatrix44;
	projMatrix: IMatrix44;
	viewport: IViewport;
};

interface IMakeLineInput
{
	screenPoint: IVector2;
	viewMatrix: IMatrix44;
	projMatrix: IMatrix44;
	viewport: IViewport;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Unprojects a 2D screen point into world space.
 * See: https://github.com/perryiv/usul/blob/master/source/Usul/Math/Three.h
 * @param {IUnProjectInput} input The input data.
 * @returns {IVector3 | null} The unprojected point or null on failure.
 */
///////////////////////////////////////////////////////////////////////////////

export function unProject ( input: Readonly<IUnProjectInput> ) : ( IVector3 | null )
{
	// Get input.
	const { viewMatrix, projMatrix, viewport } = input;
	let { screenPoint } = input;

	// Handle invalid input.
	if ( screenPoint.length < 2 || screenPoint.length > 3 )
	{
		return null;
	}

	// Handle 2D input.
	if ( 2 === screenPoint.length )
	{
		screenPoint = [ screenPoint[0], screenPoint[1], 0 ];
	}

	// Make the homogeneous, normalized point.
	// All three, x, y, and z, will be in the range [-1,1].
	const a: IVector4 = [
		( ( ( screenPoint[0] - viewport.x ) * 2 / viewport.width ) - 1 ),
		( ( ( screenPoint[1] - viewport.y ) * 2 / viewport.height ) - 1 ),
		( ( 2 * screenPoint[2] ) - 1 ),
		1
	];

	// Combine the view and projection matrices.
	const m: IMatrix44 = [ ...IDENTITY_MATRIX ];
	mat4.multiply ( m, m, projMatrix );
	mat4.multiply ( m, m, viewMatrix );

	// Get the inverse and handle when it does not exist.
	const im: IMatrix44 = [ ...IDENTITY_MATRIX ];
	if ( !mat4.invert ( im, m ) )
	{
		return null;
	}

	// Transform the 4D point.
	const b: IVector4 = [ 0, 0, 0, 0 ];
	vec4.transformMat4 ( b, a, im );

	// Make sure it worked.
	if ( 0 == b[3] )
	{
		return null;
	}

	// Shortcut.
	const ib3 = ( 1 / b[3] );

	// Return the answer.
	return [
		b[0] * ib3,
		b[1] * ib3,
		b[2] * ib3
	];
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a 3D line from 2D screen coordinates.
 * @param {IMakeLineInput} input The input data.
 * @returns {ILine | null} The line or null on failure.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeLine ( input: Readonly<IMakeLineInput> ): ( Line | null )
{
	// Get the input.
	const { screenPoint, viewMatrix, projMatrix, viewport } = input;

	// Shortcuts. Note: we flip the y direction.
	const x = screenPoint[0];
	const y = viewport.height - screenPoint[1];

	// Unproject the near point.
	const near = unProject ( { screenPoint: [ x, y, 0 ], viewMatrix, projMatrix, viewport } );

	// Make sure it worked.
	if ( !near )
	{
		return null;
	}

	// Unproject the far point.
	const far = unProject ( { screenPoint: [ x, y, 1 ], viewMatrix, projMatrix, viewport } );

	// Make sure it worked.
	if ( !far )
	{
		return null;
	}

	// Return the line.
	return new Line ( near, far );
}
