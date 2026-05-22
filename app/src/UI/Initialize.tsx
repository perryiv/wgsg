///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Component that handles GPU device initialization.
//
///////////////////////////////////////////////////////////////////////////////

import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Device } from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IInitializeProps
{
	children?: React.ReactNode;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Component that handles GPU device initialization.
//
///////////////////////////////////////////////////////////////////////////////

export function Initialize ( { children }: IInitializeProps )
{
	// Get state.
	const [ initialized, setInitialized ] = useState < boolean > ( false );
	const [ supported, setSupported ] = useState < boolean | null > ( null );
	const isMounting = useRef ( false );

	//
	// Initialize the device.
	//
	const initDevice = useCallback ( async () =>
	{
		// This will sometimes happen.
		if ( true === Device.valid )
		{
			console.log ( "Device is already initialized" );
		}

		// This will sometimes happen.
		if ( true === Device.isInitializing )
		{
			console.log ( "Device is already being initialized" );
		}

		// Initialize the singleton device.
		await Device.init();

		// Handle device lost.
		void Device.instance.device.lost.then ( () =>
		{
			// It's probably already destroyed but make sure.
			Device.destroy();

			// Make it again.
			setInitialized ( false );
		} );

		// Set the state.
		setInitialized ( true );

		console.log ( `Singleton device ${Device.instance.id} initialized` );
	},
	[] );

	//
	// Local function to handle when this component is mounted.
	// This has to be async because of how the device initializes.
	//
	const handleMount = useCallback ( async () =>
	{
		// Is WebGPU supported?
		if ( null === supported )
		{
			if ( false === await Device.isSupported() )
			{
				console.warn ( "WebGPU is not supported in this browser" );
				setSupported ( false );
				return;
			}
			setSupported ( true );
		}

		// Is WebGPU supported?
		if ( false === supported )
		{
			return;
		}

		// Are we still handling the previous mount?
		if ( true === isMounting.current )
		{
			console.log ( "We are still handling the previous mount" );
			return;
		}

		// If we get to here then set the flag that says we are mounting.
		isMounting.current = true;

		// Initialize the device if needed.
		await initDevice();

		// We are done mounting.
		isMounting.current = false;
	}, [
		initDevice,
		supported
	] );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Device component mounted" );

		// This has to be async because of the device initialization.
		void ( async () =>
		{
			await handleMount();
		} ) ();

		return ( () =>
		{
			console.log ( "Device component unmounted" );
		} );
	},
	[ handleMount ] );


	//
	// Render the children.
	//
	return (
		<>
			{ initialized ? children : null }
		</>
	);
}
