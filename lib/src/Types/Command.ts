///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types related to commands.
//
///////////////////////////////////////////////////////////////////////////////

import { IEvent, IEventType } from "./Event";
import { IKeyboardState } from "./Keyboard";
import { IMouseButtons } from "./Mouse";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to commands.
//
///////////////////////////////////////////////////////////////////////////////

export type ICommandName = (
	| "mouse_wheel_zoom_large"
	| "mouse_wheel_zoom_small"
	| "rotate_nx_large"
	| "rotate_nx_small"
	| "rotate_ny_large"
	| "rotate_ny_small"
	| "rotate_nz_large"
	| "rotate_nz_small"
	| "rotate_px_large"
	| "rotate_px_small"
	| "rotate_py_large"
	| "rotate_py_small"
	| "rotate_pz_large"
	| "rotate_pz_small"
	| "view_bounds_fit"
	| "view_bounds_reset"
);

export interface ICommand
{
	execute ( event: IEvent ) : void;
}

export type ICommandMap = Map < ICommandName, ICommand >;

export interface ICommandMapKey extends IMouseButtons, IKeyboardState
{
	type: IEventType;
}

export type IInputToCommandNameMap = Map < string, ICommandName >;
