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
//	Types for the viewer store.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerStore
{
	viewers: Map < string, Viewer >;
	getViewer: ( id: string ) => ( Viewer | null );
	setViewer: ( id: string, viewer: Viewer ) => void;
	removeViewer: ( id: string ) => void;
	clearViewers: () => void;
}

export interface IViewerState
{
	boxesVisible: boolean;
	getBoundingBoxesVisible: () => boolean;
	setBoundingBoxesVisible: ( visible: boolean ) => void;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Make the map of viewers.
//
///////////////////////////////////////////////////////////////////////////////

export const useViewerStore = create < IViewerStore > () ( ( set, get ) => (
{
	viewers: new Map < string, Viewer > (),

	getViewer: ( id: string ) : ( Viewer | null ) =>
	{
		const store = get();
		const viewer = store.viewers.get ( id );
		return ( viewer ?? null );
	},

	setViewer: ( id: string, viewer: Viewer ) =>
	{
		const store = get();
		const current = store.viewers.get ( id );
		if ( viewer !== current )
		{
			set ( ( current ) =>
			{
				const next = new Map ( current.viewers );
				next.set ( id, viewer );
				return { viewers: next };
			} )
		}
	},

	removeViewer: ( id: string ) =>
	{
		set ( ( current ) =>
		{
			const next = new Map ( current.viewers );
			next.delete ( id );
			return { viewers: next };
		} )
	},

	clearViewers: () =>
	{
		set ( () =>
		{
			return (
			{
				viewers: new Map < string, Viewer > ()
			} );
		} );
	}
} ) );


///////////////////////////////////////////////////////////////////////////////
//
//	Make the map of viewer state.
//
///////////////////////////////////////////////////////////////////////////////

export const useViewerState = create < IViewerState > () ( ( set, get ) => (
{
	boxesVisible: false,

	getBoundingBoxesVisible: () : boolean =>
	{
		const store = get();
		return store.boxesVisible;
	},

	setBoundingBoxesVisible: ( visible: boolean ) =>
	{
		const store = get();
		if ( visible !== store.boxesVisible )
		{
			set ( () =>
			{
				return (
				{
					boxesVisible: visible
				} )
		 } );
		}
	}
} ) );
