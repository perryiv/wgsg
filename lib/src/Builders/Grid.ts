///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for a grid.
//
///////////////////////////////////////////////////////////////////////////////

import { Color as ColorAttribute } from "../Scene/State/Attributes/Color";
import { Geometry } from "../Scene/Nodes/Shapes/Geometry";
import { Indexed } from "../Scene/Primitives/Indexed";
import { SolidColor } from "../Shaders";
import type { IVector2, IVector3, IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IGridBuilderInput
{
	color?: IVector4;
	center: IVector3;    // x, y, z
	size: IVector2;      // x, z
	numLines?: IVector2; // x, z
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Build a grid.
 * @param {IGridBuilderInput} [input] - Input for building the grid.
 * @returns {Geometry} The built grid geometry.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildGrid = ( input: IGridBuilderInput ) : Geometry =>
{
	// Get the input.
	const { center, size, numLines = [ 11, 11 ] } = input;

	// Make the points for the lines of the grid and trivial indices.
	const points: number[] = [];
	const indices: number[] = [];

	// Shortcuts.
	const numLinesX = numLines[0];
	const numLinesZ = numLines[1];
	const sx = size[0];
	const sz = size[1];
	const hsx = sx * 0.5;
	const hsz = sz * 0.5;
	const startX = center[0] - hsx;
	const endX   = center[0] + hsx;
	const startZ = center[2] - hsz;
	const endZ   = center[2] + hsz;
	let count = 0;

	// Loop through the lines in the X direction.
	for ( let i = 0; i < numLinesX; ++i )
	{
		const x = startX + ( sx / ( numLinesX - 1 ) ) * i;
		points.push ( x, center[1], startZ );
		points.push ( x, center[1], endZ );
		indices.push ( count++ );
		indices.push ( count++ );
	}

	// Loop through the lines in the Z direction.
	for ( let j = 0; j < numLinesZ; ++j )
	{
		const z = startZ + ( sz / ( numLinesZ - 1 ) ) * j;
		points.push ( startX, center[1], z );
		points.push (   endX, center[1], z );
		indices.push ( count++ );
		indices.push ( count++ );
	}

	// Make the primitives.
	const topology = "line-list";
	const primitives = new Indexed ( { topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Set the geometry's points.
	geom.points = new Float32Array ( points );

	// Were we given a color?
	if ( input?.color )
	{
		const state = SolidColor.makeState ( { topology } );
		state.addAttribute ( new ColorAttribute ( input.color ) );
		geom.state = state;
	}
	
	// Return the new geometry.
	return geom;
}
