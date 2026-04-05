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

import { useTheme } from "@mui/material";
import { Button } from "./Button";
import { Panel } from "./Panel";
import { useViewerStore } from "../State";
import { Viewer, VIEWER_NAME } from "./Viewer";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	Device,
	Trackball,
	type IRenderGraphInfo,
} from "../../../lib/src";


///////////////////////////////////////////////////////////////////////////////
//
//	Default (empty) render graph info.
//
///////////////////////////////////////////////////////////////////////////////

const defaultRenderGraphInfo: IRenderGraphInfo = {
	numLayers: 0,
	numBins: 0,
	numPipelines: 0,
	numProjMatrixGroups: 0,
	numViewMatrixGroups: 0,
	numStateGroups: 0,
	numShapes: 0,
	numTriangles: 0,
	numLines: 0,
};


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

	// Get the application state.
	const { palette } = useTheme();

	//
	// Get the background color for the panel.
	//
	const panelBackground = useMemo ( () =>
	{
		// Add alpha to the color.
		return ( palette.background.paper + "5" );
	},
	[ palette ] );

	//
	// Return the formatted viewer render graph info.
	//
	const getRenderGraphInfo = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );

		return ( ( viewer )
			? viewer.cullVisitor.renderGraphInfo
			: defaultRenderGraphInfo
		);
	},
	[ viewers ] );

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

		// When the viewer renders we want to re-render this component.
		const viewer = viewers.get ( VIEWER_NAME );
		if ( viewer )
		{
			viewer.clientListeners.add ( "post_render", () =>
			{
				setCount ( ( current ) => { return ( current + 1 ); } );
			} );
		}

		return ( () =>
		{
			// console.log ( "App component unmounted" );
		} );
	},
	[ viewers ] );

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
	// Render the first panel in the top left position.
	//
	const renderPanel1 = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );

		// If there's no viewer then do not render the panel.
		if ( !viewer )
		{
			return null;
		}

		return (
			<Panel
				style = { {
					background: panelBackground,
				} }
			>
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
		);
	}, [
		handleAllowAnimations,
		handleSimulateDeviceLost,
		handleTrackballMode,
		handleTurntableMode,
		handleViewerRender,
		handleViewerReset,
		panelBackground,
		verticalSpace,
		viewers,
	] );

	//
	// Render the second panel.
	//
	const renderPanel2 = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );

		// If there's no viewer then do not render the panel.
		if ( !viewer )
		{
			return null;
		}

		return (
			<Panel
				style = { {
					background: panelBackground,
				} }
			>
				<div
					style = { {
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
					} }
				>
					<pre>
						{
							JSON.stringify ( getRenderGraphInfo(), null, 2 )
							.replace ( /[{}]/g, "" )
							.replace ( / {2}/g, "" )
							.trim()
						}
					</pre>
				</div>
			</Panel>
		);
	}, [
		getRenderGraphInfo,
		panelBackground,
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
			<div
				style = { {
					position: "absolute",
					top: "10px",
					left: "10px",
					display: "flex",
					flexDirection: "row",
					gap: "10px",
				} }
			>
				{ renderPanel1() }
				{ renderPanel2() }
			</div>
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
