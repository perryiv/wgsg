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

export default defineConfig ( {
	plugins: [
		react()
	],
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
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name][extname]",
			},
		},
	},
} );
