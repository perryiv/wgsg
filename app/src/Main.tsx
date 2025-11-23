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
// import { StrictMode } from "react"
import { theme } from "./UI/Theme";
import { ThemeProvider } from "@mui/material/styles";


///////////////////////////////////////////////////////////////////////////////
//
//	Top of the React rendering hierarchy.
//
///////////////////////////////////////////////////////////////////////////////

createRoot ( ( document.getElementById ( "root" ) )! ).render (
	// <StrictMode>
		<ThemeProvider theme = { theme }>
			<CssBaseline />
			<App />
		</ThemeProvider>
	// </StrictMode>
);

// Note: When developing, StrictMode makes it mount, unmount, and mount again.
// Because of the way the code is organized, tThis creates the singleton WebGPU
// device, destroys it, and creates it again. Unfortunately, the singleton
// shaders that are made with the first device all become invalid.
