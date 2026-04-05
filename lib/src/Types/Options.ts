///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Options types.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerOptions
{
	animations:
	{
		// Should the viewer allow animations?
		allow: boolean;
	},

	distance:
	{
		// The maximum allowed distance between subsequent mouse move events.
		// If the distance is greater than this then the event is ignored.
		mouse_move_max: number;

		// The distance between subsequent mouse move events that, when a mouse
		// button is released, gets interpreted as a "throw" and may cause the
		// viewer to animate.
		mouse_throw: number;
	},

	duration: // In milliseconds.
	{
		// The duration of the "throw" animation.
		mouse_throw: number;

		// The duration of the animation when resetting the view.
		view_reset: number;

		// The duration of the animation when pressing the arrow keys.
		rotate_axis_angle: number;
	};
}

export interface IOptions
{
	viewer: IViewerOptions;
}
