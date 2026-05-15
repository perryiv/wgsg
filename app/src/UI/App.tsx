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
import { useViewerState, useViewerStore } from "../State";
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
	const { getViewer } = useViewerStore ( ( state ) => state );
	const [ count, setCount ] = useState ( 0 );
	const [ showStats, setShowStats ] = useState ( false );
	const {
		getBoundingBoxesVisible, setBoundingBoxesVisible,
		getTriangleEdgesVisible, setTriangleEdgesVisible
	} = useViewerState ( ( state ) => state );

	// Get the current viewer.
	const viewer = getViewer ( VIEWER_NAME );

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
	// Get the build-time timestamp as a formatted string.
	//
	const buildTimeStamp = useMemo ( () =>
	{
		const date = new Date ( BUILD_TIME_STAMP );
		const Y = date.getFullYear();
		const M = String ( date.getMonth() + 1 ).padStart ( 2, '0' );
		const D = String ( date.getDate()      ).padStart ( 2, '0' );
		const h = String ( date.getHours()     ).padStart ( 2, '0' );
		const m = String ( date.getMinutes()   ).padStart ( 2, '0' );
		const s = String ( date.getSeconds()   ).padStart ( 2, '0' );
		return ( `${Y}-${M}-${D} ${h}:${m}:${s}` );
	},
	[] );

	//
	// Return the formatted viewer render graph info.
	//
	const getRenderGraphInfo = useCallback ( () =>
	{
		return ( ( viewer )
			? viewer.cullVisitor.renderGraphInfo
			: defaultRenderGraphInfo
		);
	},
	[ viewer ] );

	//
	// Handle the "allow animations" button.
	//
	const handleAllowAnimations = useCallback ( () =>
	{
		if ( viewer )
		{
			const { animations } = viewer.options;
			animations.allow = !animations.allow;
			setCount ( count + 1 );
			console.log ( `Allow animations: ${animations.allow}` );
		}
	},
	[ count, viewer ] );

	//
	// Handle the trackball mode button.
	//
	const handleTrackballMode = useCallback ( () =>
	{
		if ( !viewer )
		{
			return;
		}

		const { navBase: trackball } = viewer;
		if ( trackball instanceof Trackball )
		{
			trackball.mode = "track_ball";
			setCount ( count + 1 );
		}
	},
	[ count, viewer ] );

	//
	// Handle the turntable mode button.
	//
	const handleTurntableMode = useCallback ( () =>
	{
		if ( !viewer )
		{
			return;
		}

		const { navBase: trackball } = viewer;
		if ( trackball instanceof Trackball )
		{
			trackball.mode = "turn_table";
			setCount ( count + 1 );
		}
	},
	[ count, viewer ] );

	//
	// Render the 3D viewer.
	//
	const handleViewerRender = useCallback ( () =>
	{
		if ( viewer )
		{
			viewer.requestRender();
		}
	},
	[ viewer ] );

	//
	// Reset the viewer's camera.
	//
	const handleViewerReset = useCallback ( () =>
	{
		if ( viewer )
		{
			viewer.viewAll ( { resetRotation: true } );
			viewer.requestRender();
		}
	},
	[ viewer ] );

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
	// Handle the show stats button.
	//
	const handleShowStats = useCallback ( () =>
	{
		setShowStats ( ( current ) =>
		{
			return ( !current );
		} );
	},
	[] );

	//
	// Handle the show bounding boxes button.
	//
	const handleShowBoundingBoxes = useCallback ( () =>
	{
		const current = getBoundingBoxesVisible();
		setBoundingBoxesVisible ( !current );
	}, [
		getBoundingBoxesVisible,
		setBoundingBoxesVisible,
	] );

	//
	// Handle the show triangle edges button.
	//
	const handleShowTriangleEdges = useCallback ( () =>
	{
		const current = getTriangleEdgesVisible();
		setTriangleEdgesVisible ( !current );
	}, [
		getTriangleEdgesVisible,
		setTriangleEdgesVisible,
	] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		// console.log ( "App component mounted" );

		// When the viewer renders we want to re-render this component.
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
	[ viewer ] );

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
					{ verticalSpace() }
					<Button
						onClick = { handleShowStats }
						value = { showStats }
					>
						Render stats
					</Button>
					<Button
						onClick = { handleShowBoundingBoxes }
						value = { getBoundingBoxesVisible() }
					>
						Bounding boxes
					</Button>
					<Button
						onClick = { handleShowTriangleEdges }
						value = { getTriangleEdgesVisible() }
					>
						Triangle edges
					</Button>
					{ verticalSpace() }
					<div
						style = { {
							display: "flex",
							width: "100%",
							justifyContent: "center",
							fontSize: "14px",
						} }
					>
						{ buildTimeStamp }
					</div>
				</div>
			</Panel>
		);
	}, [
		buildTimeStamp,
		getBoundingBoxesVisible,
		handleAllowAnimations,
		handleShowBoundingBoxes,
		handleShowStats,
		handleSimulateDeviceLost,
		handleTrackballMode,
		handleTurntableMode,
		handleViewerRender,
		handleViewerReset,
		panelBackground,
		showStats,
		verticalSpace,
		viewer,
	] );

	//
	// Render the second panel.
	//
	const renderPanel2 = useCallback ( () =>
	{
		// If there's no viewer then do not render the panel.
		if ( !viewer )
		{
			return null;
		}

		// Are we showing the stats?
		if ( !showStats )
		{
			return null;
		}

		// Get the frame info and make sure there is an end time.
		const frame = viewer.frame;
		if ( !frame.end )
		{
			return null;
		}

		// Get the render graph info.
		const rgi: IRenderGraphInfo = getRenderGraphInfo();

		// Determine how long the frame took in milliseconds.
		const duration = ( frame.end - frame.start );

		// Make the number formatters.
		const intF = new Intl.NumberFormat();
		const decF = new Intl.NumberFormat ( navigator.languages[0], {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		} );

		// Make the final string.
		const label =
			`Frame: ${ viewer.frame.count }\n` +
			`Time: ${ decF.format ( duration ) } ms\n` +
			`Rate: ${ decF.format ( ( 1000 / duration ) ) } f/s\n` +
			`Layers: ${ intF.format ( rgi.numLayers ) }\n` +
			`Bins: ${ intF.format ( rgi.numBins ) }\n` +
			`Pipelines: ${ intF.format ( rgi.numPipelines ) }\n` +
			`Projections: ${ intF.format ( rgi.numProjMatrixGroups ) }\n` +
			`ViewMatrices: ${ intF.format ( rgi.numViewMatrixGroups ) }\n` +
			`States: ${ intF.format ( rgi.numStateGroups ) }\n` +
			`Shapes: ${ intF.format ( rgi.numShapes ) }\n` +
			`Triangles: ${ intF.format ( rgi.numTriangles ) }\n` +
			`Lines: ${ intF.format ( rgi.numLines ) }`;

		// Render the panel.
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
						paddingLeft: "4px",
						minWidth: "104px",
					} }
				>
					<div
						style = { {
							whiteSpace: "pre",
							fontSize: "12px",
						} }
					>
						{ label }
					</div>
				</div>
			</Panel>
		);
	}, [
		getRenderGraphInfo,
		panelBackground,
		showStats,
		viewer,
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
