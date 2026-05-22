///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	State container for viewers.
//
///////////////////////////////////////////////////////////////////////////////

import { create } from "zustand";
import { Viewer } from "../../../lib/src/Viewers";
	

///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerState
{
	viewer: ( Viewer | null );
	boxesVisible: boolean;
	edgesVisible: boolean;
	twoSidedLighting: boolean;
}

export interface IViewerStore
{
	viewers: Map < string, IViewerState >;
	current: ( string | null );

	setCurrentViewer: ( id: ( string | null ) ) => void;
	setViewerState: ( id: string, state: IViewerState ) => void;
	createViewerState: () => IViewerState;
	removeViewerState: ( id: string ) => void;
	clearViewerStates: () => void;
}


///////////////////////////////////////////////////////////////////////////////
//
//	The store of viewers and their states.
//
///////////////////////////////////////////////////////////////////////////////

export const useViewerStore = create < IViewerStore > () ( ( set, get ) => (
{
	viewers: new Map < string, IViewerState > (),
	current: null as ( string | null ),

	setCurrentViewer: ( id: ( string | null ) ) : void =>
	{
		const store = get();
		if ( id !== store.current )
		{
			set ( () =>
			{
				return { current: id };
			} )
		}
	},

	setViewerState: ( id: string, state: IViewerState ) : void =>
	{
		const store = get();
		const current = store.viewers.get ( id );
		if ( state !== current )
		{
			set ( ( current: IViewerStore ) =>
			{
				const next = new Map ( current.viewers );
				next.set ( id, state );
				return { viewers: next };
			} )
		}
	},

	createViewerState: () : IViewerState =>
	{
		return {
			viewer: null,
			boxesVisible: false,
			edgesVisible: false,
			twoSidedLighting: false,
		};
	},

	removeViewerState: ( id: string ) : void =>
	{
		set ( ( current: IViewerStore ) =>
		{
			const next = new Map ( current.viewers );
			next.delete ( id );
			return { viewers: next };
		} )
	},

	clearViewerStates: () : void =>
	{
		set ( () =>
		{
			return (
			{
				viewers: new Map < string, IViewerState > ()
			} );
		} );
	}
} ) );
