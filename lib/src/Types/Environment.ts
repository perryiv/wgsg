///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The environment during the build.
///	See https://vite.dev/guide/env-and-mode#env-variables
//
///////////////////////////////////////////////////////////////////////////////

export interface BuildEnvironment
{
	env: {
		// These are always set by Vite.
		BASE_URL: string; // The base URL the app is being served from.
		DEV: boolean;     // Is this a development build?
		MODE: string;     // Either "development" or "production".
		PROD: boolean;    // Is this a production build?
		SSR: boolean;     // Server side rendering.

		// These are defined in app/.env* files.
		VITE_KEEP_PERFORMANCE_INFO?: boolean;
		VITE_LOG_LEVEL?: number;
	};
};
