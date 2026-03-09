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

import { buildSceneSpheres } from "../Tools";
import { useViewerStore } from "../State";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	buildBoundingBoxes,
	Device,
	DeviceLost,
	getNextId,
	Group,
	Node,
	Viewer as InternalViewer,
} from "../../../lib/src";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants used below.
//
///////////////////////////////////////////////////////////////////////////////

export const VIEWER_NAME = "main_viewer";


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
	const buildTestScene = useCallback ( () : Node =>
	{
		const group = new Group();
		const spheres = buildSceneSpheres();
		group.addChild ( spheres );
		const boxes = buildBoundingBoxes ( spheres );
		boxes.addsToBounds = false;
		group.addChild ( boxes );
		return group;
	},
	[] );

	//
	// Handle when the device is lost.
	//
	const handleDeviceLost = useCallback ( () =>
	{
		console.log ( "In handleDeviceLost()" );

		// Get the viewer.
		const viewer = getViewer ( VIEWER_NAME );

		// Handle no viewer.
		if ( !viewer )
		{
			console.log ( "Out handleDeviceLost(), no viewer" );
			return;
		}

		// Tell the viewer to handle the lost device.
		viewer.handleDeviceLost();

		// Get the scene.
		const { scene } = viewer;

		// Handle no scene.
		if ( !scene )
		{
			console.log ( "Out handleDeviceLost(), no scene" );
			return;
		}

		// Visit the scene.
		const visitor = new DeviceLost();
		visitor.handle ( scene );

		// Render again so that we see the rebuilt scene.
		viewer.requestRender();

		console.log ( "Out handleDeviceLost()" );
	},
	[ getViewer ] );

	//
	// Initialize the device.
	//
	const initDevice = useCallback ( async () =>
	{
		console.log ( "In initDevice()" );

		// Do nothing if the device is valid.
		if ( true === Device.valid )
		{
			console.log ( "Device is valid" );
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

			console.log ( `Singleton device ${Device.instance.id} destroyed` );

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
		console.log ( "In getOrCreateViewer()" );

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
			setViewer ( VIEWER_NAME, viewer );
			console.log ( `Internal viewer ${viewer.id} created` );
		}

		console.log ( "Out getOrCreateViewer()" );

		// Return the viewer.
		return viewer;
	},
	[ getViewer, setViewer ] );

	//
	// Local function to handle when this component is mounted.
	// This has to be async because of how the device initializes.
	//
	const handleMount = useCallback ( async () =>
	{
		console.log ( `In handleMount() for viewer component ${id}` );

		// Initialize the device if needed.
		await initDevice();

		// Get the viewer or make it if we have to.
		const viewer = getOrCreateViewer();

		// Build the scene.
		console.log ( `Adding test scene to viewer ${viewer.id}` );
		viewer.modelScene = buildTestScene();
		viewer.viewAll ( { animate: false } );
		viewer.requestRender();

		console.log ( `Out handleMount() for viewer component ${id}` );
	},
	[ buildTestScene, getOrCreateViewer, id, initDevice ] );

	//
	// Local function to handle when the component is unmounted.
	//
	const handleUnmount = useCallback ( () =>
	{
		console.log ( `In handleUnmount() for viewer component ${id}` );
		handleDeviceLost();
		console.log ( `Out handleUnmount() for viewer component ${id}` );
	},
	[ id, handleDeviceLost ] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		// console.log ( `Viewer component ${id} mounted` );

		// This has to be async because of the device initialization.
		void ( async () =>
		{
			await handleMount();
		} ) ();

		return ( () =>
		{
			// console.log ( `Viewer component ${id} unmounted` );
			handleUnmount();
		} );
	},
	[ id, handleMount, handleUnmount ] );

	// console.log ( `Rendering viewer component ${id}` );

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
