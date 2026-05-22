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
import { Initialize } from "./Initialize";
import { RenderStats } from "./RenderStats";
import { Panel } from "./Panel";
import { useTheme } from "@mui/material";
import { useViewerStore } from "../State";
import { Viewer } from "./Viewer";
import {
	useCallback,
	useMemo,
	useState,
} from "react";
import {
	DEVELOPER_BUILD,
	Device,
	Trackball,
	Viewer as InternalViewer,
} from "../../../lib/src";


///////////////////////////////////////////////////////////////////////////////
//
//	For debugging.
//
///////////////////////////////////////////////////////////////////////////////

let renderCount = 0;


///////////////////////////////////////////////////////////////////////////////
//
//	Constants used below.
//
///////////////////////////////////////////////////////////////////////////////

const LEFT_VIEWER = "left_viewer";
const RIGHT_VIEWER = "right_viewer";
const NUM_VIEWERS = ( ( DEVELOPER_BUILD ) ? 2 : 1 );


///////////////////////////////////////////////////////////////////////////////
//
//	Application component.
//
///////////////////////////////////////////////////////////////////////////////

export function App()
{
	// Get the state.
	const [ count, setCount ] = useState ( 0 );
	const [ showStats, setShowStats ] = useState ( false );
	const { palette } = useTheme();
	const createViewerState = useViewerStore ( ( store ) => store.createViewerState );
	const currentViewerId   = useViewerStore ( ( store ) => store.current );
	const setCurrentViewer  = useViewerStore ( ( store ) => store.setCurrentViewer );
	const setViewerState    = useViewerStore ( ( store ) => store.setViewerState );
	const viewerStates      = useViewerStore ( ( store ) => store.viewers );

	//
	// Get the viewer, which may be null.
	//
	const viewer = useMemo ( (): ( InternalViewer | null ) =>
	{
		if ( currentViewerId )
		{
			const state = viewerStates.get ( currentViewerId );
			if ( state )
			{
				return ( state.viewer );
			}
		}
		return null;
	}, [
		currentViewerId,
		viewerStates,
	] );

	//
	// Get the viewer state.
	//
	const { boxesVisible, edgesVisible, twoSidedLighting } = useMemo ( () =>
	{
		const state = ( currentViewerId ? ( viewerStates.get ( currentViewerId ) ) : null );
		return ( state ?? createViewerState() );
	}, [
		createViewerState,
		currentViewerId,
		viewerStates,
	] );

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
	// Handle when the viewer is clicked.
	//
	const handleViewerClick = useCallback ( ( viewerId: string ) =>
	{
		setCurrentViewer ( viewerId );
	},
	[ setCurrentViewer ] );

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
		if ( currentViewerId )
		{
			const vs = viewerStates.get ( currentViewerId );
			if ( vs )
			{
				const visible = vs.boxesVisible;
				setViewerState ( currentViewerId, { ...vs, boxesVisible: !visible } );
			}
		}
	}, [
		currentViewerId,
		setViewerState,
		viewerStates,
	] );

	//
	// Handle the show triangle edges button.
	//
	const handleShowTriangleEdges = useCallback ( () =>
	{
		if ( currentViewerId )
		{
			const vs = viewerStates.get ( currentViewerId );
			if ( vs )
			{
				const visible = vs.edgesVisible;
				setViewerState ( currentViewerId, { ...vs, edgesVisible: !visible } );
			}
		}
	}, [
		currentViewerId,
		setViewerState,
		viewerStates,
	] );

	//
	// Handle the use two-sided lighting button.
	//
	const handleUseTwoSidedLighting = useCallback ( () =>
	{
		if ( currentViewerId )
		{
			const vs = viewerStates.get ( currentViewerId );
			if ( vs )
			{
				const tsl = vs.twoSidedLighting;
				setViewerState ( currentViewerId, { ...vs, twoSidedLighting: !tsl } );
			}
		}
	}, [
		currentViewerId,
		setViewerState,
		viewerStates,
	] );

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
	const panel1 = useMemo ( () =>
	{
		// If there's no viewer then everybody is disabled.
		const disabled = !viewer;

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
						disabled = { disabled }
						onClick = { handleTrackballMode }
						value = { "track_ball" === viewer?.navBase.rotationMode }
						radio = { true }
					>
						Trackball rotation
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleTurntableMode }
						value = { "turn_table" === viewer?.navBase.rotationMode }
						radio = { true }
					>
						Turntable rotation
					</Button>
					{ verticalSpace() }
					<Button
						disabled = { disabled }
						onClick = { handleAllowAnimations }
						value = { viewer ? viewer.options.animations.allow : false }
					>
						Allow animations
					</Button>
					{ verticalSpace() }
					<Button
						disabled = { disabled }
						onClick = { handleViewerRender }
					>
						Render viewer
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleViewerReset }
					>
						Reset navigation
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleSimulateDeviceLost }
					>
						Simulate device lost
					</Button>
					{ verticalSpace() }
					<Button
						disabled = { disabled }
						onClick = { handleShowStats }
						value = { showStats }
					>
						Render stats
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleShowBoundingBoxes }
						value = { boxesVisible }
					>
						Bounding boxes
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleShowTriangleEdges }
						value = { edgesVisible }
					>
						Triangle edges
					</Button>
					<Button
						disabled = { disabled }
						onClick = { handleUseTwoSidedLighting }
						value = { twoSidedLighting }
					>
						Two-sided lighting
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
		boxesVisible,
		buildTimeStamp,
		edgesVisible,
		handleAllowAnimations,
		handleShowBoundingBoxes,
		handleShowStats,
		handleShowTriangleEdges,
		handleSimulateDeviceLost,
		handleTrackballMode,
		handleTurntableMode,
		handleUseTwoSidedLighting,
		handleViewerRender,
		handleViewerReset,
		panelBackground,
		showStats,
		twoSidedLighting,
		verticalSpace,
		viewer,
	] );

	//
	// Render a viewer component.
	//
	const renderViewer = useCallback ( ( viewerId: string ) =>
	{
		const border = ( ( NUM_VIEWERS > 1 ) ?
			`1px ${( viewerId === currentViewerId ) ? "solid red" : "solid transparent" }` :
			"none"
		);

		return (
			<div
				style = { {
					boxSizing: "border-box",
					flexGrow: 1,
					height: "100%",
					border,
				} }
			>
				<Viewer
					style = { {
						width: "100%",
						height: "100%",
					} }
					viewerId = { viewerId }
					onClick = { () => handleViewerClick ( viewerId ) }
				/>
			</div>
		);
	}, [
		currentViewerId,
		handleViewerClick,
	] );

	//
	// Render the left viewer.
	//
	const leftViewer = useMemo ( () =>
	{
		return renderViewer ( LEFT_VIEWER );
	}, [
		renderViewer,
	] );

	//
	// Render the right viewer.
	//
	const rightViewer = useMemo ( () =>
	{
		return renderViewer ( RIGHT_VIEWER );
	}, [
		renderViewer,
	] );

	console.log ( `App render count ${++renderCount}` );

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
				{ panel1 }
				{ showStats ? <RenderStats /> : null }
			</div>
			<Initialize>
				<div
					style = { {
						display: "flex",
						flexDirection: "row",
						width: "100%",
						height: "100%",
					} }
				>
					{ leftViewer }
					{ ( NUM_VIEWERS > 1 ) ? rightViewer : null }
				</div>
			</Initialize>
		</div>
	);
}
