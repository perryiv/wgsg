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

import {
	buildSceneQuads,
	buildSceneSpheres,
	buildTwoSquares,
} from "../Tools";
import {
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Device,
	Viewer as InternalViewer,
} from "wgsg-lib";


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
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ , setViewer ] = useState < InternalViewer | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Viewer component mounted" );

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
			} );

			console.log ( `Singleton device ${Device.instance.id} initialized` );

			const viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = buildTwoSquares();
			setViewer ( viewer );

			console.log ( `Internal viewer ${viewer.id} created and configured` );
		} ) ();

		return ( () =>
		{
			console.log ( "Viewer component unmounted" );

			setViewer ( ( current: ( InternalViewer | null ) ) =>
			{
				if ( current )
				{
					console.log ( `Destroying internal viewer ${current.id}` );
					current.destroy();
				}
				return null;
			} );

			Device.destroy();

			console.log ( "Singleton device destroyed" );
		} );
	},
	[] );

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
