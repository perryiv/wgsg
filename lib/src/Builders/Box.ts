///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for one or more boxes.
//
///////////////////////////////////////////////////////////////////////////////

import { Geometry, Indexed } from "../Scene";
import { makeSolidColorState } from "./State";
import type { IVector3, IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IBoxBuilderTopologyInput
{
	color?: IVector4;
	topology?: GPUPrimitiveTopology;
}

export interface IBoxBuilderInput1 extends IBoxBuilderTopologyInput
{
	center: IVector3;
	size: IVector3;
}

export interface IBoxBuilderInput2 extends IBoxBuilderTopologyInput
{
	min: IVector3;
	max: IVector3;
}

export type IBoxBuilderInput = ( IBoxBuilderInput1 | IBoxBuilderInput2 )


///////////////////////////////////////////////////////////////////////////////
//
//	Get the input.
//
///////////////////////////////////////////////////////////////////////////////

const getInput = ( mn: IVector3, mx: IVector3, input: IBoxBuilderInput ) : void =>
{
	if ( ( "center" in input ) && ( "size" in input ) )
	{
		const { center: c, size: s } = input;

		const hx = s[0] * 0.5;
		const hy = s[1] * 0.5;
		const hz = s[2] * 0.5;

		mn[0] = c[0] - hx;
		mn[1] = c[1] - hy;
		mn[2] = c[2] - hz;

		mx[0] = c[0] + hx;
		mx[1] = c[1] + hy;
		mx[2] = c[2] + hz;
	}

	else if ( "min" in input && "max" in input )
	{
		const { min: imn, max: imx } = input;

		mn[0] = imn[0];
		mn[1] = imn[1];
		mn[2] = imn[2];

		mx[0] = imx[0];
		mx[1] = imx[1];
		mx[2] = imx[2];
	}
}


///////////////////////////////////////////////////////////////////////////////
//
//	Build a box.
//
///////////////////////////////////////////////////////////////////////////////

export const buildBox = ( input?: IBoxBuilderInput ) : Geometry =>
{
	// Initialize.
	const mn: IVector3 = [ -1, -1, -1 ];
	const mx: IVector3 = [ 1, 1, 1 ];

	// Get the input if we should.
	if ( input )
	{
		getInput ( mn, mx, input );
	}

	// Make the corner points.
	const points = [
		mn[0], mn[1], mn[2],
		mx[0], mn[1], mn[2],
		mn[0], mx[1], mn[2],
		mx[0], mx[1], mn[2],
		mn[0], mn[1], mx[2],
		mx[0], mn[1], mx[2],
		mn[0], mx[1], mx[2],
		mx[0], mx[1], mx[2],
	];

	// Get the topology.
	const topology: GPUPrimitiveTopology = ( ( input?.topology ) ?? "triangle-list" );

	// Make the indices based on the topology.
	let indices: ( Uint16Array | null ) = null;
	switch ( topology )
	{
		case "line-list":
		{
			indices = new Uint16Array ( [
				0, 1, 1, 3, 3, 2, 2, 0, // Every two numbers are a line segment.
				0, 4, 1, 5, 3, 7, 2, 6,
				4, 5, 5, 7, 7, 6, 6, 4
			] );
			break;
		}
		case "triangle-list":
		{
			indices =new Uint16Array ( [
				0, 1, 2, 1, 3, 2, // Every three numbers are a triangle.
				4, 6, 5, 5, 6, 7,
				0, 2, 4, 4, 2, 6,
				1, 5, 3, 3, 5, 7,
				2, 3, 6, 6, 3, 7,
				0, 4, 1, 1, 4, 5
			] );
			break;
		}
	}

	// Handle unsupported topology.
	if ( !indices )
	{
		throw new Error ( `Unsupported topology '${topology}' when building box` );
	}

	// Make the primitives.
	const primitives = new Indexed ( { mode: topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( input?.color )
	{
		geom.state = makeSolidColorState ( { color: input.color, topology } );
	}

	// Return the new geometry.
	return geom;
}
