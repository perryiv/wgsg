///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types related to events.
//
///////////////////////////////////////////////////////////////////////////////

import { IInputState } from "./Input";
import { IVector2 } from "./Vector";
import { IViewer } from "./Viewer";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to events.
//
///////////////////////////////////////////////////////////////////////////////

export type IEventType = (
	| "mouse_down"
	| "mouse_up"
	| "mouse_move"
	| "mouse_drag"
	| "mouse_distance"
	| "mouse_wheel"
	| "mouse_in"
	| "mouse_out"
	| "key_down"
	| "key_up"
);

export interface IEvent extends IInputState
{
	type: IEventType;
	event: ( KeyboardEvent | MouseEvent );
	viewer: IViewer;
}

export interface IMouseDistanceEvent extends IEvent
{
	type: "mouse_distance";
	event: MouseEvent;
	start: IVector2;
	end: IVector2;
	distance: number;
	button: number; // The button that was released.
}
