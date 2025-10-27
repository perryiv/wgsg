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

import { buildSceneBox } from "../Tools";
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
	// Local function to handle initialization.
	// This has to be async because of how the device initializes.
	//
	const handleInit = useCallback ( async () =>
	{
		// This should never happen.
		if ( !canvas.current )
		{
			throw new Error ( "Invalid canvas element" );
		}

		// See if the device is valid.
		if ( false === Device.valid )
		{
			// Initialize the singleton device.
			await Device.init();
			console.log ( `Singleton device ${Device.instance.id} initialized` );

			// Handle device lost.
			void Device.instance.device.lost.then ( ( { reason, message }: GPUDeviceLostInfo ) =>
			{
				console.log ( `Context lost, reason: ${reason}, message: ${message}` );
			} );
		}

		// Try to get the viewer from the store.
		let viewer = getViewer ( VIEWER_NAME );

		// Make the viewer if we have to.
		if ( !viewer )
		{
			viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = buildSceneBox();
			setViewer ( VIEWER_NAME, viewer );
			console.log ( `Internal viewer ${viewer.id} created and configured` );
		}

		// This is for hot-module-refresh. It will be removed in production.
		if ( DEVELOPER_BUILD )
		{
			console.log ( "Setting viewer scene" );
			viewer.scene = buildSceneBox();
			viewer.requestRender();
		}
	}, [ setViewer, getViewer ] );

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
