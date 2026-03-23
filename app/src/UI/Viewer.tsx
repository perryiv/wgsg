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
	const isMounting = useRef ( false );
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
	// Handle when there is a new device.
	//
	const handleNewDevice = useCallback ( () =>
	{
		console.log ( "In handleNewDevice()" );

		// Get the viewer.
		const viewer = getViewer ( VIEWER_NAME );

		// Handle no viewer.
		if ( !viewer )
		{
			console.log ( "Out handleNewDevice(), no viewer" );
			return;
		}

		// Tell the viewer to handle the new device.
		viewer.handleNewDevice();

		// Get the scene.
		const { scene } = viewer;

		// Handle no scene.
		if ( !scene )
		{
			console.log ( "Out handleNewDevice(), no scene" );
			return;
		}

		// Visit the scene.
		const visitor = new DeviceLost();
		visitor.handle ( scene );

		// Render again so that we see the rebuilt scene.
		viewer.requestRender();

		console.log ( "Out handleNewDevice()" );
	},
	[ getViewer ] );

	//
	// Initialize the device.
	//
	const initDevice = useCallback ( async () =>
	{
		console.log ( "In initDevice()" );

		// This should not happen.
		if ( true === Device.valid )
		{
			console.log ( "Device is already initialized" );
			return;
		}

		// This should not happen.
		if ( true === Device.isInitializing )
		{
			throw new Error ( "Device is already being initialized" );
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
			handleNewDevice();
		} );
	},
	[ handleNewDevice ] );

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

			// Build the scene.
			viewer.modelScene = buildTestScene();
			viewer.viewAll ( { animate: false } );
		}

		console.log ( "Out getOrCreateViewer()" );

		// Return the viewer.
		return viewer;
	}, [
		buildTestScene,
		getViewer,
		setViewer,
	] );

	//
	// Local function to handle when this component is mounted.
	// This has to be async because of how the device initializes.
	//
	const handleMount = useCallback ( async () =>
	{
		console.log ( `In handleMount() for viewer component ${id}` );

		// Are we still in the middle of the first mount?
		if ( true === isMounting.current )
		{
			console.log ( "We are still handling the previous mount" );
			return;
		}

		// If we get to here then set the flag that says we are mounting.
		isMounting.current = true;

		// Initialize the device if needed.
		await initDevice();

		// Get the viewer or make it if we have to.
		const viewer = getOrCreateViewer();
		viewer.requestRender();

		// We are done mounting.
		isMounting.current = false;

		console.log ( `Out handleMount() for viewer component ${id}` );
	}, [
		getOrCreateViewer,
		id,
		initDevice,
	] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( `Viewer component ${id} mounted` );

		// This has to be async because of the device initialization.
		void ( async () =>
		{
			await handleMount();
		} ) ();

		return ( () =>
		{
			console.log ( `Viewer component ${id} unmounted` );
		} );
	},
	[ id, handleMount ] );

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
