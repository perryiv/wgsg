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
	buildTriangleEdges,
	DEG_TO_RAD,
	Geometry,
	Group,
	IDENTITY_MATRIX,
	Indexed,
	Node,
	SolidColor,
	Sphere,
	SphereNode,
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
//	Make a state object with solid color.
//
///////////////////////////////////////////////////////////////////////////////

export const makeSolidColorState = ( { color, topology } :
	{ color: IVector4, topology: GPUPrimitiveTopology } ) : State =>
{
	// Make a copy of the color because we capture it below.
	color = [ color[0], color[1], color[2], color[3] ];

	// Shortcut.
	const shader = SolidColor.instance;

	// Make the state.
	return new State ( {
		name: `State with ${color.join(", ")} ${topology}`,
		shader,
		topology,
		apply: ( () =>
		{
			shader.color = color;
		} )
	} );
}


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildSceneSphere = ( sphere: Sphere ) =>
{
	const root = new Group();

	const node = new SphereNode ( {
		center: sphere.center,
		radius: sphere.radius,
		numSubdivisions: 4,
	} );
	node.state = makeSolidColorState ( {
		color: [ 0.8, 0.2, 0.2, 1.0 ],
		topology: "triangle-list"
	} );
	root.addChild ( node );

	node.update();
	const lines = buildTriangleEdges ( node );
	if ( lines )
	{
		lines.state = makeSolidColorState ( {
			color: [ 0.0, 0.0, 0.0, 1.0 ],
			topology: "line-list"
		} );
	}
	root.addChild ( lines );

	return root;
};


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
		tr.addChild ( new SphereNode ( { center: [ 0, 0, 0 ] } ) );
		tr.addChild ( new SphereNode ( { center: [ 2, 0, 0 ] } ) );
		root.addChild ( tr );
	}

	{
		const tr = new Transform();
		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );
		tr.addChild ( new SphereNode ( { center: [ 0, 0, 0 ] } ) );
		tr.addChild ( new SphereNode ( { center: [ 2, 0, 0 ] } ) );
		tr.addChild ( new SphereNode ( { center: [ 4, 0, 0 ] } ) );
		tr.addChild ( new SphereNode ( { center: [ 6, 0, 0 ] } ) );
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
	// Give the input default values if needed.
	origin ??= [ 0.0, 0.0, 0.0 ];
	size ??= [ 1.0, 1.0 ];
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

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( color )
	{
		geom.state = makeSolidColorState ( { color, topology } );
	}

	// Return the new geometry.
	return geom;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make the corners of a box.
//
///////////////////////////////////////////////////////////////////////////////

export const makeCorners = ( { center, size } : { center?: IVector3, size?: IVector3 } ) : Float32Array =>
{
	// Give the input default values if needed.
	center ??= [ 0.0, 0.0, 0.0 ];
	size ??= [ 1.0, 1.0, 1.0 ];

	// Half the size.
	const hs = [ ( size[0] * 0.5 ), ( size[1] * 0.5 ), ( size[2] * 0.5 ) ];

	// The extreme values.
	const xMin = ( center[0] - hs[0] );
	const xMax = ( center[0] + hs[0] );
	const yMin = ( center[1] - hs[1] );
	const yMax = ( center[1] + hs[1] );
	const zMin = ( center[2] - hs[2] );
	const zMax = ( center[2] + hs[2] );

	// The points are the corners.
	return new Float32Array ( [
		xMin, yMin, zMin,
		xMax, yMin, zMin,
		xMin, yMax, zMin,
		xMax, yMax, zMin,
		xMin, yMin, zMax,
		xMax, yMin, zMax,
		xMin, yMax, zMax,
		xMax, yMax, zMax,
	] );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

const makeBox = ( { center, size, color, topology } :
	{ center?: IVector3, size?: IVector3, color?: IVector4, topology?: GPUPrimitiveTopology } ) =>
{
	// Give the input default values if needed.
	topology ??= "triangle-list";

	// The points are the same for both topologies.
	const points = makeCorners ( { center, size } );

	// Make the indices based on the topology.
	const indices = ( ( topology === "line-list" ) ?
		( new Uint32Array ( [
				0, 1, 1, 3, 3, 2, 2, 0,
				0, 4, 1, 5, 3, 7, 2, 6,
				4, 5, 5, 7, 7, 6, 6, 4
			] ) ) :
		( new Uint32Array ( [ 0, 1, 2, 1, 3, 2 ] ) )
	);

	// Make the primitives.
	const primitives = new Indexed ( { mode: topology, indices } );

	// Make the new geometry.
	const geom = new Geometry ( { points, primitives } );

	// Were we given a color?
	if ( color )
	{
		geom.state = makeSolidColorState ( { color, topology } );
	}

	// Return the new geometry.
	return geom;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildSceneQuads = () : Node =>
{
	const group = new Group();

	const num = 50;
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

			const quads = makeQuad ( {
				origin: [ x, y, 0.0 ],
				size: [ w, h ],
				color: [ r, g, b, 1.0 ],
				topology: "triangle-list"
			} );
			group.addChild ( quads );

			// const lines = buildTriangleEdges ( quads );
			// if ( lines )
			// {
			// 	lines.state = makeSolidColorState ( {
			// 		color: [ 0.0, 0.0, 0.0, 1.0 ],
			// 		topology: "line-list"
			// 	} );
			// }
			// group.addChild ( lines );

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

export const buildSceneTwoSquares = () : Node =>
{
	const group = new Group();

	group.addChild ( makeQuad ( {
		origin: [ -0.9, -0.9, -2.0 ],
		size: [ 1.0, 1.0 ],
		color: [ 8.0, 0.2, 0.2, 1.0 ],
		topology: "triangle-list",
	} ) );

	group.addChild ( makeQuad ( {
		origin: [ -0.1, -0.1, -2.0 ],
		size: [ 1.0, 1.0 ],
		color: [ 0.2, 0.8, 0.2, 1.0 ],
		topology: "line-list",
	} ) );

	return group;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

export const buildSceneBox = () : Node =>
{
	const tr = new Transform();

	tr.translate ( [ 0.0, 0.0, -3.0 ] );
	tr.rotate ( (  15 * DEG_TO_RAD ), [ 1, 0, 0 ] );
	tr.rotate ( ( -30 * DEG_TO_RAD ), [ 0, 1, 0 ] );

	tr.addChild ( makeBox ( {
		center: [ 0.0, 0.0, 0.0 ],
		size:   [ 1.0, 1.0, 1.0 ],
		color:  [ 0.8, 0.2, 0.2, 1.0 ],
		topology: "line-list",
	} ) );

	return tr;
};
