
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

import { useEffect, useRef, useState } from "react";
import {
	getDevice,
	getRenderingContext,
	Viewer,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	// Get state.
	const [ device, setDevice ] = useState < GPUDevice | null > ( null );
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ viewer, setViewer ] = useState < Viewer | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		void ( async () =>
		{
			setDevice ( await getDevice() );
		} ) ();
	},
	[] );

	//
	// Called when the device changes.
	//
	useEffect ( () =>
	{
		if ( device && canvas.current )
		{
			const context = getRenderingContext ( device, canvas.current );
			setViewer ( new Viewer ( canvas.current ) );
		}
	},
	[ device ] );

	//
	// Called when the viewer changes.
	//
	useEffect ( () =>
	{
		// Handle when these are invalid.
		if ( ( !viewer ) || ( !canvas.current ) || ( !device ) )
		{
			return;
		}

		// Observe changes to the canvas size.
		// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html#a-resizing
		const observer = new ResizeObserver ( ( items ) =>
		{
			// There can be only one.
			const item = items[0];
			const { inlineSize: width, blockSize: height } = item.contentBoxSize[0];
			const { maxTextureDimension2D: maxDimension } = device.limits;

			// Set the canvas size.
			// The canvas size must be in the range [1, maxTextureDimension2D].
			const canvas = ( item.target as HTMLCanvasElement );
			canvas.width  = Math.max ( 1, Math.min ( width,  maxDimension ) );
			canvas.height = Math.max ( 1, Math.min ( height, maxDimension ) );

			// Set the viewer's size.
			viewer.size = { width, height };
		} );
		observer.observe ( canvas.current );
	},
	[ device, viewer ] );

	// console.log ( "Rendering app" );

	//
	// Render the components.
	//
	return (
		<div
			style = { {
				height: "100vh",
				overflow: "hidden",
				background: "#223344",
			} }
		>
			<canvas
				style = { {
					width: "100vw",
					height: "100vh",
					background: "transparent",
				} }
				ref = { canvas }
			>
			</canvas>
		</div>
	);
}
