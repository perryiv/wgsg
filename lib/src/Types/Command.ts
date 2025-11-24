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

import { IEventType } from "./Event";
import { IKeyboardState } from "./Keyboard";
import { IMouseButtons } from "./Mouse";
import { IViewer } from "./Viewer";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to commands.
//
///////////////////////////////////////////////////////////////////////////////

export type ICommandName = (
	| "rotate_px_large"
	| "rotate_py_large"
	| "rotate_pz_large"
	| "rotate_px_small"
	| "rotate_py_small"
	| "rotate_pz_small"
	| "rotate_nx_large"
	| "rotate_ny_large"
	| "rotate_nz_large"
	| "rotate_nx_small"
	| "rotate_ny_small"
	| "rotate_nz_small"
);

export interface ICommand
{
	execute ( viewer: IViewer ) : void;
}

export type ICommandMap = Map < ICommandName, ICommand >;

export interface ICommandMapKey extends IMouseButtons, IKeyboardState
{
	type: IEventType;
}

export type IInputToCommandNameMap = Map < string, ICommandName >;
