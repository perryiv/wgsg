///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Panel component.
//
///////////////////////////////////////////////////////////////////////////////

import { ReactElement, useEffect } from "react";


///////////////////////////////////////////////////////////////////////////////
//
//	Panel component.
//
///////////////////////////////////////////////////////////////////////////////

export function Panel ( { children } : { children?: ReactElement } )
{
	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Panel component mounted" );

		return ( () =>
		{
			console.log ( "Panel component unmounted" );
		} );
	},
	[] );

	//
	// Render the components.
	//
	return (
		<div
			style = { {
				position: "absolute",
				top: 10,
				left: 10,
				fontSize: "14px",
				backgroundColor: "rgba(255,255,255,0.7)",
				padding: "4px",
				borderRadius: "4px",
				userSelect: "none",
			} }
		>
			{ children }
		</div>
	);
}
