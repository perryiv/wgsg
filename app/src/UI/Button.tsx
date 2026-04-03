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
	CSSProperties,
	ReactNode,
	useCallback,
} from "react";
import {
	Button as InternalButton,
	Checkbox,
	FormControlLabel,
	useTheme,
} from "@mui/material";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IButtonProps
{
	style?: CSSProperties;
	children: ReactNode;
	onClick?: ( value?: boolean ) => void;
	value?: boolean;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Button component.
//
///////////////////////////////////////////////////////////////////////////////

export function Button ( props: IButtonProps )
{
	// Get input.
	const { style, children, onClick, value } = props;

	// Get the application state.
	const { palette } = useTheme();

	//
	// Handle the click.
	//
	const handleClick = useCallback ( () =>
	{
		if ( onClick )
		{
			onClick();
		}
	}, [ onClick ] );

	//
	// Render the components.
	//
	if ( value !== undefined )
	{
		return (
			<FormControlLabel
				sx = { {
					margin: 0,
					paddingRight: "10px",
					height: "24px",
					":hover": { color: palette.secondary.main },
					...style,
				} }
				control = {
					<Checkbox
						checked = { value }
						onChange = { handleClick }
						size = "small"
					/>
				}
					label = {
						<InternalButton
				sx = { {
					color: palette.text.primary,
					textTransform: "none",
					padding: 0,
					":hover": { color: palette.secondary.main },
					...style,
				} }
				onClick = { handleClick }
			>
				{ children }
			</InternalButton>
					}
				/>
		);
	}
	else
	{
		return (
			<InternalButton
				sx = { {
					color: palette.text.primary,
					textTransform: "none",
					marginLeft: "32px",
					paddingLeft: "6px",
					paddingRight: "6px",
					paddingTop: "0px",
					paddingBottom: "0px",
					":hover": { color: palette.secondary.main },
					...style,
				} }
				onClick = { handleClick }
			>
				{ children }
			</InternalButton>
		);
	}
}
