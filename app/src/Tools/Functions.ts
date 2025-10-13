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

const makeQuad = ( origin: IVector3, size: IVector2, color: IVector4 ) =>
{
	const shader = SolidColor.instance;
	color = [ ...color ]; // Make a copy.
	return new Geometry ( {
		points: [
			origin[0],           origin[1],           origin[2],
			origin[0] + size[0], origin[1],           origin[2],
			origin[0],           origin[1] + size[1], origin[2],
			origin[0] + size[0], origin[1] + size[1], origin[2],
		],
		primitives: new Indexed ( {
			mode: "triangle-list",
			indices: [
				0, 1, 2,
				1, 3, 2,
			]
		} ),
		state: new State ( {
			// A unique name is needed for each state associated with a given shader.
			name: `State with color [${color.join ( ", " )}]`,
			shader,
			apply: ( () =>
			{
				// console.log ( `Applying state with color [${color.join ( ", " )}]` );
				shader.color = color;
			} )
		} )
	} );
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

			group.addChild ( makeQuad (
				[ x, y, 0.0 ],
				[ w, h ],
				[ r, g, b, 1.0 ]
			) );

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
		const geom = makeQuad (
			[ -0.9, -0.9, 0.0 ],
			[ 1.0, 1.0 ],
			[ 1.0, 0.0, 0.0, 1.0 ]
		);
		group.addChild ( geom );
	}
	{
		const geom = makeQuad (
			[ -0.1, -0.1, 0.0 ],
			[ 1.0, 1.0 ],
			[ 0.0, 1.0, 0.0, 1.0 ]
		);
		const color: IVector4 = [ 0.0, 0.0, 0.0, 1.0 ];
		geom.state = new State ( {
			name: `State with ${color.join(", ")} lines`,
			shader: SolidColor.instance,
			topology: "line-list",
			apply: ( () =>
			{
				SolidColor.instance.color = color;
			} ),
		} );
		group.addChild ( geom );
	}

	return group;
};
