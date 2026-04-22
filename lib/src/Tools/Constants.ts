///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

import { IMatrix44 } from "../Types/Matrix";
import { BuildEnvironment } from "../Types/Environment";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

export const IDENTITY_MATRIX: Readonly<IMatrix44> = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
];

export const DEG_TO_RAD = ( Math.PI / 180 );
export const RAD_TO_DEG = ( 180 / Math.PI );

// Vite's import.meta.env doesn't have types so cast it.
// https://vite.dev/guide/env-and-mode
const BUILD_ENVIRONMENT = ( ( ( import.meta as unknown ) as BuildEnvironment ).env );

export const DEVELOPER_BUILD = !!( BUILD_ENVIRONMENT.DEV );
export const PRODUCTION_BUILD = !DEVELOPER_BUILD;

export const KEEP_PERFORMANCE_INFO: boolean = (
	( "string" === typeof ( BUILD_ENVIRONMENT.VITE_KEEP_PERFORMANCE_INFO ) ) ?
	( "true" === ( BUILD_ENVIRONMENT.VITE_KEEP_PERFORMANCE_INFO as string ).toLowerCase() ) :
	( false )
);
