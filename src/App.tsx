
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
import { getDevice, getRenderingContext } from "./WebGPU";


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	// Get state.
	const [ token, setToken ] = useState < number > ( 0 );
	const device = useRef < GPUDevice | null > ( null );
	const canvas = useRef < HTMLCanvasElement | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		void ( async () =>
		{
			device.current = await getDevice();
			setToken ( ( current ) => { return ( current + 1 ) } );
		} ) ();
	},
	[] );

	//
	// Called when the token changes.
	//
	useEffect ( () =>
	{
		if ( device.current && canvas.current )
		{
			const context = getRenderingContext ( device.current, canvas.current );
			console.log ( "Rendering context:", context );
		}
	},
	[ token ] );

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
