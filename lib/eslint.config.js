
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";


///////////////////////////////////////////////////////////////////////////////
//
//	We return an array of things that should happen in order.
//
///////////////////////////////////////////////////////////////////////////////

export default [

	// These are the files we want to lint.
	{ files: [ "**/*.{ts}" ] },

	// Use the recommended configuration from eslint.
	eslint.configs.recommended,

	// Add these configurations from the typescript-eslint project.
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,

	// JSDoc configuration.
	jsdoc.configs["flat/recommended"],

	// Other configurations ...
	{
		// Set the language options.
		languageOptions: {

			// Use this version of ECMAScript.
			ecmaVersion: 2020,

			// We are only targeting a browser.
			globals: { ...globals.browser },

			// Configure the parser.
			parserOptions: {

				// Point to the TypeScript configuration file.
				project: [ "./tsconfig.json" ],

				// The TypeScript root directory is this one.
				tsconfigRootDir: import.meta.dirname,
			},
		}
	},

	{
		// TODO: Is this needed? Is this where it goes?
		// https://www.npmjs.com/package/eslint-plugin-jsdoc
		plugins: {
			jsdoc,
		},

		// Override these rules.
		rules: {
			"@typescript-eslint/no-redundant-type-constituents": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@typescript-eslint/prefer-nullish-coalescing": "off",
			"jsdoc/no-undefined-types": "off",
			"jsdoc/require-description": "warn",
			"no-unused-expressions": "off",
		},
	}
];
