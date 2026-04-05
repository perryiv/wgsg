///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Commands for the viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { DEG_TO_RAD } from "../Tools";
import { vec3 } from "gl-matrix";
import type {
	ICommand,
	ICommandMap,
	ICommandName,
	ICoordinateSystem,
	IEvent,
	IEventType,
	IInputToCommandNameMap,
	IVector3,
} from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all commands.
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Command extends BaseClass implements ICommand
{
	/**
	 * Construct the class.
	 * @abstract
	 * @class
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	abstract execute ( event: IEvent ) : void;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * A command to rotate the viewer.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateAxisAngle extends Command
{
	#axis: IVector3 = [ 0, 1, 0 ];
	#angle = 0;
	#space: ICoordinateSystem = "global";

	/**
	 * Construct the class.
	 * @param {IVector3} axis The axis.
	 * @param {number} angle The angle in radians.
	 * @class
	 */
	public constructor ( axis: Readonly<IVector3>, angle: number )
	{
		super();
		vec3.copy ( this.#axis, axis );
		this.#angle = angle;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Commands.RotateAxisAngle";
	}

	/**
	 * Get the angle.
	 * @returns {number} The angle in radians.
	 */
	public get angle() : number
	{
		return this.#angle;
	}

	/**
	 * Set the angle.
	 * @param {number} angle The angle in radians.
	 */
	public set angle ( angle: number )
	{
		this.#angle = angle;
	}

	/**
	 * Get the coordinate system for the rotation.
	 * @returns {ICoordinateSystem} The coordinate system.
	 */
	public get space() : ICoordinateSystem
	{
		return this.#space;
	}

	/**
	 * Set the coordinate system for the rotation.
	 * @param {ICoordinateSystem} space The coordinate system.
	 */
	public set space ( space: ICoordinateSystem )
	{
		this.#space = space;
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		// Shortcuts.
		const { viewer } = event;
		const { navBase } = viewer;

		// If we are not supposed to animate ...
		if ( false === viewer.options.animations.allow )
		{
			navBase.rotateAxisAngle ( this.#axis, this.#angle, this.#space );
			viewer.requestRender();
			return;
		}

		// Save the current navigation state.
		const originalState = navBase.getInternalState();

		// If we get to here then animate the rotation.
		const nav = viewer.animations.nav;
		nav.set ( `${this.type}.execute()`, ( fraction: number ) =>
		{
			// Start at the original state.
			navBase.setInternalState ( originalState );

			// Rotate the navigator.
			const angle = this.#angle * fraction;
			navBase.rotateAxisAngle ( this.#axis, angle, this.#space );

			// Request a render so that we can see the change.
			viewer.requestRender();
		} );
		nav.start ( viewer.options.duration.rotate_axis_angle );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about X	command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateX extends RotateAxisAngle
{
	/**
	 * Construct the class.
	 * @param {number} angle The angle in radians.
	 * @class
	 */
	public constructor ( angle: number )
	{
		super ( [ 1, 0, 0 ], angle );
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public override execute ( event: IEvent ) : void
	{
		// Shortcuts.
		const { viewer } = event;
		const { navBase } = viewer;
		const originalAngle = this.angle;

		// Loop a reasonable number of times.
		const numSteps = 10;
		for ( let i = numSteps; i > 0; --i )
		{
			// The fraction of the angle for this iteration.
			// It will be 0.9, 0.8, ..., 0.1.
			const angle = originalAngle * ( i / numSteps );

			// Get the model's current y-axis in global space. The transformation
			// matrix includes translations so we have to operate on points at the
			// origin and end of the y-axis.
			const yAxis: IVector3 = [ 0, 1, 0 ];
			const origin: IVector3 = [ 0, 0, 0 ];
			vec3.transformMat4 ( yAxis, yAxis, navBase.viewMatrix );
			vec3.transformMat4 ( origin, origin, navBase.viewMatrix );
			vec3.subtract ( yAxis, yAxis, origin );
			vec3.normalize ( yAxis, yAxis );

			// Rotate the y-axis by this angle.
			vec3.rotateX ( yAxis, yAxis, [ 0, 0, 0 ], angle );

			// See if this rotation will "pitch" the model too far.
			if ( yAxis[1] >= 0 )
			{
				// If we get to here then the rotation is within bounds.
				this.angle = angle;

				// Call the base class' function to perform the rotation.
				super.execute ( event );

				// Restore the original angle.
				this.angle = originalAngle;

				// We're done.
				return;
			}
		}
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about Y command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateY extends RotateAxisAngle
{
	/**
	 * Construct the class.
	 * @param {number} angle The angle in radians.
	 * @class
	 */
	public constructor ( angle: number )
	{
		super ( [ 0, 1, 0 ], angle );
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public override execute ( event: IEvent ) : void
	{
		// Get the navigator interface.
		const { viewer } = event;
		const { navBase } = viewer;

		// Get the rotation mode.
		const mode = navBase.rotationMode;

		// Handle no rotation mode, which means the navigator is not a trackball.
		if ( !mode )
		{
			return;
		}

		// Set the space based on the rotation mode.
		this.space = ( ( "turn_table" === mode ) ? "local" : "global" );

		// Now call the base class' function.
		super.execute ( event );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about Z command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateZ extends RotateAxisAngle
{
	/**
	 * Construct the class.
	 * @param {number} angle The angle in radians.
	 * @class
	 */
	public constructor ( angle: number )
	{
		super ( [ 0, 0, 1 ], angle );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Set the navigator such that the sphere is visible.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class ViewSphere extends Command
{
	#resetRotation = false;

	/**
	 * Construct the class.
	 * @param {boolean} resetRotation Whether or not to reset the rotation.
	 * @class
	 */
	public constructor ( resetRotation: boolean )
	{
		super();
		this.#resetRotation = resetRotation;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Commands.ViewSphere";
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		const { viewer } = event;
		viewer.viewAll ( { resetRotation: this.#resetRotation } );
		viewer.requestRender();
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Zoom in and out with the navigator.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Zoom extends Command
{
	#scaleIn = 1;
	#scaleOut = 1;

	/**
	 * Construct the class.
	 * @param {number} scaleIn The scale factor for zooming in.
	 * @param {number} scaleOut The scale factor for zooming out.
	 * @class
	 */
	public constructor ( scaleIn: number, scaleOut: number )
	{
		super();
		this.#scaleIn = scaleIn;
		this.#scaleOut = scaleOut;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Commands.Zoom";
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		// Get input.
		const { event: originalEvent, viewer } = event;
		const { deltaY } = ( originalEvent as WheelEvent );
		const { navBase } = viewer;

		// Handle no motion.
		if ( 0 === deltaY )
		{
			return;
		}

		// Get the correct scale from the direction of wheel rotation.
		const scale = ( deltaY > 0 ) ? this.#scaleOut : this.#scaleIn;

		// Zoom the navigator.
		navBase.zoom ( scale );

		// Render again so that we can see the change.
		viewer.requestRender();
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Translate the navigator with the mouse.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class MouseTranslate extends Command
{
	#scale = 1;

	/**
	 * Construct the class.
	 * @param {number} scale The scale factor for translation.
	 * @class
	 */
	public constructor ( scale: number )
	{
		super();
		this.#scale = scale;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Commands.MouseTranslate";
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		// Shortcuts.
		const { viewer } = event;
		const { navBase } = viewer;
		const scale = this.#scale;

		// Try to translate the navigator with the mouse.
		const step = navBase.mouseTranslate ( { event, scale } );

		// Handle no translation.
		if ( !step )
		{
			return;
		}

		// Request a render so that we can see the change.
		viewer.requestRender();

		// Register an animation function that may be used.
		viewer.animations.nav.set ( `${this.type}.execute()`, ( fraction: number ) =>
		{
			// Take one step.
			step ( fraction );

			// Request a render.
			viewer.requestRender();
		} );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate the navigator with the mouse.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class MouseRotate extends Command
{
	#scale = 1;

	/**
	 * Construct the class.
	 * @param {number} scale The scale factor for rotation.
	 * @class
	 */
	public constructor ( scale: number )
	{
		super();
		this.#scale = scale;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Commands.MouseRotate";
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		// Shortcuts.
		const { viewer } = event;
		const { navBase } = viewer;
		const scale = this.#scale;

		// Try to rotate the navigator with the mouse.
		const step = navBase.mouseRotate ( { event, scale } );

		// Handle no rotation.
		if ( !step )
		{
			return;
		}

		// Request a render so that we can see the change.
		viewer.requestRender();

		// Register an animation function that may be used.
		viewer.animations.nav.set ( `${this.type}.execute()`, ( fraction: number ) =>
		{
			// Take one step.
			step ( fraction );

			// Request a render.
			viewer.requestRender();
		} );
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Return a map of the commands.
 * @returns {ICommandMap} The commands.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeCommands() : ICommandMap
{
	return new Map < ICommandName, ICommand > ( [
		[ "mouse_rotate_large",    new MouseRotate ( 1.0 )          ],
		[ "mouse_rotate_small",    new MouseRotate ( 0.1 )          ],
		[ "mouse_translate_large", new MouseTranslate ( 1.0 )       ],
		[ "mouse_translate_small", new MouseTranslate ( 0.1 )       ],
		[ "mouse_zoom_large",      new Zoom ( 0.90, 1.10 )          ],
		[ "mouse_zoom_small",      new Zoom ( 0.99, 1.01 )          ],
		[ "rotate_nx_large",       new RotateX ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nx_small",       new RotateX ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_ny_large",       new RotateY ( DEG_TO_RAD * -45 ) ],
		[ "rotate_ny_small",       new RotateY ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_nz_large",       new RotateZ ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nz_small",       new RotateZ ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_px_large",       new RotateX ( DEG_TO_RAD *  45 ) ],
		[ "rotate_px_small",       new RotateX ( DEG_TO_RAD *   5 ) ],
		[ "rotate_py_large",       new RotateY ( DEG_TO_RAD *  45 ) ],
		[ "rotate_py_small",       new RotateY ( DEG_TO_RAD *   5 ) ],
		[ "rotate_pz_large",       new RotateZ ( DEG_TO_RAD *  45 ) ],
		[ "rotate_pz_small",       new RotateZ ( DEG_TO_RAD *   5 ) ],
		[ "view_sphere_fit",       new ViewSphere ( false )         ],
		[ "view_sphere_reset",     new ViewSphere ( true  )         ],
	] );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make an input object.
 * @param {IEventType} type The event type.
 * @param {number[]} buttonsDown The mouse buttons pressed.
 * @param {string[]} keysDown The keyboard keys pressed.
 * @returns {string} The key to the map of command names.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeInput ( type: IEventType, buttonsDown: number[], keysDown: string[] ) : string
{
	return (
		"type: " + type +
		", buttonsDown: [" + buttonsDown.sort().toString() + "]" +
		", keysDown: [" + keysDown.sort().toString() + "]"
	);
}


///////////////////////////////////////////////////////////////////////////////
/**
 * We do this so that the lines below can sort with the command names.
 * @param {ICommandName} name The command name.
 * @param {IEventType} type The event type.
 * @param {number[]} buttonsDown The mouse buttons pressed.
 * @param {string[]} keysDown The keyboard keys pressed.
 * @returns {[string, ICommandName]} The tuple.
 */
///////////////////////////////////////////////////////////////////////////////

function makeTuple ( name: ICommandName, type: IEventType, buttonsDown: number[], keysDown: string[] ) : [ string, ICommandName ]
{
	const key = makeInput ( type, buttonsDown, keysDown );
	return [ key, name ];
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the map of input to command.
 * @returns {IInputToCommandNameMap} The input to command map.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeInputToCommandMap() : IInputToCommandNameMap
{
	const au = "ArrowUp";
	const ad = "ArrowDown";
	const al = "ArrowLeft";
	const ar = "ArrowRight";
	const sl = "ShiftLeft";
	const sr = "ShiftRight";
	const sp = "Space";
	const kf = "KeyF";

	return new Map < string, ICommandName > ( [
		makeTuple ( "mouse_rotate_large",    "mouse_drag",  [ 0 ], [        ] ),
		makeTuple ( "mouse_rotate_small",    "mouse_drag",  [ 0 ], [ sl     ] ),
		makeTuple ( "mouse_rotate_small",    "mouse_drag",  [ 0 ], [ sr     ] ),
		makeTuple ( "mouse_translate_large", "mouse_drag",  [ 2 ], [        ] ),
		makeTuple ( "mouse_translate_small", "mouse_drag",  [ 2 ], [ sl     ] ),
		makeTuple ( "mouse_translate_small", "mouse_drag",  [ 2 ], [ sr     ] ),
		makeTuple ( "mouse_zoom_large",      "mouse_wheel", [   ], [        ] ),
		makeTuple ( "mouse_zoom_small",      "mouse_wheel", [   ], [ sl     ] ),
		makeTuple ( "rotate_nx_large",       "key_down",    [   ], [ au     ] ),
		makeTuple ( "rotate_nx_small",       "key_down",    [   ], [ sl, au ] ),
		makeTuple ( "rotate_nx_small",       "key_down",    [   ], [ sr, au ] ),
		makeTuple ( "rotate_ny_large",       "key_down",    [   ], [ al     ] ),
		makeTuple ( "rotate_ny_small",       "key_down",    [   ], [ sl, al ] ),
		makeTuple ( "rotate_ny_small",       "key_down",    [   ], [ sr, al ] ),
		makeTuple ( "rotate_px_large",       "key_down",    [   ], [ ad     ] ),
		makeTuple ( "rotate_px_small",       "key_down",    [   ], [ sl, ad ] ),
		makeTuple ( "rotate_px_small",       "key_down",    [   ], [ sr, ad ] ),
		makeTuple ( "rotate_py_large",       "key_down",    [   ], [ ar     ] ),
		makeTuple ( "rotate_py_small",       "key_down",    [   ], [ sl, ar ] ),
		makeTuple ( "rotate_py_small",       "key_down",    [   ], [ sr, ar ] ),
		makeTuple ( "view_sphere_fit",       "key_down",    [   ], [ kf     ] ),
		makeTuple ( "view_sphere_reset",     "key_down",    [   ], [ sp     ] ),
	] );
}
