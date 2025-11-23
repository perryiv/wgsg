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
	ICommandMapKey,
	ICommandName,
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
 * @param {number[]} mouse The mouse buttons pressed.
 * @param {string[]} keys The keyboard keys pressed.
 * @returns {ICommandMapKey} The key to the map of command names.
 */
///////////////////////////////////////////////////////////////////////////////

function makeInput ( mouse: number[], keys: string[] ) : ICommandMapKey
{
	return {
		buttonsDown: new Set ( mouse ),
		keysDown: new Set ( keys )
	};
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the map of input to command.
 * @returns {IInputToCommandNameMap} The input to command map.
 */
///////////////////////////////////////////////////////////////////////////////

export function makeInputToCommandMap() : IInputToCommandNameMap
{
	return new Map < ICommandMapKey, ICommandName > ( [
		[ makeInput ( [], [ "ArrowUp" ] ),   "rotate_px_large" ],
		[ makeInput ( [], [ "ArrowDown" ] ), "rotate_nx_large" ],
		[ makeInput ( [], [ "ArrowLeft" ] ), "rotate_py_large" ],
		[ makeInput ( [], [ "ArrowRight" ] ),"rotate_ny_large" ],
		[ makeInput ( [], [ "Shift", "ArrowUp" ] ),   "rotate_px_small" ],
		[ makeInput ( [], [ "Shift", "ArrowDown" ] ), "rotate_nx_small" ],
		[ makeInput ( [], [ "Shift", "ArrowLeft" ] ), "rotate_py_small" ],
		[ makeInput ( [], [ "Shift", "ArrowRight" ] ),"rotate_ny_small" ],
	] );
}


// What is a command?
// command name --> lambda function?
// command name --> base class with abstract function(s)?

// A different (although related) thing is the mapping from keyboard and mouse input to a command.
// You will want a two-way mapping.
// input --> command name
// command name --> input

// The first command is rotate_about_y so that you can debug the trackball.
