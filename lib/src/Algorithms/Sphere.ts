///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Sphere sub-division algorithm.
//
//	Originally from:
//	https://github.com/perryiv/usul/blob/master/source/Usul/Algorithms/Sphere.h
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type ISubDivideCallback = ( (
		x1: number, y1: number, z1: number,
		x2: number, y2: number, z2: number,
		x3: number, y3: number, z3: number,
		i1: number, i2: number, i3: number
	) => void
);


///////////////////////////////////////////////////////////////////////////////
/**
 * Subdivides a triangle on a sphere into smaller triangles.
 * @param {number} x1 - X-coordinate of the first vertex.
 * @param {number} y1 - Y-coordinate of the first vertex.
 * @param {number} z1 - Z-coordinate of the first vertex.
 * @param {number} x2 - X-coordinate of the second vertex.
 * @param {number} y2 - Y-coordinate of the second vertex.
 * @param {number} z2 - Z-coordinate of the second vertex.
 * @param {number} x3 - X-coordinate of the third vertex.
 * @param {number} y3 - Y-coordinate of the third vertex.
 * @param {number} z3 - Z-coordinate of the third vertex.
 * @param {object} numPoints - Object to track the number of points.
 * @param {number} numPoints.value - Current number of points.
 * @param {number} depth - Depth of subdivision.
 * @param {ISubDivideCallback} fun - Callback function to handle the subdivided triangles.
 */
///////////////////////////////////////////////////////////////////////////////

function subdivide (
	x1: Readonly<number>, y1: Readonly<number>, z1: Readonly<number>,
	x2: Readonly<number>, y2: Readonly<number>, z2: Readonly<number>,
	x3: Readonly<number>, y3: Readonly<number>, z3: Readonly<number>,
	numPoints: { value: number },
	depth: Readonly<number>,
	fun: ISubDivideCallback ): void
{
	// If we are at the requested depth ...
	if ( 0 === depth )
	{
		// Determine the indices.
		const i1 = numPoints.value++;
		const i2 = numPoints.value++;
		const i3 = numPoints.value++;

		// Call the function.
		fun ( x1, y1, z1, x2, y2, z2, x3, y3, z3, i1, i2, i3 );
	}

	// Otherwise ...
	else
	{
		// Make three new points.
		let x12 = x1 + x2;
		let y12 = y1 + y2;
		let z12 = z1 + z2;
		let x23 = x2 + x3;
		let y23 = y2 + y3;
		let z23 = z2 + z3;
		let x31 = x3 + x1;
		let y31 = y3 + y1;
		let z31 = z3 + z1;

		// Adjust the first point.
		let d = Math.sqrt ( x12 * x12 + y12 * y12 + z12 * z12 );
		if ( d <= 0 )
		{
			throw new Error ( "Division by zero when adjusting the first point" );
		}
		let invd = 1.0 / d;
		x12 *= invd;
		y12 *= invd;
		z12 *= invd;

		// Adjust the second point.
		d = Math.sqrt ( x23 * x23 + y23 * y23 + z23 * z23 );
		if ( d <= 0 )
		{
			throw new Error ( "Division by zero when adjusting the second point" );
		}
		invd = 1.0 / d;
		x23 *= invd;
		y23 *= invd;
		z23 *= invd;

		// Adjust the third point.
		d = Math.sqrt ( x31 * x31 + y31 * y31 + z31 * z31 );
		if ( d <= 0 )
		{
			throw new Error ( "Division by zero when adjusting the third point" );
		}
		invd = 1.0 / d;
		x31 *= invd;
		y31 *= invd;
		z31 *= invd;

		// Divide again.
		depth--;
		subdivide ( x1,  y1,  z1, x12, y12, z12, x31, y31, z31, numPoints, depth, fun );
		subdivide ( x2,  y2,  z2, x23, y23, z23, x12, y12, z12, numPoints, depth, fun );
		subdivide ( x3,  y3,  z3, x31, y31, z31, x23, y23, z23, numPoints, depth, fun );
		subdivide (x12, y12, z12, x23, y23, z23, x31, y31, z31, numPoints, depth, fun );
	}
}



///////////////////////////////////////////////////////////////////////////////
/**
 * Make a sequence of triangles that define a unit sphere.
 * Subdivide n times. The points are also the normal vectors.
 * @param {number} n - The number of subdivisions to perform.
 * @param {ISubDivideCallback} fun - Callback function to handle the subdivided triangles.
 */
///////////////////////////////////////////////////////////////////////////////

export const generateUnitSphere = ( n: Readonly<number>, fun: ISubDivideCallback ) =>
{
	// Handle invalid callback.
	if ( !fun )
	{
		throw new Error ( "Invalid callback function when generating triangles for a sphere" );
	}

	// Check input.
	if ( n < 0 )
	{
		throw new Error ( `Number of sphere subdivisions ${n} is < 0` );
	}

	// Declare these constants used in the subdivision algorithm.
	const X = 0.5257311121191336;
	const Z = 0.8506508083528656;

	// We need to count the points as we go.
	const numPoints = { value: 0 };

	// Call the function to subdivide.
	subdivide ( -X,  0,  Z,  X,  0,  Z,  0,  Z,  X, numPoints, n, fun );
	subdivide ( -X,  0,  Z,  0,  Z,  X, -Z,  X,  0, numPoints, n, fun );
	subdivide ( -Z,  X,  0,  0,  Z,  X,  0,  Z, -X, numPoints, n, fun );
	subdivide (  0,  Z,  X,  Z,  X,  0,  0,  Z, -X, numPoints, n, fun );
	subdivide (  0,  Z,  X,  X,  0,  Z,  Z,  X,  0, numPoints, n, fun );
	subdivide (  Z,  X,  0,  X,  0,  Z,  Z, -X,  0, numPoints, n, fun );
	subdivide (  Z,  X,  0,  Z, -X,  0,  X,  0, -Z, numPoints, n, fun );
	subdivide (  0,  Z, -X,  Z,  X,  0,  X,  0, -Z, numPoints, n, fun );
	subdivide (  0,  Z, -X,  X,  0, -Z, -X,  0, -Z, numPoints, n, fun );
	subdivide ( -X,  0, -Z,  X,  0, -Z,  0, -Z, -X, numPoints, n, fun );
	subdivide (  0, -Z, -X,  X,  0, -Z,  Z, -X,  0, numPoints, n, fun );
	subdivide (  0, -Z, -X,  Z, -X,  0,  0, -Z,  X, numPoints, n, fun );
	subdivide (  0, -Z, -X,  0, -Z,  X, -Z, -X,  0, numPoints, n, fun );
	subdivide ( -Z, -X,  0,  0, -Z,  X, -X,  0,  Z, numPoints, n, fun );
	subdivide ( -X,  0,  Z,  0, -Z,  X,  X,  0,  Z, numPoints, n, fun );
	subdivide (  0, -Z,  X,  Z, -X,  0,  X,  0,  Z, numPoints, n, fun );
	subdivide ( -Z,  X,  0, -Z, -X,  0, -X,  0,  Z, numPoints, n, fun );
	subdivide ( -Z,  X,  0, -X,  0, -Z, -Z, -X,  0, numPoints, n, fun );
	subdivide ( -Z,  X,  0,  0,  Z, -X, -X,  0, -Z, numPoints, n, fun );
	subdivide (  0, -Z, -X, -Z, -X,  0, -X,  0, -Z, numPoints, n, fun );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Reserve space in the containers.
 * @param {number} n - The number of subdivisions to perform.
 * @returns {object} - An object containing the estimated number of points and indices.
 * @property {number} numPoints - The estimated number of points.
 * @property {number} numIndices - The estimated number of indices.
 */
///////////////////////////////////////////////////////////////////////////////

export const estimateSphereSizes = ( n: Readonly<number> ) : { numPoints: number, numIndices: number } =>
{
	// Check input.
	if ( n < 0 )
	{
		throw new Error ( `Number of sphere subdivisions ${n} is < 0` );
	}

	// This works out to ( 60 * ( 4 ^ n ) ).
	const numPoints = 60 * Math.pow ( 4.0, n );

	// The indices are trivial.
	const numIndices = numPoints;

	// Return the numbers
	return { numPoints, numIndices };
};
