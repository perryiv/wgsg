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
	IEventType,
	IInputToCommandNameMap,
	INavigator,
	IVector3,
	IVector4,
	IViewer,
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
	 * @param {IViewer} viewer The viewer.
	 */
	abstract execute ( viewer: IViewer ) : void;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * A command to rotate the viewer.
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
	constructor ( axis: Readonly<IVector3>, angle: number )
	{
		super();
		vec3.copy ( this.#axis, axis );
		this.#angle = angle;
	}

	/**
	 * Get the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Viewers.Commands.Rotate";
	}

	/**
	 * Execute the command.
	 * @param {IViewer} viewer The viewer.
	 */
	public execute ( viewer: IViewer ) : void
	{
		const nav: INavigator = viewer.navigator;
		const rot: IVector4 = [ 0, 0, 0, 1 ];
		quat.setAxisAngle ( rot, this.#axis, this.#angle );
		nav.rotate ( rot );
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
	constructor ( angle: number )
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
	constructor ( angle: number )
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
	constructor ( angle: number )
	{
		super ( [ 0, 0, 1 ], angle );
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
		[ "rotate_px_large", new RotateX ( DEG_TO_RAD *  45 ) ],
		[ "rotate_py_large", new RotateY ( DEG_TO_RAD *  45 ) ],
		[ "rotate_pz_large", new RotateZ ( DEG_TO_RAD *  45 ) ],
		[ "rotate_px_small", new RotateX ( DEG_TO_RAD *   5 ) ],
		[ "rotate_py_small", new RotateY ( DEG_TO_RAD *   5 ) ],
		[ "rotate_pz_small", new RotateZ ( DEG_TO_RAD *   5 ) ],
		[ "rotate_nx_large", new RotateX ( DEG_TO_RAD * -45 ) ],
		[ "rotate_ny_large", new RotateY ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nz_large", new RotateZ ( DEG_TO_RAD * -45 ) ],
		[ "rotate_nx_small", new RotateX ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_ny_small", new RotateY ( DEG_TO_RAD *  -5 ) ],
		[ "rotate_nz_small", new RotateZ ( DEG_TO_RAD *  -5 ) ],
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

	return new Map < string, ICommandName > ( [
		[ makeInput ( "key_down", [], [ au     ] ), "rotate_nx_large" ],
		[ makeInput ( "key_down", [], [ ad     ] ), "rotate_px_large" ],
		[ makeInput ( "key_down", [], [ al     ] ), "rotate_ny_large" ],
		[ makeInput ( "key_down", [], [ ar     ] ), "rotate_py_large" ],
		[ makeInput ( "key_down", [], [ sl, au ] ), "rotate_nx_small" ],
		[ makeInput ( "key_down", [], [ sl, ad ] ), "rotate_px_small" ],
		[ makeInput ( "key_down", [], [ sl, al ] ), "rotate_ny_small" ],
		[ makeInput ( "key_down", [], [ sl, ar ] ), "rotate_py_small" ],
		[ makeInput ( "key_down", [], [ sr, au ] ), "rotate_nx_small" ],
		[ makeInput ( "key_down", [], [ sr, ad ] ), "rotate_px_small" ],
		[ makeInput ( "key_down", [], [ sr, al ] ), "rotate_ny_small" ],
		[ makeInput ( "key_down", [], [ sr, ar ] ), "rotate_py_small" ],
	] );
}
