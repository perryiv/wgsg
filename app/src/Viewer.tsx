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

import { useEffect, useRef, useState } from "react";
import {
	Device,
	Geometry,
	Group,
	Indexed,
	Manager as ShaderManager,
	Node,
	State,
	type IVector2,
	type IVector3,
	type IVector4,
	Viewer as InternalViewer,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing below.
//
///////////////////////////////////////////////////////////////////////////////

// const root: Node = ( () =>
// {
// 	const root = new Group();

// 	{
// 		const tr = new Transform();
// 		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 10, 0, 0 ] );
// 		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
// 		root.addChild ( tr );
// 	}

// 	{
// 		const tr = new Transform();
// 		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );
// 		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 4, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 6, 0, 0 ] } ) );
// 		root.addChild ( tr );
// 	}

// 	return root;
// } ) ();

const makeQuad = ( origin: IVector3, size: IVector2, color: IVector4 ) =>
{
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
			shader: ShaderManager.instance.get ( "TriangleSolidColor" ),
			apply: ( ( { pass, shader } ) =>
			{
				shader.color = color;
				pass.setBindGroup ( 0, shader.bindGroup );
			} )
		} )
	} );
};

const buildScene = () : Node =>
{
	const group = new Group();

	const num = 2;
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
//	Viewer props.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerProps
{
	style?: React.CSSProperties;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

export function Viewer ( { style }: IViewerProps )
{
	// Get state.
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ , setViewer ] = useState < InternalViewer | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Viewer component mounted" );

		void ( async () =>
		{
			if ( !canvas.current )
			{
				throw new Error ( "Invalid canvas element" );
			}

			await Device.init();

			void Device.instance.device.lost.then ( ( { reason, message }: GPUDeviceLostInfo ) =>
			{
				console.log ( `Context lost, reason: ${reason}, message: ${message}` );
			} );

			console.log ( `Singleton device ${Device.instance.id} initialized` );

			const viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = buildScene();
			setViewer ( viewer );

			console.log ( `Internal viewer ${viewer.id} created and configured` );
		} ) ();

		return ( () =>
		{
			console.log ( "Viewer component unmounted" );

			setViewer ( ( current: ( InternalViewer | null ) ) =>
			{
				if ( current )
				{
					console.log ( `Destroying internal viewer ${current.id}` );
					current.destroy();
				}
				return null;
			} );

			Device.destroy();

			console.log ( "Singleton device destroyed" );
		} );
	},
	[] );

	// console.log ( "Rendering viewer component" );

	//
	// Render the components.
	//
	return (
		<canvas
			style = { style }
			ref = { canvas }
		>
		</canvas>
	);
}
