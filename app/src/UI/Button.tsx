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
	Button as RegularButton,
	Checkbox,
	FormControlLabel,
	Radio as RadioButton,
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
	radio?: boolean;
	disabled?: boolean;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Button component.
//
///////////////////////////////////////////////////////////////////////////////

export function Button ( props: IButtonProps )
{
	// Get input.
	const { style, children, onClick, value, radio, disabled = false } = props;

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
					...style,
				} }
				control = {
					( radio ) ?
					<RadioButton
						disabled = { disabled }
						checked = { value }
						onChange = { handleClick }
						size = "small"
					/> :
					<Checkbox
						disabled = { disabled }
						checked = { value }
						onChange = { handleClick }
						size = "small"
					/>
				}
					label = {
						<RegularButton
							sx = { {
								color: palette.text.primary,
								textTransform: "none",
								padding: 0,
								":hover": { color: palette.secondary.main },
								...style,
							} }
							disabled = { disabled }
							onClick = { handleClick }
						>
							{ children }
						</RegularButton>
					}
				/>
		);
	}
	else
	{
		return (
			<RegularButton
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
				disabled = { disabled }
				onClick = { handleClick }
			>
				{ children }
			</RegularButton>
		);
	}
}
