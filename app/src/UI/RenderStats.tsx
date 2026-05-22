///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Component for rendering the statistics about the current frame.
//
///////////////////////////////////////////////////////////////////////////////

import { Panel } from "./Panel";
import { useTheme } from "@mui/material";
import { useViewerStore } from "../State";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	type IRenderGraphInfo,
	Viewer as InternalViewer,
	throttle,
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
//	Component for rendering the statistics about the current frame.
//
///////////////////////////////////////////////////////////////////////////////

export function RenderStats()
{
	// Get the state.
	const [ , setCount ] = useState ( 0 );
	const { palette } = useTheme();
	const currentViewerId = useViewerStore ( ( store ) => store.current );
	const viewerStates = useViewerStore ( ( store ) => store.viewers );

	//
	// Get the current viewer, which may be null.
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
	// Get the frame count.
	//
	const getFrameCount = useCallback ( () =>
	{
		return ( viewer ? viewer.frame.count : 0 );
	},
	[ viewer ] );

	//
	// Make the number formatters.
	//
	const { intF, decF } = useMemo ( () =>
	{
		const intF = new Intl.NumberFormat();
		const decF = new Intl.NumberFormat ( navigator.languages[0], {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		} );
		return { intF, decF };
	}, [] );

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
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		// console.log ( "App component mounted" );

		// Get the viewer.
		if ( !viewer )
		{
			return;
		}

		// When the viewer renders we want to re-render this component.
		// We throttle because otherwise it slows down the 3D rendering.
		const listener = viewer.clientListeners.add ( "post_render", throttle ( () =>
		{
			setCount ( ( current ) => { return ( current + 1 ); } );
		},
		200 ) );

		return ( () =>
		{
			// console.log ( "App component unmounted" );
			if ( viewer )
			{
				viewer.clientListeners.remove ( "post_render", listener );
			}
		} );
	},
	[ viewer ] );

	//
	// Get the label.
	//
	const getLabel = useCallback ( () =>
	{
		// If there's no viewer then do not render the panel.
		if ( !viewer )
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

		// Make the final string.
		const label =
			`Frame: ${ getFrameCount() }\n` +
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

		return label;
	}, [
		decF,
		getFrameCount,
		getRenderGraphInfo,
		intF,
		viewer,
	] );

	// If there is no label then we have nothing to show.
	const label = getLabel();
	if ( !label )
	{
		return null;
	}

	console.log ( "Rendering stats panel for frame:", getFrameCount() );

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
}
