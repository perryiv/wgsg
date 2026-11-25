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

import { Button } from "./Button";
import { Panel } from "./Panel";
import { useTheme } from "@mui/material";
import { modelNames, useViewerStore } from "../State";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	Device,
	type IFrameMeasurement,
	type IRenderGraphInfo,
	type ITimeStatistics,
	type ITimeSummary,
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
//	A measurement, with what was measured.
//
///////////////////////////////////////////////////////////////////////////////

interface IMeasured
{
	measurement: IFrameMeasurement;
	renderGraph: IRenderGraphInfo;
	model: string;
	when: Date;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Make the JSON of a measurement to copy to the clipboard. The times are in
//	milliseconds, rounded to microseconds.
//
///////////////////////////////////////////////////////////////////////////////

const makeReport = ( { measurement, renderGraph, model, when }: IMeasured ) : string =>
{
	const { vendor, architecture, device, description } = Device.instance.adapterInfo;
	const report = {
		when: when.toISOString(),
		model,
		...measurement,
		renderGraph,
		adapter: { vendor, architecture, device, description },
		browser: navigator.userAgent,
	};
	const round = ( _key: string, value: unknown ) =>
	{
		return ( ( ( "number" === typeof value ) && !Number.isInteger ( value ) ) ?
			Number ( value.toFixed ( 3 ) ) : value );
	};
	return ( JSON.stringify ( report, round, "  " ) + "\n" );
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
	const [ measured, setMeasured ] = useState < IMeasured | null > ( null );
	const [ measuring, setMeasuring ] = useState ( false );
	const [ copied, setCopied ] = useState ( false );
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
	// Measure the frames.
	//
	const handleMeasure = useCallback ( () =>
	{
		if ( !viewer || viewer.measuring )
		{
			return;
		}
		setMeasuring ( true );
		viewer.measure().then ( ( measurement ) =>
		{
			const scene = viewer.modelScene;
			setMeasured ( {
				measurement,
				renderGraph: { ...viewer.cullVisitor.renderGraphInfo },
				model: ( ( scene ? modelNames.get ( scene ) : null ) ?? "none" ),
				when: new Date(),
			} );
		} ).catch ( ( error: unknown ) =>
		{
			console.error ( "Failed to measure the frames:", error );
		} ).finally ( () =>
		{
			setMeasuring ( false );
		} );
	},
	[ viewer ] );

	//
	// Copy the measurement to the clipboard.
	//
	const handleCopy = useCallback ( () =>
	{
		if ( !measured )
		{
			return;
		}
		navigator.clipboard.writeText ( makeReport ( measured ) ).then ( () =>
		{
			setCopied ( true );
			setTimeout ( () => { setCopied ( false ); }, 2000 );
		} ).catch ( ( error: unknown ) =>
		{
			console.error ( "Failed to copy the measurement:", error );
		} );
	},
	[ measured ] );

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

		// Get the times of the recent frames.
		const times = viewer.frameTimes;

		// Format an average time, or a dash if there is none.
		const average = ( summary: ( ITimeSummary | null ) ) =>
		{
			return ( summary ? `${ decF.format ( summary.average ) } ms` : "-" );
		};

		// Format the range of the times.
		const range = ( summary: ( ITimeSummary | null ) ) =>
		{
			return ( summary ? `${ decF.format ( summary.min ) } to ${ decF.format ( summary.max ) }` : "-" );
		};

		// The GPU time is only approximate without timestamps.
		const gpuName = ( ( "submitted" === times.gpuMethod ) ? "GPU (approx)" : "GPU" );

		// Make the final string. The times are averages over the last second.
		const label =
			`Frame: ${ getFrameCount() }\n` +
			`Rate: ${ ( null === times.rate ) ? "-" : decF.format ( times.rate ) } f/s\n` +
			`CPU: ${ average ( times.cpu ) }\n` +
			`  range: ${ range ( times.cpu ) }\n` +
			`  update: ${ average ( times.update ) }\n` +
			`  cull: ${ average ( times.cull ) }\n` +
			`  draw: ${ average ( times.draw ) }\n` +
			`${ gpuName }: ${ average ( times.gpu ) }\n` +
			`  range: ${ range ( times.gpu ) }\n` +
			`Layers: ${ intF.format ( rgi.numLayers ) }\n` +
			`Bins: ${ intF.format ( rgi.numBins ) }\n` +
			`Pipelines: ${ intF.format ( rgi.numPipelines ) }\n` +
			`Projections: ${ intF.format ( rgi.numProjMatrixGroups ) }\n` +
			`ViewMatrices: ${ intF.format ( rgi.numViewMatrixGroups ) }\n` +
			`States: ${ intF.format ( rgi.numStateGroups ) }\n` +
			`Shapes: ${ intF.format ( rgi.numShapes ) }\n` +
			`Triangles: ${ intF.format ( rgi.numTriangles ) }\n` +
			`Lines: ${ intF.format ( rgi.numLines ) }`;

		// Add the measurement, if there is one.
		if ( measuring )
		{
			return ( label + "\n\nMeasuring..." );
		}
		if ( measured )
		{
			const m = measured.measurement;
			const middle = ( stats: ( ITimeStatistics | null ) ) =>
			{
				return ( stats ? `${ decF.format ( stats.median ) } ms` : "-" );
			};
			return ( label +
				`\n\nMeasured ${ intF.format ( m.frames ) } frames\n` +
				`Rate: ${ ( null === m.rate ) ? "-" : decF.format ( m.rate ) } f/s\n` +
				`CPU median: ${ middle ( m.cpu ) }\n` +
				`${ ( "submitted" === m.gpuMethod ) ? "GPU (approx)" : "GPU" } median: ${ middle ( m.gpu ) }` );
		}

		return label;
	}, [
		decF,
		getFrameCount,
		getRenderGraphInfo,
		intF,
		measured,
		measuring,
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
				<Button
					disabled = { measuring }
					onClick = { handleMeasure }
				>
					Measure
				</Button>
				<Button
					disabled = { !measured || measuring }
					onClick = { handleCopy }
				>
					{ copied ? "Copied" : "Copy" }
				</Button>
			</div>
		</Panel>
	);
}
