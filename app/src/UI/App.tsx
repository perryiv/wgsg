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

import { useCallback, useEffect } from "react";
import { Viewer } from "./Viewer";
import { Panel } from "./Panel";
import { Button } from "./Button";
import { Device } from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	//
	// Simulate a lost device.
	//
	const handleSimulateDeviceLost = useCallback ( () =>
	{
		// This is a reasonably good test.
		Device.destroy();

		// For a better test, use "about:gpucrash" as described here:
		// https://toji.dev/webgpu-best-practices/device-loss.html
	},
	[] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "App component mounted" );

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
				background: "linear-gradient(#DDEEFF,#778899)"
			} }
		>
			<Panel>
				<Button
					label = "Simulate device lost"
					onClick = { handleSimulateDeviceLost }
				/>
			</Panel>
			<Viewer
				style = { {
					width: "100vw",
					height: "100vh",
					background: "transparent",
				} }
			/>
		</div>
	);
}
