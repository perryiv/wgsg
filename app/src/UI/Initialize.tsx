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
import Card from "@mui/material/Card/Card";


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
	// Render a message if WebGPU is not supported.
	//
	const renderNotSupported = useCallback ( () =>
	{
		return (
			<Card
				style = { {
					position: "absolute",
					top: "33%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					padding: "20px",
					textAlign: "center",
				} }
			>
				<h1
					style = { {
						transform: "rotate(90deg)",
					} }
				>
					:-(
				</h1>
				<span>WebGPU is not supported in this browser</span>
				<br />
				<span>You can check browser support&nbsp;</span>
				<a
					href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"
					target="_blank"
					rel="noopener noreferrer"
				>
					here
				</a>
				<span>&nbsp;and&nbsp;</span>
				<a
					href="https://caniuse.com/webgpu"
					target="_blank"
					rel="noopener noreferrer"
				>
					here
				</a>
			</Card>
		);
	},
	[] );

	//
	// Render what we are supposed to.
	//
	const renderComponent = useCallback ( () =>
	{
		// If we are still figuring it out then render nothing.
		if ( null === supported )
		{
			return ( null );
		}

		// If we know that it is not supported then render the message.
		if ( false === supported )
		{
			return renderNotSupported();
		}

		// If it's supported but not yet initialized then render nothing.
		if ( false === initialized )
		{
			return ( null );
		}

		// If we get to here then render the children.
		return ( children );
	}, [
		children,
		initialized,
		renderNotSupported,
		supported,
	] );

	//
	// Render the component.
	//
	return (
		<>
			{ renderComponent() }
		</>
	);
}
