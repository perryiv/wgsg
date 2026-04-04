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
import { Device, Trackball } from "../../../lib/src";
import { Panel } from "./Panel";
import { useCallback, useEffect, useState } from "react";
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
			console.log ( `Allow animations: ${animations.allow}` );
		}
	},
	[ count, viewers ] );

	//
	// Handle the trackball mode button.
	//
	const handleTrackballMode = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			const { navBase: trackball } = viewer;
			if ( trackball instanceof Trackball )
			{
				trackball.mode = "track_ball";
				setCount ( count + 1 );
			}
		}
	},
	[ count, viewers ] );

	//
	// Handle the turntable mode button.
	//
	const handleTurntableMode = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			const { navBase: trackball } = viewer;
			if ( trackball instanceof Trackball )
			{
				trackball.mode = "turn_table";
				setCount ( count + 1 );
			}
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
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		// console.log ( "App component mounted" );

		return ( () =>
		{
			// console.log ( "App component unmounted" );
		} );
	},
	[] );

	// console.log ( "Rendering app" );

	//
	// Return a vertical space.
	//
	const verticalSpace = useCallback ( ( height?: number ) =>
	{
		height ??= 10;

		return (
			<div style = { { height: `${height}px` } } />
		);
	},
	[] );

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
					<Button
						onClick = { handleTrackballMode }
						value = { "track_ball" === viewer.navBase.rotationMode }
						radio = { true }
					>
						Trackball rotation
					</Button>
					<Button
						onClick = { handleTurntableMode }
						value = { "turn_table" === viewer.navBase.rotationMode }
						radio = { true }
					>
						Turntable rotation
					</Button>
					{ verticalSpace() }
					<Button
						onClick = { handleAllowAnimations }
						value = { viewer.options.animations.allow }
					>
						Allow animations
					</Button>
					{ verticalSpace() }
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
		handleAllowAnimations,
		handleSimulateDeviceLost,
		handleTrackballMode,
		handleTurntableMode,
		handleViewerRender,
		handleViewerReset,
		verticalSpace,
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
