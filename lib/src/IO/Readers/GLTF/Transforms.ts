///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Split the glTF node transforms so that the scene only has transforms that
//	rotate and translate.
//
//	A glTF node can also scale, and the scale applies to everything below it.
//	Each node is split into a transform that only rotates and translates, and
//	a leftover 3x3 matrix that is passed down to its children. At a mesh, the
//	leftover is multiplied into the points and normals.
//
//	At a node with translation t and the 3x3 part L, where L = R * S, and with
//	the leftover A from above, the node's whole transform is A * T(t) * L.
//	That equals T(A * t) * R * ( Rt * A * L ), where Rt is R transposed, so
//	the transform is T(A * t) * R and the new leftover is Rt * A * L. This is
//	exact even when an uneven scale above a rotation makes a shear.
//
//	The matrices here are column-major, like the 4x4 ones, and use plain
//	numbers so that they keep double precision.
//
///////////////////////////////////////////////////////////////////////////////

import type { IMatrix44 } from "../../../Types";
import type { IGltfNode } from "./Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types and constants.
//
///////////////////////////////////////////////////////////////////////////////

// A 3x3 matrix, column-major.
export type IMatrix33 = [
	number, number, number,
	number, number, number,
	number, number, number,
];

// The identity matrix.
const IDENTITY_33: Readonly<IMatrix33> = [ 1, 0, 0,   0, 1, 0,   0, 0, 1 ];

// How close to the identity a leftover has to be to be ignored.
const TOLERANCE = 1e-6;

// What a node is split into.
export interface INodeSplit
{
	// The transform, which only rotates and translates, or null if it does
	// nothing.
	matrix: ( IMatrix44 | null );

	// The leftover for the children, or null if there is none.
	leftover: ( IMatrix33 | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Multiply two 3x3 matrices.
 * @param {IMatrix33} a The matrix on the left.
 * @param {IMatrix33} b The matrix on the right.
 * @returns {IMatrix33} The product, a * b.
 */
///////////////////////////////////////////////////////////////////////////////

export const multiply33 = ( a: Readonly<IMatrix33>, b: Readonly<IMatrix33> ) : IMatrix33 =>
{
	const answer: IMatrix33 = [ 0, 0, 0,   0, 0, 0,   0, 0, 0 ];
	for ( let col = 0; col < 3; ++col )
	{
		for ( let row = 0; row < 3; ++row )
		{
			answer[col * 3 + row] =
				( a[row    ] * b[col * 3    ] ) +
				( a[row + 3] * b[col * 3 + 1] ) +
				( a[row + 6] * b[col * 3 + 2] );
		}
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Transpose a 3x3 matrix.
 * @param {IMatrix33} m The matrix.
 * @returns {IMatrix33} The transposed matrix.
 */
///////////////////////////////////////////////////////////////////////////////

export const transpose33 = ( m: Readonly<IMatrix33> ) : IMatrix33 =>
{
	return [ m[0], m[3], m[6],   m[1], m[4], m[7],   m[2], m[5], m[8] ];
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the determinant of a 3x3 matrix.
 * @param {IMatrix33} m The matrix.
 * @returns {number} The determinant.
 */
///////////////////////////////////////////////////////////////////////////////

export const determinant33 = ( m: Readonly<IMatrix33> ) : number =>
{
	return (
		( m[0] * ( ( m[4] * m[8] ) - ( m[7] * m[5] ) ) ) -
		( m[3] * ( ( m[1] * m[8] ) - ( m[7] * m[2] ) ) ) +
		( m[6] * ( ( m[1] * m[5] ) - ( m[4] * m[2] ) ) ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the rotation matrix of a quaternion.
 * @param {number[]} q The quaternion, ( x, y, z, w ).
 * @returns {IMatrix33} The rotation matrix.
 */
///////////////////////////////////////////////////////////////////////////////

export const rotationFromQuaternion = ( q: readonly number[] ) : IMatrix33 =>
{
	// Make it unit length, which the file should have done.
	const length = Math.hypot ( q[0], q[1], q[2], q[3] );
	if ( 0 === length )
	{
		return [ ...IDENTITY_33 ];
	}
	const x = q[0] / length;
	const y = q[1] / length;
	const z = q[2] / length;
	const w = q[3] / length;

	return [
		1 - 2 * ( y * y + z * z ), 2 * ( x * y + z * w ), 2 * ( x * z - y * w ),
		2 * ( x * y - z * w ), 1 - 2 * ( x * x + z * z ), 2 * ( y * z + x * w ),
		2 * ( x * z + y * w ), 2 * ( y * z - x * w ), 1 - 2 * ( x * x + y * y ),
	];
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the rotation of a matrix by making its columns unit length and at
 * right angles (Gram-Schmidt). A mirror is left out, so the answer is
 * always a rotation. If the matrix flattens space, the answer is the
 * identity.
 * @param {IMatrix33} m The matrix.
 * @returns {IMatrix33} The rotation.
 */
///////////////////////////////////////////////////////////////////////////////

export const rotationFromMatrix = ( m: Readonly<IMatrix33> ) : IMatrix33 =>
{
	const dot = ( a: number[], b: number[] ) => ( ( a[0] * b[0] ) + ( a[1] * b[1] ) + ( a[2] * b[2] ) );
	const columns: number[][] = [];
	for ( let i = 0; i < 3; ++i )
	{
		const column = [ m[i * 3], m[i * 3 + 1], m[i * 3 + 2] ];

		// Take away the parts along the columns before it.
		for ( const before of columns )
		{
			const d = dot ( column, before );
			column[0] -= d * before[0];
			column[1] -= d * before[1];
			column[2] -= d * before[2];
		}

		// Make it unit length.
		const length = Math.sqrt ( dot ( column, column ) );
		if ( length < TOLERANCE )
		{
			return [ ...IDENTITY_33 ];
		}
		columns.push ( column.map ( ( value ) => ( value / length ) ) );
	}

	// If it's a mirror, turn the last column around to make it a rotation.
	const answer = columns.flat() as IMatrix33;
	if ( determinant33 ( answer ) < 0 )
	{
		answer[6] = -answer[6];
		answer[7] = -answer[7];
		answer[8] = -answer[8];
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * See if a 3x3 matrix is the identity, give or take round-off.
 * @param {IMatrix33} m The matrix.
 * @returns {boolean} True if it is.
 */
///////////////////////////////////////////////////////////////////////////////

export const isIdentity33 = ( m: Readonly<IMatrix33> ) : boolean =>
{
	return m.every ( ( value, i ) => ( Math.abs ( value - IDENTITY_33[i] ) < TOLERANCE ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Split a node's transform into a transform that only rotates and
 * translates, and a leftover for its children.
 * @param {IGltfNode} node The node.
 * @param {number} index The index of the node, for errors.
 * @param {IMatrix33 | null} above The leftover from the nodes above, if any.
 * @returns {INodeSplit} The transform and the leftover.
 */
///////////////////////////////////////////////////////////////////////////////

export const splitNodeTransform = ( node: Readonly<IGltfNode>, index: number, above: ( Readonly<IMatrix33> | null ) ) : INodeSplit =>
{
	// Check the sizes of the arrays.
	const check = ( array: ( readonly number[] | undefined ), size: number, name: string ) : void =>
	{
		if ( ( undefined !== array ) && ( size !== array.length ) )
		{
			throw new Error ( `Node ${index} has a ${name} with ${array.length} numbers instead of ${size}` );
		}
	};
	check ( node.matrix, 16, "matrix" );
	check ( node.translation, 3, "translation" );
	check ( node.rotation, 4, "rotation" );
	check ( node.scale, 3, "scale" );

	// Get the translation, the 3x3 part, and its rotation. The matrix is
	// column-major. Otherwise the 3x3 part is the rotation times the scale.
	let t: number[];
	let linear: IMatrix33;
	let rotation: IMatrix33;
	const m = node.matrix;
	if ( m )
	{
		t = [ m[12], m[13], m[14] ];
		linear = [ m[0], m[1], m[2],   m[4], m[5], m[6],   m[8], m[9], m[10] ];
		rotation = rotationFromMatrix ( linear );
	}
	else
	{
		t = ( node.translation ?? [ 0, 0, 0 ] );
		rotation = ( node.rotation ? rotationFromQuaternion ( node.rotation ) : [ ...IDENTITY_33 ] );
		const [ sx, sy, sz ] = ( node.scale ?? [ 1, 1, 1 ] );
		linear = multiply33 ( rotation, [ sx, 0, 0,   0, sy, 0,   0, 0, sz ] );
	}

	// The leftover from above moves the translation.
	const a = ( above ?? IDENTITY_33 );
	const translation = [
		( a[0] * t[0] ) + ( a[3] * t[1] ) + ( a[6] * t[2] ),
		( a[1] * t[0] ) + ( a[4] * t[1] ) + ( a[7] * t[2] ),
		( a[2] * t[0] ) + ( a[5] * t[1] ) + ( a[8] * t[2] ),
	];

	// The new leftover.
	let leftover: ( IMatrix33 | null ) = multiply33 ( transpose33 ( rotation ), multiply33 ( a, linear ) );
	if ( isIdentity33 ( leftover ) )
	{
		leftover = null;
	}

	// The transform. Don't make one that does nothing.
	const r = rotation;
	let matrix: ( IMatrix44 | null ) = [
		r[0], r[1], r[2], 0,
		r[3], r[4], r[5], 0,
		r[6], r[7], r[8], 0,
		translation[0], translation[1], translation[2], 1,
	];
	if ( ( 0 === translation[0] ) && ( 0 === translation[1] ) && ( 0 === translation[2] ) && isIdentity33 ( rotation ) )
	{
		matrix = null;
	}

	return { matrix, leftover };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Multiply the points by the matrix.
 * @param {Float32Array} points The points, three numbers each.
 * @param {IMatrix33} m The matrix.
 * @returns {Float32Array} The new points.
 */
///////////////////////////////////////////////////////////////////////////////

export const transformPoints = ( points: Readonly<Float32Array>, m: Readonly<IMatrix33> ) : Float32Array =>
{
	const answer = new Float32Array ( points.length );
	for ( let i = 0; i < points.length; i += 3 )
	{
		const x = points[i];
		const y = points[i + 1];
		const z = points[i + 2];
		answer[i    ] = ( m[0] * x ) + ( m[3] * y ) + ( m[6] * z );
		answer[i + 1] = ( m[1] * x ) + ( m[4] * y ) + ( m[7] * z );
		answer[i + 2] = ( m[2] * x ) + ( m[5] * y ) + ( m[8] * z );
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Transform the normals for points multiplied by the matrix, and make them
 * unit length. Normals are multiplied by the inverse transpose of the
 * matrix, so that they stay at right angles to the surface. This uses the
 * cofactor matrix, which is the inverse transpose times the determinant, so
 * it works even when the matrix has no inverse.
 * @param {Float32Array} normals The normals, three numbers each.
 * @param {IMatrix33} m The matrix the points are multiplied by.
 * @returns {Float32Array} The new normals.
 */
///////////////////////////////////////////////////////////////////////////////

export const transformNormals = ( normals: Readonly<Float32Array>, m: Readonly<IMatrix33> ) : Float32Array =>
{
	// The cofactor matrix. Turn it around for a mirror, because the
	// determinant is negative then.
	const sign = ( ( determinant33 ( m ) < 0 ) ? -1 : 1 );
	const c: IMatrix33 = [
		sign * ( ( m[4] * m[8] ) - ( m[5] * m[7] ) ),
		sign * ( ( m[5] * m[6] ) - ( m[3] * m[8] ) ),
		sign * ( ( m[3] * m[7] ) - ( m[4] * m[6] ) ),
		sign * ( ( m[2] * m[7] ) - ( m[1] * m[8] ) ),
		sign * ( ( m[0] * m[8] ) - ( m[2] * m[6] ) ),
		sign * ( ( m[1] * m[6] ) - ( m[0] * m[7] ) ),
		sign * ( ( m[1] * m[5] ) - ( m[2] * m[4] ) ),
		sign * ( ( m[2] * m[3] ) - ( m[0] * m[5] ) ),
		sign * ( ( m[0] * m[4] ) - ( m[1] * m[3] ) ),
	];

	// Transform them, and make them unit length.
	const answer = transformPoints ( normals, c );
	for ( let i = 0; i < answer.length; i += 3 )
	{
		const length = Math.hypot ( answer[i], answer[i + 1], answer[i + 2] );
		if ( length > 0 )
		{
			answer[i    ] /= length;
			answer[i + 1] /= length;
			answer[i + 2] /= length;
		}
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Turn each triangle around by swapping its last two indices. A mirror
 * turns the triangles around, so this turns them back.
 * @param {Uint16Array | Uint32Array} indices The indices, three per triangle.
 * @returns {Uint16Array | Uint32Array} The new indices.
 */
///////////////////////////////////////////////////////////////////////////////

export const flipTriangles = ( indices: Readonly<Uint16Array | Uint32Array> ) : ( Uint16Array | Uint32Array ) =>
{
	const answer = indices.slice();
	for ( let i = 0; ( i + 2 ) < answer.length; i += 3 )
	{
		answer[i + 1] = indices[i + 2];
		answer[i + 2] = indices[i + 1];
	}
	return answer;
};
