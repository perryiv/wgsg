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
	extraScene: Group;
	fixedScene: Group;
	modelScene: ( SceneNode | null );

	navBase: INavigator;
	projMatrix: Readonly<IMatrix44>;
	viewport: Readonly<IViewport>;

	getCommand: ( event: IEvent ) => ( ICommand | null );
	makeLine: ( input: { screenPoint: Readonly<IVector2>, viewMatrix?: Readonly<IMatrix44> } ) => ( Line | null );
	requestRender: ( () => void );
	viewAll: ( options?: { resetRotation?: boolean, animate?: boolean } ) => void;
}
