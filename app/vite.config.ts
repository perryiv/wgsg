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
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				entryFileNames: "assets/[name]-[hash].js",
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
} );
