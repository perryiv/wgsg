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

import { BuildEnvironment } from "../Types/Environment";

// Vite's import.meta.env doesn't have types so cast it.
// https://vite.dev/guide/env-and-mode
export const BUILD_ENVIRONMENT: BuildEnvironment = ( ( ( import.meta as unknown ) as { env: BuildEnvironment } ).env );

export const DEVELOPER_BUILD = !!( BUILD_ENVIRONMENT.DEV );
export const PRODUCTION_BUILD = !DEVELOPER_BUILD;

export const KEEP_PERFORMANCE_INFO: boolean = (
	"true" === BUILD_ENVIRONMENT.VITE_KEEP_PERFORMANCE_INFO?.toLowerCase()
);
