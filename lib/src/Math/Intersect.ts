///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//  Intersection functions.
//
//	Original code is:
//  https://github.com/perryiv/usul/blob/master/source/Usul/Math/Intersect.h
//
///////////////////////////////////////////////////////////////////////////////

import type {
  ILine,
  IPlaneCoefficients,
  ISphere,
  IVector3,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//  Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IIntersectLineSphereInput
{
  line: ILine;
  sphere: ISphere;
  tolerance?: number;
}

export interface ILineSphereIntersection {
  u1?: number;
  u2?: number;
}

export interface IIntersectLinePlaneInput
{
  line: ILine;
  plane: IPlaneCoefficients;
  tolerance?: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Intersect a line with a sphere.
 * See: http://paulbourke.net/geometry/circlesphere/index.html#linesphere
 * @param {IIntersectLineSphereInput} input The input data.
 * @param {ILine} input.line The line.
 * @param {ISphere} input.sphere The sphere.
 * @param {number} [input.tolerance ] The tolerance for floating point comparisons.
 * @returns {ILineSphereIntersection} The intersection data.
 */
///////////////////////////////////////////////////////////////////////////////

export function intersectLineSphere ( input: IIntersectLineSphereInput ) : ILineSphereIntersection
{
  // Get the input.
  const { line, sphere, tolerance = 1e-6 } = input;

  // Shortcuts.
  const pt1 = line.start;
  const pt2 = line.end;
  const center = sphere.center;
  const radius = sphere.radius;

  // For speed.
  const x1 = pt1[0], y1 = pt1[1], z1 = pt1[2];
  const x2 = pt2[0], y2 = pt2[1], z2 = pt2[2];
  const x3 = center[0], y3 = center[1], z3 = center[2];

  // Calculate the a, b, and c needed for the quadratic formula.
  const a =
    ( ( x2 - x1 ) * ( x2 - x1 ) ) +
    ( ( y2 - y1 ) * ( y2 - y1 ) ) +
    ( ( z2 - z1 ) * ( z2 - z1 ) );

  const b = (
    ( ( x2 - x1 ) * ( x1 - x3 ) ) +
    ( ( y2 - y1 ) * ( y1 - y3 ) ) +
    ( ( z2 - z1 ) * ( z1 - z3 ) )
  ) * 2;

  const c =
      ( ( x3 * x3 ) + ( y3 * y3 ) + ( z3 * z3 ) ) +
      ( ( x1 * x1 ) + ( y1 * y1 ) + ( z1 * z1 ) ) -
    ( ( ( x3 * x1 ) + ( y3 * y1 ) + ( z3 * z1 ) ) * 2 ) -
    ( radius * radius );

  // Get the discriminant: b^2 - 4ac
  const inner = ( b * b ) - ( a * c * 4 );

  // Is there one intersection? This means tangent.
  if ( ( inner < tolerance ) && ( inner > -tolerance ) )
  {
    const u1 = -b / ( a * 2 );
    return { u1 };
  }

  // No intersection
  if ( inner < 0 )
  {
    return {};
  }

  // Two intersections.
  const sqrtInner = Math.sqrt ( inner );
  const denom = 1 / ( a * 2 );
  const u1 = ( -b - sqrtInner ) * denom;
  const u2 = ( -b + sqrtInner ) * denom;
  return { u1, u2 };
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Intersect a line with a plane.
 * @param {IIntersectLinePlaneInput} input The input data.
 * @param {ILine} input.line The line.
 * @param {IPlaneCoefficients} input.plane The plane.
 * @param {number} [input.tolerance ] The tolerance for floating point comparisons.
 * @returns {number | null} The intersection parameter along the line, or null if no intersection.
 */
///////////////////////////////////////////////////////////////////////////////

export function intersectLinePlane ( input: IIntersectLinePlaneInput ) : number | null
{
  // Get the input.
  const { line, plane, tolerance = 1e-6 } = input;

  // Get the line direction.
  const dir: IVector3 = [
    line.end[0] - line.start[0],
    line.end[1] - line.start[1],
    line.end[2] - line.start[2]
  ];

  // Get the plane coefficients.
  const coeffs = plane.coefficients;
  const a = coeffs[0];
  const b = coeffs[1];
  const c = coeffs[2];
  const d = coeffs[3];

  // Calculate the denominator.
  const denom = a * dir[0] + b * dir[1] + c * dir[2];

  // If the denominator is zero, the line is parallel to the plane.
  if ( Math.abs ( denom ) < tolerance )
  {
    return null;
  }

  // Calculate the numerator.
  const numer = - ( a * line.start[0] + b * line.start[1] + c * line.start[2] + d );

  // Calculate the intersection parameter.
  const t = numer / denom;

  // Return the intersection parameter.
  return t;
}
