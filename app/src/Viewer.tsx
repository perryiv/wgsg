
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
	Node,
	Sphere,
	State,
	Transform,
	TriangleSolidColor,
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
			shader: new TriangleSolidColor ( {
				color
			} )
		} )
	} );
};

const root: Node = ( () =>
{
	const group = new Group();
	group.addChild ( makeQuad (
		[  0.0,  0.0,  0.0 ],
		[  0.5,  0.5 ],
		[  0.2,  0.8,  0.2,  1.0 ]
	) );
	group.addChild ( makeQuad (
		[ -0.5, -0.5, 0.0 ],
		[  0.5,  0.5 ],
		[  0.8,  0.2,  0.2,  1.0 ]
	) );
	group.addChild ( makeQuad (
		[ 0.0, -0.5,  0.0 ],
		[ 0.5,  0.5 ],
		[ 0.2,  0.2,  0.8,  1.0 ]
	) );
	group.addChild ( makeQuad (
		[ -0.5,  0.0,  0.0 ],
		[  0.5,  0.5 ],
		[  0.8,  0.8,  0.2,  1.0 ]
	) );
	return group;
} ) ();


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

			if ( !Device.instance )
			{
				throw new Error ( "Invalid device" );
			}

			void Device.instance.device.lost.then ( ( { reason }: GPUDeviceLostInfo ) =>
			{
				console.log ( "Context lost because: ", reason );
			} );

			const viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = root;
			setViewer ( viewer );

			console.log ( "Internal viewer created and configured" );
		} ) ();

		return ( () =>
		{
			console.log ( "Viewer component unmounted" );
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
