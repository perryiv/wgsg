
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

import { App } from "./App"
import { createRoot } from "react-dom/client"
import { CssBaseline } from "@mui/material";
// import { StrictMode } from "react"
import { theme } from "./Theme";
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
