///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for states.
//
///////////////////////////////////////////////////////////////////////////////

import { SolidColor } from "../Shaders";
import { State } from "../Scene";
import type { IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a state object with solid color.
//
///////////////////////////////////////////////////////////////////////////////

export const makeSolidColorState = ( { color, topology } :
	{ color: IVector4, topology: GPUPrimitiveTopology } ) : State =>
{
	// Make a copy of the color because we capture it below.
	color = [ color[0], color[1], color[2], color[3] ];

	// Shortcut.
	const shader = SolidColor.instance;

	// Make the state.
	return new State ( {
		name: `State with ${color.join(", ")} ${topology}`,
		shader,
		topology,
		apply: ( () =>
		{
			shader.color = color;
		} )
	} );
}
