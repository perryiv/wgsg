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

import { Line } from "./Line";
import { Sphere } from "./Sphere";


///////////////////////////////////////////////////////////////////////////////
//
//  Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IIntersectLineSphereInput
{
  line: Line;
  sphere: Sphere;
  tolerance?: number;
}

export interface ILineSphereIntersection {
  u1?: number;
  u2?: number;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Intersect a line with a sphere.
 * See: http://paulbourke.net/geometry/circlesphere/index.html#linesphere
 * @param {IIntersectLineSphereInput} input The input data.
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
