
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
//
//	https://vite.dev/guide/build.html#library-mode
//	https://dev.to/receter/how-to-create-a-react-component-library-using-vites-library-mode-4lma
//
///////////////////////////////////////////////////////////////////////////////

import { defineConfig } from "vite";
import { name } from "./package.json";
import { resolve } from "path";
import dts from "vite-plugin-dts";


///////////////////////////////////////////////////////////////////////////////
//
//	Return the configuration object. This is the main entry point for Vite.
//
///////////////////////////////////////////////////////////////////////////////

export default defineConfig ( ( { command, mode } ) =>
{
	return {
		plugins: [
			dts ( {
				insertTypesEntry: true,
				compilerOptions: {
					declaration: true,
					emitDeclarationOnly: true
				}
			} )
		],
		resolve: {
			alias: {
				"@": resolve ( __dirname, "src" )
			}
		},
		build: {
			lib: {
				entry: resolve ( __dirname, "src/index.ts" ),
				name: name,
				fileName: ( format ) =>
				{
					return `${ name }-${ format }.js`;
				},
				formats: [ "es", "umd" ]
			},
			minify: true,
			cssMinify: true,
			sourcemap: true,
			copyPublicDir: false
		}
	};
} );
