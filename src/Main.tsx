import { App } from "./App"
import { createRoot } from "react-dom/client"
import { CssBaseline } from "@mui/material";
import { StrictMode } from "react"
import { theme } from "./Theme";
import { ThemeProvider } from "@mui/material/styles";

createRoot ( ( document.getElementById ( "root" ) )! ).render (
  <StrictMode>
    <ThemeProvider theme = { theme }>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
