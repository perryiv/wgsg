///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	React rendering starts here.
//
///////////////////////////////////////////////////////////////////////////////

import { App } from "./UI/App"
import { createRoot } from "react-dom/client"
import { CssBaseline } from "@mui/material";
import { StrictMode } from "react"
import { theme } from "./UI/Theme";
import { ThemeProvider } from "@mui/material/styles";
import { PLY } from "./wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Settings from the URL. For example, "?plyMaxVertices=262144" sets the most
//	vertices in one geometry when reading PLY files.
//
///////////////////////////////////////////////////////////////////////////////

{
	const plyMaxVertices = new URLSearchParams ( globalThis.location.search ).get ( "plyMaxVertices" );
	if ( null !== plyMaxVertices )
	{
		try
		{
			PLY.maxVerticesPerGeometry = Number ( plyMaxVertices );
			console.log ( `Most vertices in one PLY geometry: ${PLY.maxVerticesPerGeometry}` );
		}
		catch ( error )
		{
			console.error ( "Ignoring the 'plyMaxVertices' URL parameter:", ( error as Error ).message );
		}
	}
}


///////////////////////////////////////////////////////////////////////////////
//
//	Top of the React rendering hierarchy.
//
///////////////////////////////////////////////////////////////////////////////

createRoot ( ( document.getElementById ( "root" ) )! ).render (
	<StrictMode>
		<ThemeProvider theme = { theme }>
			<CssBaseline />
			<App />
		</ThemeProvider>
	</StrictMode>
);

// Note: When developing, StrictMode makes it mount, unmount, and mount again.
