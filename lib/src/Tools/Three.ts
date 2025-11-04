
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
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "./Constants";
import { mat4, vec4 } from "gl-matrix";
import type {
	IMatrix44,
	IVector2,
	IVector3,
	IVector4,
} from "../Types"


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IUnProjectInput
{
	screen: ( IVector2 | IVector3 );
	modelMatrix: IMatrix44;
	projMatrix: IMatrix44;
	viewport: IVector4;
};

interface IMakeLineInput
{
  screen: IVector2;
  viewMatrix: IMatrix44;
  projMatrix: IMatrix44;
  viewport: IVector4;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Unprojects a 2D screen point into world space.
 * See: https://github.com/perryiv/usul/blob/master/source/Usul/Math/Three.h
 * @param {IUnProjectInput} input The input data.
 * @returns {IVector3 | null} The unprojected point or null on failure.
 */
///////////////////////////////////////////////////////////////////////////////

export function unProject ( input: IUnProjectInput ) : ( IVector3 | null )
{
	// Get input.
	const { modelMatrix, projMatrix, viewport } = input;
  let { screen } = input;

  // Handle invalid input.
  if ( screen.length < 2 || screen.length > 3 )
  {
    return null;
  }

  // Handle 2D input.
  if ( 2 === screen.length )
  {
    screen = [ screen[0], screen[1], 0 ];
  }

  // Make the homogeneous, normalized point.
	// All three, x, y, and z, will be in the range [-1,1].
	const a: IVector4 = [
		( ( ( screen[0] - viewport[0] ) * 2 / viewport[2] ) - 1 ),
		( ( ( screen[1] - viewport[1] ) * 2 / viewport[3] ) - 1 ),
		( ( 2 * screen[2] ) - 1 ),
		1
	];

	// Combine the view and projection matrices.
	const m: IMatrix44 = [ ...IDENTITY_MATRIX ];
	mat4.multiply ( m, m, projMatrix );
	mat4.multiply ( m, m, modelMatrix );

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
 * Make a 3D line from 2D screen coordinates. The x and y arguments are window coordinates (origin top-left).
 */
///////////////////////////////////////////////////////////////////////////////

export function makeLine ( input: IMakeLineInput ): void
{
  const { x, y, viewMatrix, projMatrix, viewport } = input;

  // Flip y because window coords typically have origin at top-left
	const yf = viewport[3] - y;

	const near = unProject([x, yf, 0], viewMatrix, projMatrix, viewport);
	if (!near) return null;

	const far = unProject([x, yf, 1], viewMatrix, projMatrix, viewport);
	if (!far) return null;

	return { start: near, end: far };
}
