///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Log constants.
//
///////////////////////////////////////////////////////////////////////////////

import { BuildEnvironment } from "../Types/Environment";


///////////////////////////////////////////////////////////////////////////////
//
//	Log constants.
//
///////////////////////////////////////////////////////////////////////////////

// Vite's import.meta.env doesn't have types so cast it.
// https://vite.dev/guide/env-and-mode
const BUILD_ENVIRONMENT = ( ( ( import.meta as unknown ) as BuildEnvironment ).env );

// https://www.dash0.com/knowledge/log-levels
export enum LogLevel
{
	FATAL = 0,
	ERROR = 1,
	WARN  = 2,
	INFO  = 3,
	DEBUG = 4,
	TRACE = 5,
};

export const BUILD_TIME_LOG_LEVEL: LogLevel = (
	( "string" === typeof ( BUILD_ENVIRONMENT.VITE_LOG_LEVEL ) ) ?
	( ( parseInt ( BUILD_ENVIRONMENT.VITE_LOG_LEVEL ) ) as LogLevel ) :
	( LogLevel.INFO )	
);
