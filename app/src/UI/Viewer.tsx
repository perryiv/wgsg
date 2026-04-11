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
	CSSProperties,
	DragEvent,
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
	getReader,
	Group,
	Node as SceneNode,
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
	style?: CSSProperties;
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
	const buildTestScene = useCallback ( () : SceneNode =>
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
	// Handle when the mouse drags a file over this component.
	//
	const handleDragOver = useCallback ( ( event: DragEvent < HTMLCanvasElement > ) =>
	{
		event.preventDefault();
		event.stopPropagation();
	}, [] );

	//
	// Handle reading the given file.
	//
	const handleFileRead = useCallback ( async ( file: File ) =>
	{
		// Try to get a reader factory.
		const ext = ( file.name.split ( "." ).pop() ?? "" ).toLowerCase();
		const factory = getReader ( ext );

		// Handle no factory function.
		if ( !factory )
		{
			console.warn ( `No reader found for file extension: ${ext}` );
			return;
		}

		// Make the reader.
		const reader = factory();

		// Handle no reader.
		if ( !reader )
		{
			console.warn ( `Failed to create reader for file extension: ${ext}` );
			return;
		}

		// Attach the progress callback.
		reader.progress = ( value: number, total: number ) =>
		{
			// Handle values that are out of range.
			if ( ( value < 0 ) || ( total <= 0 ) || ( value > total ) )
			{
				// Keep going because it might fix itself.
				return true;
			}

			const percent = ( ( value / total ) * 100 ).toFixed ( 2 );
			console.log ( `Reading ${percent}% of ${file.name}` );

			// Keep going.
			return true;
		}

		// Initalize the model.
		let model: ( SceneNode | null ) = null;

		try
		{
			// Read the file.
			model = await reader.read ( file );
		}
		catch ( error )
		{
			console.error ( `Error reading file ${file.name}:`, error );
			return;
		}

		// Handle invalid model.
		if ( !model )
		{
			console.warn ( `Reader returned null model for file: ${file.name}` );
			return;
		}

		// Get the viewer.
		const viewer = getViewer ( VIEWER_NAME );

		// Handle no viewer.
		if ( !viewer )
		{
			console.warn ( `No viewer found with name: ${VIEWER_NAME}` );
			return;
		}

		// Add the model to the scene.
		viewer.modelScene = model;

		// Render so we see the new model.
		viewer.requestRender();
	}, [
		getViewer
	] );

	//
	// Handle when the mouse drops a file on this component.
	//
	const handleDroppedFiles = useCallback ( ( event: DragEvent < HTMLCanvasElement > ) =>
	{
		event.preventDefault();
		event.stopPropagation();

		const { files } = event.dataTransfer;

		if ( files.length <= 0 )
		{
			return;
		}

		// Loop through the files.
		for ( const file of files )
		{
			console.log ( "Dropped file name:", file.name );

			// Handle reading the file. We don't need to wait for it.
			void handleFileRead ( file );
		}
	}, [ handleFileRead ] );

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
			onDragOver = { handleDragOver }
			onDrop = { handleDroppedFiles }
		>
		</canvas>
	);
}
