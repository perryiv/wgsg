
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
import { useEffect, useRef, useState } from "react";
import {
	Device,
	Geometry,
	Group,
	IDENTITY_MATRIX,
	Viewer as InternalViewer,
	Transform,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing below.
//
///////////////////////////////////////////////////////////////////////////////

const root: Group = ( () =>
{
	const root = new Group();

	{
		const tr = new Transform();
		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 10, 0, 0 ] );
		tr.addChild ( new Geometry() );
		tr.addChild ( new Geometry() );
		root.addChild ( tr );
	}

	{
		const tr = new Transform();
		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );
		tr.addChild ( new Geometry() );
		tr.addChild ( new Geometry() );
		tr.addChild ( new Geometry() );
		tr.addChild ( new Geometry() );
		root.addChild ( tr );
	}

	return root;
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
	const [ , setDevice ] = useState < Device | null > ( null );
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

			const device = await Device.create();

			if ( !device )
			{
				throw new Error ( "Invalid device" );
			}

			setDevice ( device );

			{
				const gd: GPUDevice = device.device;
				void gd.lost.then ( ( { reason }: GPUDeviceLostInfo ) =>
				{
					console.log ( "Context lost because: ", reason );
				} );
			}

			const viewer = new InternalViewer ( { device, canvas: canvas.current } );
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
