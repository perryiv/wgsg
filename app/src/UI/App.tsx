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
import { useCallback, useEffect, useMemo, useState } from "react";
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
	const viewers = useViewerStore ( ( state ) => state.viewers );
	const [ count, setCount ] = useState ( 0 );

	//
	// Handle the "allow animations" button.
	//
	const handleAllowAnimations = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			const { animations } = viewer.options;
			animations.allow = !animations.allow;
			setCount ( count + 1 );
		}
	},
	[ count, viewers ] );

	//
	// Render the 3D viewer.
	//
	const handleViewerRender = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			viewer.requestRender();
		}
	},
	[ viewers ] );

	//
	// Reset the viewer's camera.
	//
	const handleViewerReset = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			viewer.viewAll ( { resetRotation: true } );
			viewer.requestRender();
		}
	},
	[ viewers ] );

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
	// Return the text for allowing animations.
	//
	const allowAnimationsText = useMemo ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( !viewer )
		{
			return "Animation state unknown";
		}
		return `Allow animations ${ viewer.options.animations.allow ? " on" : " off" }`;
	},
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[ count, viewers ] );

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

	console.log ( "Rendering app" );

	//
	// If there's no viewer then do not render the panel.
	//
	const renderPanel = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( !viewer )
		{
			return null;
		}

		return (
			<Panel>
				<div
					style = { {
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
					} }
				>
					<Button onClick = { handleAllowAnimations } >
						{ allowAnimationsText }
					</Button>
					<Button onClick = { handleViewerRender } >
						Render viewer
					</Button>
					<Button onClick = { handleViewerReset } >
						Reset navigation
					</Button>
					<Button onClick = { handleSimulateDeviceLost } >
						Simulate device lost
					</Button>
				</div>
			</Panel>
		)
	}, [
		allowAnimationsText,
		handleAllowAnimations,
		handleSimulateDeviceLost,
		handleViewerRender,
		handleViewerReset,
		viewers,
	] );

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
			{ renderPanel() }
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
