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
	// Return the formatted viewer render graph info.
	//
	const getRenderGraphInfo = useCallback ( () =>
	{
		const viewer = viewers.get ( VIEWER_NAME );
		if ( !viewer )
		{
			return null;
		};

		const rgi = viewer.cullVisitor.renderGraphInfo;

		const rightAlign = {
			display: "inline-block",
			width: "50px",
			textAlign: "right",
		};

		const leftAlign = {
			display: "inline-block",
			width: "100px",
			textAlign: "left",
		};

		return (
			<div
				style = { {
					"display": "flex",
					"flex-direction": "column",
					"align-items": "flex-start",
					"font-size": "12px",
					"line-height": "16px",
					"white-space": "pre",
				} }
			>
				<div>Render graph info:</div>
				<div><span style = { rightAlign }>           {rgi.numLayers} </span> <span style = { leftAlign }> Layers       </span></div>
				<div><span style = { rightAlign }>             {rgi.numBins} </span> <span style = { leftAlign }> Bins         </span></div>
				<div><span style = { rightAlign }>        {rgi.numPipelines} </span> <span style = { leftAlign }> Pipelines    </span></div>
				<div><span style = { rightAlign }> {rgi.numProjMatrixGroups} </span> <span style = { leftAlign }> Projections  </span></div>
				<div><span style = { rightAlign }> {rgi.numViewMatrixGroups} </span> <span style = { leftAlign }> ViewMatrices </span></div>
				<div><span style = { rightAlign }>      {rgi.numStateGroups} </span> <span style = { leftAlign }> States       </span></div>
				<div><span style = { rightAlign }>           {rgi.numShapes} </span> <span style = { leftAlign }> Shapes       </span></div>
				<div><span style = { rightAlign }>        {rgi.numTriangles} </span> <span style = { leftAlign }> Triangles    </span></div>
				<div><span style = { rightAlign }>            {rgi.numLines} </span> <span style = { leftAlign }> Lines        </span></div>
			</div>
		)
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
					{ verticalSpace() }
					{ getRenderGraphInfo() }
				</div>
			</Panel>
		)
	}, [
		getRenderGraphInfo,
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
