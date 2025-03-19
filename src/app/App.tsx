
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
import { getDevice, getRenderingContext } from "../lib/tools/WebGPU";


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	// Get state.
	// const [ token, setToken ] = useState < number > ( 0 );
	const [ device, setDevice ] = useState < GPUDevice | null > ( null );
	const canvas = useRef < HTMLCanvasElement | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		void ( async () =>
		{
			setDevice ( await getDevice() );
			// setToken ( ( current ) => { return ( current + 1 ) } );
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
			console.log ( "Rendering context:", context );
		}
	},
	[ device ] );

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
