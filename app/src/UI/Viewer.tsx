///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

import { buildSceneQuads } from "../Tools";
import { useViewerStore } from "../State";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	DEVELOPER_BUILD,
	Device,
	DeviceLost,
	getNextId,
	Viewer as InternalViewer,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants used below.
//
///////////////////////////////////////////////////////////////////////////////

const VIEWER_NAME = "main_viewer";


///////////////////////////////////////////////////////////////////////////////
//
//	Types for the viewer props.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerProps
{
	style?: React.CSSProperties;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

export function Viewer ( { style }: IViewerProps )
{
	// Get state.
	const [ id, ] = useState < number > ( getNextId ( "Viewer Component" ) );
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const getViewer = useViewerStore ( ( state ) => state.getViewer );
	const setViewer = useViewerStore ( ( state ) => state.setViewer );

	//
	// Build the test scene.
	//
	const buildTestScene = useCallback ( () =>
	{
		return buildSceneQuads();
	},
	[] );

	//
	// Handle when the device is lost.
	//
	const handleDeviceLost = useCallback ( () =>
	{
		// Get the viewer.
		const viewer = getViewer ( VIEWER_NAME );

		// Handle no viewer.
		if ( !viewer )
		{
			return;
		}

		// Tell the viewer to handle the lost device.
		viewer.handleDeviceLost();

		// Get the scene.
		const { scene } = viewer;

		// Handle no scene.
		if ( !scene )
		{
			return;
		}

		// Visit the scene.
		const visitor = new DeviceLost();
		visitor.handle ( scene );

		// Render again so that we see the rebuilt scene.
		viewer.requestRender();
	},
	[ getViewer ] );

	//
	// Initialize the device.
	//
	const initDevice = useCallback ( async () =>
	{
		// Do nothing if the device is valid.
		if ( true === Device.valid )
		{
			return;
		}

		// Initialize the singleton device.
		await Device.init();
		console.log ( `Singleton device ${Device.instance.id} initialized` );

		// Handle device lost.
		void Device.instance.device.lost.then ( async () =>
		{
			// It's probably already destroyed but make sure.
			Device.destroy();

			// Make it again.
			await initDevice();

			// This will rebuild the resources.
			handleDeviceLost();
		} );
	},
	[ handleDeviceLost ] );

	//
	// Handle getting or creating the viewer.
	//
	const getOrCreateViewer = useCallback ( () =>
	{
		// This should never happen.
		if ( !canvas.current )
		{
			throw new Error ( "Invalid canvas element" );
		}

		// Try to get the viewer from the store.
		let viewer = getViewer ( VIEWER_NAME );

		// Make the viewer if we have to.
		if ( !viewer )
		{
			viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = buildTestScene();
			setViewer ( VIEWER_NAME, viewer );
			console.log ( `Internal viewer ${viewer.id} created and configured` );
		}

		// Return the viewer.
		return viewer;
	},
	[ buildTestScene, getViewer, setViewer ] );

	//
	// Local function to handle initialization.
	// This has to be async because of how the device initializes.
	//
	const handleInit = useCallback ( async () =>
	{
		// Initialize the device if needed.
		await initDevice();

		// Get the viewer or make it if we have to.
		const viewer = getOrCreateViewer();

		// This is for hot-module-refresh. It will be removed in production.
		if ( DEVELOPER_BUILD )
		{
			console.log ( "Building new scene for viewer" );
			viewer.scene = buildTestScene();
			viewer.requestRender();
		}
	}, [ buildTestScene, getOrCreateViewer, initDevice ] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( `Viewer component ${id} mounted` );

		// This has to be async because of the device initialization.
		void ( async () =>
		{
			await handleInit();
		} ) ();

		return ( () =>
		{
			console.log ( `Viewer component ${id} unmounted` );
		} );
	},
	[ id, handleInit ] );

	console.log ( "Rendering viewer component" );

	//
	// Render the components.
	//
	return (
		<canvas
			style = { style }
			ref = { canvas }
		>
		</canvas>
	);
}
