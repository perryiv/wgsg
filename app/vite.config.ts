///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Configure Vite.
//	https://vite.dev/config/
//
///////////////////////////////////////////////////////////////////////////////

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Browsers give finer times from performance.now() when the page is
// cross-origin isolated, which these headers do. That makes the frame times
// more accurate. The page can then only load files from other sites that
// allow it, but it doesn't load any.
const headers = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig ( {
	plugins: [
		react()
	],
	server: { headers },
	preview: { headers },
	base: "/wgsg_demo/", // The output files get copied to the demo repository.
	define: {
		BUILD_TIME_STAMP: JSON.stringify ( Date.now() ),
	},
	build: {
		sourcemap: true,
		minify: false, // Easier on the repo size and debugging.
		rollupOptions: {
			output: {
				// Note: Use [name]-[hash] to get a different file name each time.
				entryFileNames: "assets/[name]-[hash].js",
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
} );
