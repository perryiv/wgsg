
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
	Indexed,
	Viewer as InternalViewer,
	Node,
	Sphere,
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

const root: Node = ( () =>
{
	const geom = new Geometry();

	geom.points = [
		0.0, 0.0, 0.0,
		0.5, 0.0, 0.0,
		0.0, 0.5, 0.0,
		0.5, 0.5, 0.0,
	];

	geom.primitives = new Indexed ( {
		mode: "triangle-list",
		indices: [
			0, 1, 2,
		]
	} );

	return geom;

	// return new Sphere ( { center: [ 0, 0, 0 ] } );
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
