///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

import eslint from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

///////////////////////////////////////////////////////////////////////////////
//
//	We return an array of things that should happen in order.
//
///////////////////////////////////////////////////////////////////////////////

export default [

	// These are the files we want to lint.
	{ files: [ "**/*.{ts,tsx}" ] },

	// Use the recommended configuration from eslint.
	eslint.configs.recommended,

	// Add these configurations from the typescript-eslint project.
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,

	{
		// Set the language options.
		languageOptions: {

			// Use this version of ECMAScript.
			ecmaVersion: 2020,

			// We are targeting the browser.
			globals: { ...globals.browser, ...globals.mocha },

			// Configure the parser.
			parserOptions: {

				// Point to the typescript configuration file.
				project: [ "./tsconfig.json" ],

				// The typescript root directory is this one.
				tsconfigRootDir: import.meta.dirname,
			},
		}
	},

	{
		// The plugins that we use.
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
		}
	},

	{
		// Set (or reset) these rules.
		rules: {

			// Use the recommended configuration from eslint-plugin-react-hooks.
			...reactHooks.configs.recommended.rules,

			// Override these rules.
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
			"@typescript-eslint/no-redundant-type-constituents": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"no-unused-expressions": "off",
		},
	},
];
