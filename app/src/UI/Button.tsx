///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Button component.
//
///////////////////////////////////////////////////////////////////////////////

import {
	MouseEvent,
	ReactNode,
	useCallback,
	CSSProperties,
} from "react";
import {
	Button as MUIButton,
	useTheme,
} from "@mui/material";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

type ButtonClickEvent = MouseEvent<HTMLButtonElement>;

export interface IButtonProps
{
	style?: CSSProperties;
	children: ReactNode;
	onClick?: ( event: ButtonClickEvent ) => void;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Button component.
//
///////////////////////////////////////////////////////////////////////////////

export function Button ( props: IButtonProps )
{
	// Get input.
	const { style, children, onClick } = props;

	// Get the application state.
	const { palette } = useTheme();

	//
	// Handle the click.
	//
	const handleClick = useCallback ( ( event: ButtonClickEvent ) =>
	{
		if ( onClick )
		{
			onClick ( event );
		}
	},
	[ onClick ] );

	//
	// Render the components.
	//
	return (
		<MUIButton
			sx = { {
				textTransform: "none",
				padding: "1px 6px",
				":hover": {
					color: palette.secondary.main,
				},
				...style,
			} }
			onClick = { handleClick }
		>
			{ children }
		</MUIButton>
	);
}
