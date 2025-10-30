///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Panel component.
//
///////////////////////////////////////////////////////////////////////////////

import {
	CSSProperties,
	ReactNode,
	useEffect,
} from "react";
import {
	Paper,
	useTheme,
} from "@mui/material";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPanelProps
{
	style?: CSSProperties;
	children?: ReactNode;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Panel component.
//
///////////////////////////////////////////////////////////////////////////////

export function Panel ( props: IPanelProps )
{
	// Get input.
	const { style, children } = props;

	// Get the application state.
	const { palette } = useTheme();

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Panel component mounted" );

		return ( () =>
		{
			console.log ( "Panel component unmounted" );
		} );
	},
	[] );

	//
	// Render the components.
	//
	return (
		<Paper
			style = { {
				position: "absolute",
				top: 10,
				left: 10,
				padding: "4px",
				userSelect: "none",
				background: palette.background.paper,
				opacity: 0.6,
				...style,
			} }
			elevation = { 0 }
		>
			{ children }
		</Paper>
	);
}
