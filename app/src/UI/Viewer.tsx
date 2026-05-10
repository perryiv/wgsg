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
import { useViewerState, useViewerStore } from "../State";
import CloseIcon from "@mui/icons-material/Close";
import {
	Card,
	IconButton,
	LinearProgress,
	Paper,
} from "@mui/material";
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
	clampNumber,
	Device,
	DeviceLost,
	getNextId,
	getReader,
	Node as SceneNode,
	Reader,
	throttle,
	Viewer as InternalViewer,
	Cancelled,
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

interface ILoader
{
	reader: ( Reader | null );
}


///////////////////////////////////////////////////////////////////////////////
//
//	For debugging.
//
///////////////////////////////////////////////////////////////////////////////

// let componentRenderCount = 0;


///////////////////////////////////////////////////////////////////////////////
//
//	Handle when there is a new device.
//
///////////////////////////////////////////////////////////////////////////////

const handleNewDevice = ( viewer: InternalViewer ) =>
{
	// Tell the viewer to handle the new device.
	viewer.handleNewDevice();

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
};


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

export function Viewer ( { style }: IViewerProps )
{
	// Get state.
	const [ boxesScene, setBoxesScene ] = useState < SceneNode | null > ( null );
	const [ id, ] = useState < number > ( getNextId ( "Viewer Component" ) );
	const [ progress, setProgress ] = useState < number > ( 0 );
	const [ supported, setSupported ] = useState < boolean | null > ( null );
	const { getBoundingBoxesVisible } = useViewerState ( ( state ) => state );
	const { getViewer, setViewer } = useViewerStore ( ( state ) => state );
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const isMounting = useRef ( false );
	const loader = useRef < ILoader > ( { reader: null } );

	// Get the viewer.
	const viewer = getViewer ( VIEWER_NAME );

	// Are the bounding boxes visible?
	const boundingBoxesVisible = getBoundingBoxesVisible();

	//
	// Build the test scene.
	//
	const buildTestScene = useCallback ( () : SceneNode =>
	{
		return buildSceneSpheres();
	},
	[] );

	//
	// Adjust the scene for bounding boxes if necessary.
	//
	useEffect ( () =>
	{
		// Handle no viewer.
		if ( !viewer )
		{
			return;
		}

		// If the boxes are not supposed to be visible ...
		if ( false === boundingBoxesVisible )
		{
			// And they are not ...
			if ( !boxesScene )
			{
				return; // There is nothing to do.
			}

			// Remove the existing scene.
			const extraScene = viewer.extraScene;
			extraScene.removeChild ( extraScene.indexOf ( boxesScene ) );

			// Set this for next time.
			setBoxesScene ( null );

			// Render so that we see the change.
			viewer.requestRender();

			// We're done.
			return;
		}

		// If we get to here then the boxes are supposed to be visible.

		// Are they already visible?
		if ( boxesScene )
		{
			return; // There is nothing to do.
		}

		// If we get to here then we need a model scene.
		const modelScene = viewer.modelScene;
		if ( !modelScene )
		{
			return;
		}

		// Make the scene for the boxes.
		const boxes = buildBoundingBoxes ( modelScene );

		// It should not contribute to the bounds.
		boxes.addsToBounds = false;

		// Add the scene for the boxes.
		viewer.extraScene.addChild ( boxes );

		// Save it for next time.
		setBoxesScene ( boxes );

		// Render so that we see the change.
		viewer.requestRender();
	}, [
		boxesScene,
		boundingBoxesVisible,
		viewer,
	] );

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
		reader.progress = throttle ( ( value: number, total: number ): boolean =>
		{
			// Did the reader change?
			if ( reader !== loader.current.reader )
			{
				// This is supposed to stop the reader.
				return false;
			}

			// Handle values that are out of range.
			if ( ( value < 0 ) || ( total <= 0 ) || ( value > total ) )
			{
				// Keep going because it might fix itself.
				return true;
			}

			// Calculate the fraction, which should be in the range [ 0, 1 ].
			let fraction = ( value / total );

			// When we get to the end, hide it.
			if ( fraction >= 1 )
			{
				fraction = 0;
			}

			// Set the new progress value.
			setProgress ( fraction );

			// For debugging.
			// console.log ( `Reading ${( fraction * 100 ).toFixed ( 2 )}% of ${file.name}` );

			// Keep going.
			return true;
		},
		200 );

		// Initalize the model.
		let model: ( SceneNode | null ) = null;

		// Set the reader that we are now using.
		loader.current = { reader };

		try
		{
			// Read the file.
			model = await reader.read ( file );
		}
		catch ( error )
		{
			if ( error instanceof Cancelled )
			{
				console.log ( `Reading was cancelled for file: ${file.name}` );
			}
			else
			{
				console.error ( `Error reading file ${file.name}:`, error );
			}
			return;
		}

		// Hide the progress bar.
		setProgress ( 0 );

		// Handle invalid model.
		if ( !model )
		{
			console.warn ( `Reader returned null model for file: ${file.name}` );
			return;
		}

		// Handle no viewer.
		if ( !viewer )
		{
			console.warn ( `No viewer found with name: ${VIEWER_NAME}` );
			return;
		}

		// To speed things up later, calculate the bounds now.
		void model.bounds;

		// Add the model to the scene.
		viewer.modelScene = model;

		// Make sure we don't have any boxes from the previous model.
		const extraScene = viewer.extraScene;
		extraScene.removeChild ( extraScene.indexOf ( boxesScene ) );
		setBoxesScene ( null );

		// Move the camera so we see the new model.
		viewer.viewAll ( { animate: false } );

		// Render so we see the new model.
		viewer.requestRender();
	}, [
		boxesScene,
		viewer,
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

		// Stop any previous file reading.
		loader.current = { reader: null };

		// Just read the first file.
		const file = files[0];

		console.log ( "Dropped file name:", file.name );

		// Handle reading the file. We don't need to wait for it.
		void handleFileRead ( file );
	}, [
		handleFileRead
	] );

	//
	// Handle the progress bar's close button being pressed
	//
	const handleProgressBarClose = useCallback ( () =>
	{
		// This is supposed to stop the reader.
		loader.current.reader = null;

		// Hide the progress bar.
		setProgress ( 0 );
	},
	[] );

	//
	// Handle getting or creating the viewer.
	//
	const getOrCreateViewer = useCallback ( () =>
	{
		// console.log ( "In getOrCreateViewer()" );

		// This should never happen.
		if ( !canvas.current )
		{
			throw new Error ( "Invalid canvas element" );
		}

		// Return the existing viewer if we have it.
		const existing = getViewer ( VIEWER_NAME );
		if ( existing )
		{
			return existing;
		}

		// Make the viewer.
		const newViewer = new InternalViewer ( { canvas: canvas.current } );
		setViewer ( VIEWER_NAME, newViewer );
		console.log ( `Internal viewer ${newViewer.id} created` );

		// Build the scene.
		newViewer.modelScene = buildTestScene();
		newViewer.viewAll ( { animate: false } );

		// console.log ( "Out getOrCreateViewer()" );

		// Return the viewer.
		return newViewer;
	}, [
		buildTestScene,
		getViewer,
		setViewer,
	] );

	//
	// Initialize the device.
	//
	const initDevice = useCallback ( async () =>
	{
		// console.log ( "In initDevice()" );

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
			handleNewDevice ( getOrCreateViewer() );
		} );
	},
	[ getOrCreateViewer ] );

	//
	// Local function to handle when this component is mounted.
	// This has to be async because of how the device initializes.
	//
	const handleMount = useCallback ( async () =>
	{
		// console.log ( `In handleMount() for viewer component ${id}` );

		// Is WebGPU supported?
		if ( null === supported )
		{
			if ( false === await Device.isSupported() )
			{
				console.warn ( "WebGPU is not supported in this browser" );
				setSupported ( false );
				return;
			}
			setSupported ( true );
		}

		// Is WebGPU supported?
		if ( false === supported )
		{
			return;
		}

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
		getOrCreateViewer().requestRender();

		// We are done mounting.
		isMounting.current = false;

		// console.log ( `Out handleMount() for viewer component ${id}` );
	}, [
		getOrCreateViewer,
		initDevice,
		supported,
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

	//
	// Render the progress bar if there is a value.
	//
	const renderProgressBar = useCallback ( ( value: number ) =>
	{
		// Clamp it to the range the component can handle.
		value = clampNumber ( ( value * 100 ), 0, 100 );

		// If there is no progress value then we're done.
		if ( value <= 0 )
		{
			return null;
		}

		// Return the progress bar.
		return (
			<Paper
				style = { {
					position: "absolute",
					bottom: "20px",
					left: "50%",
					transform: "translateX(-50%)",
					width: "90%",
					display: "flex",
					alignItems: "center",
					gap: "10px",
					padding: "0px 8px 0px 8px",
					borderRadius: "5px",
				} }
			>
				<LinearProgress
					value = { value }
					variant = "determinate"
					sx = { {
						flex: 1,
						margin: 0,
						padding: 0,
						height: "6px",
						borderRadius: "2px",
					} }
				/>
				<span
					style = { {
						minWidth: "3.5em",
						textAlign: "right",
						fontSize: "small",
					} }
				>
					{ value.toFixed ( 1 ) } %
				</span>
				<IconButton
					size = "small"
					onClick = { handleProgressBarClose }
				>
					<CloseIcon
						style = { {
							fontSize: "small",
						} }
						sx = { {
							color: "error.main",
						} }
					/>
				</IconButton>
			</Paper>
		);
	}, [] );

	//
	// Render a message if WebGPU is not supported.
	//
	const renderNotSupported = useCallback ( () =>
	{
		// There are 3 states, true, false, and unknown (null). Do it this way
		// because we only want to see the message if it's not supported.
		// If it's still being figured out (i.e., null) then do nothing.
		if ( false !== supported )
		{
			return null;
		}

		return (
			<Card
				style = { {
					position: "absolute",
					top: "33%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					padding: "20px",
					textAlign: "center",
				} }
			>
				<h1
					style = { {
						transform: "rotate(90deg)",
					} }
				>
					:-(
				</h1>
				<span>WebGPU is not supported in this browser</span>
				<br />
				<span>You can check browser support&nbsp;</span>
				<a
					href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"
					target="_blank"
					rel="noopener noreferrer"
				>
					here
				</a>
				<span>&nbsp;and&nbsp;</span>
				<a
					href="https://caniuse.com/webgpu"
					target="_blank"
					rel="noopener noreferrer"
				>
					here
				</a>
			</Card>
		);
	},
	[ supported ] );

	// console.log ( `Viewer component ${id} render count ${componentRenderCount++}` );

	//
	// Render the components.
	//
	return (
		<div>
			<canvas
				style = { style }
				ref = { canvas }
				onDragOver = { handleDragOver }
				onDrop = { handleDroppedFiles }
			>
			</canvas>
			{ renderNotSupported() }
			{ renderProgressBar ( progress ) }
		</div>
	);
}
