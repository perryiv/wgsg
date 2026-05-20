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
	current: ( string | null );
	getCurrentViewer: () => ( string | null );
	setCurrentViewer: ( id: string | null ) => void;
	getViewer: ( id: string ) => ( Viewer | null );
	setViewer: ( id: string, viewer: Viewer ) => void;
	removeViewer: ( id: string ) => void;
	clearViewers: () => void;
}

export interface IViewerState
{
	boxesVisible: boolean;
	edgesVisible: boolean;
	twoSidedLighting: boolean;
	getBoundingBoxesVisible: () => boolean;
	setBoundingBoxesVisible: ( visible: boolean ) => void;
	getTriangleEdgesVisible: () => boolean;
	setTriangleEdgesVisible: ( visible: boolean ) => void;
	getTwoSidedLighting: () => boolean;
	setTwoSidedLighting: ( enabled: boolean ) => void;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Make the map of viewers.
//
///////////////////////////////////////////////////////////////////////////////

export const useViewerStore = create < IViewerStore > () ( ( set, get ) => (
{
	viewers: new Map < string, Viewer > (),
	current: null as ( string | null ),

	getCurrentViewer: () : ( string | null ) =>
	{
		const store = get();
		return store.current;
	},

	setCurrentViewer: ( id: string | null ) : void =>
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

	getViewer: ( id: string ) : ( Viewer | null ) =>
	{
		const store = get();
		const viewer = store.viewers.get ( id );
		return ( viewer ?? null );
	},

	setViewer: ( id: string, viewer: Viewer ) : void =>
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

	removeViewer: ( id: string ) : void =>
	{
		set ( ( current ) =>
		{
			const next = new Map ( current.viewers );
			next.delete ( id );
			return { viewers: next };
		} )
	},

	clearViewers: () : void =>
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
	edgesVisible: false,
	twoSidedLighting: false,

	getBoundingBoxesVisible: () : boolean =>
	{
		const store = get();
		return store.boxesVisible;
	},

	setBoundingBoxesVisible: ( visible: boolean ) : void =>
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
	},

	getTriangleEdgesVisible: () : boolean =>
	{
		const store = get();
		return store.edgesVisible;
	},

	setTriangleEdgesVisible: ( visible: boolean ) : void =>
	{
		const store = get();
		if ( visible !== store.edgesVisible )
		{
			set ( () =>
			{
				return (
				{
					edgesVisible: visible
				} )
		 } );
		}
	},

	getTwoSidedLighting: () : boolean =>
	{
		const store = get();
		return store.twoSidedLighting;
	},

	setTwoSidedLighting: ( enabled: boolean ) : void =>
	{
		const store = get();
		if ( enabled !== store.twoSidedLighting )
		{
			set ( () =>
			{
				return (
				{
					twoSidedLighting: enabled
				} )
		 } );
		}
	},
} ) );
