///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	State container for scenes.
//
///////////////////////////////////////////////////////////////////////////////

import { create } from "zustand";
import { Node } from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Types for the scene store.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISceneStore
{
	scenes: Map < string, Node >;
	setScene: ( id: string, scene: Node ) => void;
	removeScene: ( id: string ) => void;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Make the map of scenes.
//
///////////////////////////////////////////////////////////////////////////////

export const useSceneStore = create < ISceneStore > () ( ( set, get ) => (
{
	scenes: new Map < string, Node > (),

	setScene: ( id: string, scene: Node ) =>
	{
		const current = get().scenes.get ( id );
		if ( scene !== current )
		{
			set ( ( current ) =>
			{
				const next = new Map ( current.scenes );
				next.set ( id, scene );
				return { scenes: next };
			} )
		}
	},

	removeScene: ( id: string ) =>
	{
		set ( ( current ) =>
		{
			const next = new Map ( current.scenes );
			next.delete ( id );
			return { scenes: next };
		} )
	},

	clearScenes: () =>
	{
		set ( () => (
		{
			scenes: new Map < string, Node > ()
		} ) );
	}
} ) );
