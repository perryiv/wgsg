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
import { useSceneStore } from "../State";
import {
	useEffect,
	useRef,
	useState,
} from "react";
import {
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

const SCENE_NAME = "main_scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer props.
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
	const [ id, ] = useState < number > ( getNextId() );
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ , setViewer ] = useState < InternalViewer | null > ( null );
	const scenes = useSceneStore ( ( state ) => state.scenes );
	const setScene = useSceneStore ( ( state ) => state.setScene );
	const removeScene = useSceneStore ( ( state ) => state.removeScene );

	//
	// Called when the component mounts or the scenes change.
	//
	useEffect ( () =>
	{
		console.log ( `Viewer component ${id} mounted` );

		void ( async () =>
		{
			if ( !canvas.current )
			{
				throw new Error ( "Invalid canvas element" );
			}

			await Device.init();

			void Device.instance.device.lost.then ( ( { reason, message }: GPUDeviceLostInfo ) =>
			{
				console.log ( `Context lost, reason: ${reason}, message: ${message}` );
				const scene = scenes.get ( SCENE_NAME );
				if ( scene )
				{
					const visitor = new DeviceLost();
					visitor.handle ( scene );
				}
				// removeScene ( SCENE_NAME );
			} );

			console.log ( `Singleton device ${Device.instance.id} initialized` );

			const scene = buildSceneBox();
			setScene ( SCENE_NAME, scene );

			// let scene = scenes.get ( SCENE_NAME );
			// if ( !scene )
			// {
			// 	scene = buildSceneBox();
			// 	setScene ( SCENE_NAME, scene );
			// }

			// You should have a store of viewers instead of a store of scenes.
			// That way when this component is remounted because of a hot-module-refresh,
			// the same viewer (with the same navigation state) will be used.

			const viewer = new InternalViewer ( { canvas: canvas.current } );
			setViewer ( viewer );
			viewer.scene = scene;

			console.log ( `Internal viewer ${viewer.id} created and configured` );
		} ) ();

		return ( () =>
		{
			console.log ( `Viewer component ${id} unmounted` );

			setViewer ( ( current: ( InternalViewer | null ) ) =>
			{
				if ( current )
				{
					console.log ( `Destroying internal viewer ${current.id}` );
					current.destroy();
				}
				return null;
			} );

			const device = ( Device.valid ? Device.instance : null );
			Device.destroy();
			console.log ( ( device ) ?
				`Singleton device ${device.id} destroyed` :
				"Singleton device was already destroyed"
			);
		} );
	},
	[ id, removeScene, scenes, setScene ] );

	// console.log ( "Rendering viewer component" );

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
