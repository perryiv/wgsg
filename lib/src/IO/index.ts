///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Export the modules in this directory.
//
///////////////////////////////////////////////////////////////////////////////

export * from "./Cancelled";
export * from "./Reader";

// Import the concrete readers to load them into memory. Do not export them.
import "./Readers";

// The PLY reader has settings that the application can change.
export { PLY } from "./Readers/PLY";
export {
	PLY_DEFAULT_MAX_VERTICES_PER_GEOMETRY,
	PLY_MAX_VERTICES_FOR_16_BIT_INDICES,
} from "./Readers/PLY/Common";
