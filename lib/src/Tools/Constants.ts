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
import { BUILD_ENVIRONMENT } from "./Environment";


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

export const DEVELOPER_BUILD = !!( BUILD_ENVIRONMENT.DEV );
export const PRODUCTION_BUILD = !DEVELOPER_BUILD;

export const KEEP_PERFORMANCE_INFO: boolean = (
	( "string" === typeof ( BUILD_ENVIRONMENT.VITE_KEEP_PERFORMANCE_INFO ) ) ?
	( "true" === ( BUILD_ENVIRONMENT.VITE_KEEP_PERFORMANCE_INFO as string ).toLowerCase() ) :
	( false )
);

// Constants used in projections.
export const MIN_NEAR_DISTANCE = ( 0.01 );
export const MAX_FAR_DISTANCE  = ( 10000 );
export const DEFAULT_NEAR_DISTANCE = MIN_NEAR_DISTANCE;
export const DEFAULT_FAR_DISTANCE = MAX_FAR_DISTANCE;
