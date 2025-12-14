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

import { Button } from "./Button";
import { Device } from "../../../lib/src";
import { Panel } from "./Panel";
import { useCallback, useEffect } from "react";
import { useViewerStore } from "../State";
import { Viewer, VIEWER_NAME } from "./Viewer";


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	// Get state.
	const getViewer = useViewerStore ( ( state ) => state.getViewer );

	//
	// Get the viewer or throw an execption.
	//
	const getViewerOrThrow = useCallback ( () =>
	{
		const viewer = getViewer ( VIEWER_NAME );
		if ( !viewer )
		{
			throw new Error ( `No viewer with name: ${VIEWER_NAME}` );
		}
		return viewer;
	},
	[ getViewer ] );

	//
	// Render the 3D viewer.
	//
	const handleViewerRender = useCallback ( () =>
	{
		const viewer = getViewerOrThrow();
		viewer.requestRender();
	},
	[ getViewerOrThrow ] );

	//
	// Reset the viewer's camera.
	//
	const handleViewerReset = useCallback ( () =>
	{
		const viewer = getViewerOrThrow();
		viewer.viewAll ( { resetRotation: true } );
	},
	[ getViewerOrThrow ] );

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
				<div
					style = { {
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
					} }
				>
					<Button onClick = { handleViewerReset } >
						Reset navigation
					</Button>
					<Button onClick = { handleViewerRender } >
						Render viewer
					</Button>
					<Button onClick = { handleSimulateDeviceLost } >
						Simulate device lost
					</Button>
				</div>
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
