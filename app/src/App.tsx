
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
	getDeviceData,
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
	const [ , setDevice ] = useState < GPUDevice | null > ( null );
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ , setViewer ] = useState < Viewer | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "App component mounted" );

		void ( async () =>
		{
			if ( !canvas.current )
			{
				throw new Error ( "Invalid canvas element" );
			}

			const { device } = await getDeviceData();

			if ( !device )
			{
				throw new Error ( "Invalid device" );
			}

			setDevice ( device );

			void device.lost.then ( ( { reason }: GPUDeviceLostInfo ) =>
			{
				console.log ( "Context lost because: ", reason );
			} );

			setViewer ( new Viewer ( { device, canvas: canvas.current } ) );

			console.log ( "Viewer created and configured" );
		} ) ();

		return ( () =>
		{
			console.log ( "App component unmounted" );
		} );
	},
	[] );

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
