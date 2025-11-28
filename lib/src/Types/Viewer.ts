///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types related to the viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { Group, Node as SceneNode } from "../Scene";
import { Line } from "../Math";
import type { ICommand } from "./Command";
import type { IEvent } from "./Event";
import type { IMatrix44 } from "./Matrix";
import type { INavigator } from "./Navigator";
import type { IVector2 } from "./Vector";
import type { IViewport } from "./Viewport";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to the viewer.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewer
{
	getCommand: ( event: IEvent ) => ( ICommand | null );
	makeLine: ( screenPoint: IVector2 ) => ( Line | null );
	navBase: INavigator;
	projMatrix: IMatrix44;
	requestRender: ( () => void );
	viewAll: ( options?: { resetRotation?: boolean } ) => void;
	viewport: IViewport;
	extraScene: Group;
	modelScene: ( SceneNode | null );
}
