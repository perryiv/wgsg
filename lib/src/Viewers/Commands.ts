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
import { quat, vec3 } from "gl-matrix";
import type {
	ICommand,
	ICommandMap,
	ICommandName,
	IEvent,
	IEventType,
	IInputToCommandNameMap,
	IVector3,
	IVector4,
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

export class Rotate extends Command
{
	#axis: IVector3 = [ 0, 1, 0 ];
	#angle = 0;

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
		return "Viewers.Commands.Rotate";
	}

	/**
	 * Execute the command.
	 * @param {IEvent} event The event.
	 */
	public execute ( event: IEvent ) : void
	{
		const { viewer } = event;
		const { navBase } = viewer;
		const rot: IVector4 = [ 0, 0, 0, 1 ];
		quat.setAxisAngle ( rot, this.#axis, this.#angle );
		navBase.rotate ( rot );
		viewer.requestRender();
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about X	command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateX extends Rotate
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
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about Y command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateY extends Rotate
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
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Rotate about Z command.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class RotateZ extends Rotate
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
 * Return a map of the commands.
 * @returns {ICommandMap} The commands.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeCommands() : ICommandMap
{
	return new Map < ICommandName, ICommand > ( [
		[ "zoom_large", new Zoom ( 0.90, 1.10 ) ],
		[ "zoom_small", new Zoom ( 0.99, 1.01 ) ],
		[ "rotate_nx_large",   new RotateX ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nx_small",   new RotateX ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_ny_large",   new RotateY ( DEG_TO_RAD * -45 ) ],
		[ "rotate_ny_small",   new RotateY ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_nz_large",   new RotateZ ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nz_small",   new RotateZ ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_px_large",   new RotateX ( DEG_TO_RAD *  45 ) ],
		[ "rotate_px_small",   new RotateX ( DEG_TO_RAD *   5 ) ],
		[ "rotate_py_large",   new RotateY ( DEG_TO_RAD *  45 ) ],
		[ "rotate_py_small",   new RotateY ( DEG_TO_RAD *   5 ) ],
		[ "rotate_pz_large",   new RotateZ ( DEG_TO_RAD *  45 ) ],
		[ "rotate_pz_small",   new RotateZ ( DEG_TO_RAD *   5 ) ],
		[ "view_sphere_fit",   new ViewSphere ( false ) ],
		[ "view_sphere_reset", new ViewSphere ( true  ) ],
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
 * We do this so the the lines below can sort with the command names.
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

	return new Map < string, ICommandName > ( [
		makeTuple ( "rotate_nx_large",   "key_down",    [], [ au     ] ),
		makeTuple ( "rotate_nx_small",   "key_down",    [], [ sl, au ] ),
		makeTuple ( "rotate_nx_small",   "key_down",    [], [ sr, au ] ),
		makeTuple ( "rotate_ny_large",   "key_down",    [], [ al     ] ),
		makeTuple ( "rotate_ny_small",   "key_down",    [], [ sl, al ] ),
		makeTuple ( "rotate_ny_small",   "key_down",    [], [ sr, al ] ),
		makeTuple ( "rotate_px_large",   "key_down",    [], [ ad     ] ),
		makeTuple ( "rotate_px_small",   "key_down",    [], [ sl, ad ] ),
		makeTuple ( "rotate_px_small",   "key_down",    [], [ sr, ad ] ),
		makeTuple ( "rotate_py_large",   "key_down",    [], [ ar     ] ),
		makeTuple ( "rotate_py_small",   "key_down",    [], [ sl, ar ] ),
		makeTuple ( "rotate_py_small",   "key_down",    [], [ sr, ar ] ),
		makeTuple ( "view_sphere_fit",   "key_down",    [], [ "KeyF" ] ),
		makeTuple ( "view_sphere_reset", "key_down",    [], [ sp     ] ),
		makeTuple ( "zoom_large",        "mouse_wheel", [], [        ] ),
		makeTuple ( "zoom_small",        "mouse_wheel", [], [ sl     ] ),
	] );
}
