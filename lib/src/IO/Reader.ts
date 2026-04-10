///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Manager of file readers.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Node as SceneNode } from "../Scene/Nodes";
import type { IProgressCallback } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	The map of readers.
//
///////////////////////////////////////////////////////////////////////////////

const readers = new Map < string, Reader > ();


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all readers.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Reader extends BaseClass
{
	#progress: ( IProgressCallback | null ) = null;

	/**
	 * Construct the class.
	 * @abstract
	 */
	protected constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "IO.Reader";
	}

	/**
	 * Get the progress callback function.
	 * @returns {IProgressCallback | null} The progress callback function.
	 */
	public get progress() : ( IProgressCallback | null )
	{
		return this.#progress;
	}

	/**
	 * Set the progress callback function.
	 * If the callback returns false, the reading operation should stop.
	 * @param {IProgressCallback | null} callback The progress callback function.
	 */
	public set progress ( callback: ( IProgressCallback | null ) )
	{
		this.#progress = callback;
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {string} file The name of the file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public abstract read ( file: string ) : Promise < SceneNode >;
}


/**
 * Add a reader to the map of readers.
 * @param {string} extension The file extension that this reader can handle.
 * @param {Reader} reader The reader to add.
 */
export function addReader ( extension: string, reader: Reader ) : void
{
	if ( extension.length <= 0 )
	{
		throw new Error( "Empty extension string when adding reader" );
	}

	readers.set ( extension, reader );
}

/**
 * Remove a reader from the map of readers.
 * @param {string} extension The file extension that this reader can handle.
 */
export function removeReader ( extension: string ) : void
{
	readers.delete ( extension );
}

/**
 * Clear all readers from the map of readers.
 */
export function clearReaders() : void
{
	readers.clear();
}

/**
 * Get a reader for the given file extension.
 * @param {string} extension The file extension to get the reader for.
 * @returns {Reader | null} The reader for the given file extension, or null if no reader is found.
 */
export function getReader ( extension: string ) : ( Reader | null )
{
	return ( readers.get ( extension ) ?? null );
}

/**
 * See if a reader exists for the given file extension.
 * @param {string} extension The file extension to check for.
 * @returns {boolean} True if a reader exists for the given file extension, false otherwise.
 */
export function hasReader ( extension: string ) : boolean
{
	return readers.has ( extension );
}
