///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for most other classes.
//
///////////////////////////////////////////////////////////////////////////////

import { DEVELOPER_BUILD, getNextId } from "../Tools";


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for most other classes.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Base
{
	// We check the build type to avoid the (possibly) expensive call to
	// "this.type" in a production environment every time we need a new id.
	#id: number = ( ( DEVELOPER_BUILD ) ? ( getNextId ( this.type ) ) : ( getNextId() ) );

	// The number of things using this object, see ref() and unref().
	#refCount = 0;

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		// Nothing to do.
	}

	/**
	 * Destroy the class.
	 */
	public destroy() : void
	{
		// Nothing to do.
	}

	/**
	 * Get the reference count. This is the number of things that use this
	 * object, like groups that have it as a child or the viewer that shows
	 * it. It is not the number of variables that refer to it.
	 * @returns {number} The reference count.
	 */
	public get refCount() : number
	{
		return this.#refCount;
	}

	/**
	 * Add a reference. Called by whatever starts using this object.
	 */
	public ref() : void
	{
		if ( 1 === ++this.#refCount )
		{
			this.onFirstRef();
		}
	}

	/**
	 * Remove a reference. Called by whatever stops using this object.
	 */
	public unref() : void
	{
		if ( this.#refCount <= 0 )
		{
			throw new Error ( `Unreferencing ${this.type} ${this.id} too many times` );
		}
		if ( 0 === --this.#refCount )
		{
			this.onLastUnref();
		}
	}

	/**
	 * Called when the reference count goes from 0 to 1. Objects that hold
	 * other objects override this to reference them.
	 */
	protected onFirstRef() : void
	{
		// Nothing to do.
	}

	/**
	 * Called when the reference count goes from 1 to 0. Objects override this
	 * to unreference what they hold and release their GPU resources. Unlike a
	 * C++ destructor, the object stays usable, because JavaScript variables
	 * can still refer to it. It can be referenced again later.
	 */
	protected onLastUnref() : void
	{
		// Nothing to do.
	}

	/**
	 * Return the id.
	 * @returns {number} The id.
	 */
	public get id()
	{
		return this.#id;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public abstract getClassName() : string;

	/**
	 * Return the type.
	 * @returns {string} The type.
	 */
	public get type()
	{
		return this.getClassName();
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public toJSON() : object
	{
		// Return the object that represents this class.
		return {
			id: this.#id,
			type: this.type
		};
	}
}
