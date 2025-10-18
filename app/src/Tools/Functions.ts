///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

import { mat4 } from "gl-matrix";
import {
	Geometry,
	Group,
	IDENTITY_MATRIX,
	Indexed,
	Node,
	SolidColor,
	Sphere,
	State,
	Transform,
} from "wgsg-lib";
import type {
	IVector2,
	IVector3,
	IVector4,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildSceneSpheres = () =>
{
	const root = new Group();

	{
		const tr = new Transform();
		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 10, 0, 0 ] );
		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
		root.addChild ( tr );
	}

	{
		const tr = new Transform();
		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );
		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
		tr.addChild ( new Sphere ( { center: [ 4, 0, 0 ] } ) );
		tr.addChild ( new Sphere ( { center: [ 6, 0, 0 ] } ) );
		root.addChild ( tr );
	}

	return root;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

const makeQuad = ( { origin, size, color, topology } :
	{ origin?: IVector3, size?: IVector2, color?: IVector4, topology?: GPUPrimitiveTopology } ) =>
{
	const shader = SolidColor.instance;

	// Give the input default values if needed.
	origin ??= [ 0.0, 0.0, 0.0 ];
	size ??= [ 1.0, 1.0 ];
	color ??= [ 0.5, 0.5, 0.5, 1.0 ];
	topology ??= "triangle-list";

	// The points are the same for both topologies.
	const points = new Float32Array ( [
		origin[0],           origin[1],           origin[2],
		origin[0] + size[0], origin[1],           origin[2],
		origin[0],           origin[1] + size[1], origin[2],
		origin[0] + size[0], origin[1] + size[1], origin[2],
	] );

	// Make the indices based on the topology.
	const indices = ( ( topology === "line-list" ) ?
		( new Uint32Array ( [ 0, 1, 1, 3, 3, 2, 2, 0 ] ) ) :
		( new Uint32Array ( [ 0, 1, 2, 1, 3, 2 ] ) )
	);

	// Make the primitives.
	const primitives = new Indexed ( { mode: topology, indices } );

	// Make a copy of the color because we capture it below.
	color = [ ...color ];

	// Make the state.
	const state = new State ( {
		name: `State with ${color.join(", ")} ${topology}`,
		shader,
		topology,
		apply: ( () =>
		{
			shader.color = color;
		} )
	} );

	// Return the new geometry.
	return new Geometry ( { points, primitives, state } );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildSceneQuads = () : Node =>
{
	const group = new Group();

	const num = 20;
	const w = 2.0 / num;
	const h = 2.0 / num;

	const start = Date.now();
	let count = 0;

	for ( let i = 0; i < num; ++i )
	{
		for ( let j = 0; j < num; ++j )
		{
			const x = -1 + ( i * w );
			const y = -1 + ( j * h );

			const r = ( 0.1 + 0.8 * Math.random() );
			const g = ( 0.1 + 0.8 * Math.random() );
			const b = ( 0.1 + 0.8 * Math.random() );

			group.addChild ( makeQuad ( {
				origin: [ x, y, 0.0 ],
				size: [ w, h ],
				color: [ r, g, b, 1.0 ],
				topology: "triangle-list"
			} ) );

			++count;
		}
	}

	console.log ( `Creating ${count} quads took ${Date.now() - start} ms` );

	return group;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildTwoSquares = () : Node =>
{
	const group = new Group();

	{
		const geom = makeQuad ( {
			origin: [ -0.9, -0.9, 0.0 ],
			size: [ 1.0, 1.0 ],
			color: [ 8.0, 0.2, 0.2, 1.0 ],
			topology: "triangle-list",
		} );
		group.addChild ( geom );
	}
	{
		const geom = makeQuad ( {
			origin: [ -0.1, -0.1, 0.0 ],
			size: [ 1.0, 1.0 ],
			color: [ 0.0, 1.0, 0.0, 1.0 ],
			topology: "line-list",
		} );
		group.addChild ( geom );
	}

	return group;
};
