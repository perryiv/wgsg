///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	GLB file reader.
//
///////////////////////////////////////////////////////////////////////////////

import { addReader, ReaderFactory as Factory } from "../Reader";
import { Group, Node as SceneNode } from "../../Scene/Nodes";
import { Reader as BaseClass } from "../Reader";

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for GLB file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

class GLB extends BaseClass
{
	/**
	 * Construct the class.
	 * @class
	 */
	public constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "IO.Readers.GLB";
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override read ( file: File ) : Promise < SceneNode >
	{
		return new Promise ( ( resolve, reject ) =>
		{
			this.readFileHeader ( file )
			.then ( ( offset: number ) =>
			{
				return this.readChunkHeader ( file, offset );
			} )
			.then ( ( data: { length: number, type: number, offset: number } ) =>
			{
				const { length, type, offset } = data;
				return this.readChunkData ( file, length, type, offset );
			} )
			.then ( () =>
			{
				resolve ( new Group() );
			} )
			.catch ( ( error: Error ) =>
			{
				reject ( error );
			} );
		} );
	}

	/**
	 * Create an error object from a message and a FileReader progress event.
	 * @param {string} message The error message.
	 * @param {ProgressEvent<FileReader>} event The progress event from the FileReader.
	 * @returns {Error} The constructed error object.
	 */
	protected static makeError ( message: string, event: ProgressEvent < FileReader > ) : Error
	{
			if ( event.target?.error )
			{
				message = `${message}, ${event.target.error.message}`;
			}
			return ( new Error ( message ) );
	}

	/**
	 * Read the header of the GLB file.
	 * @param {File} file The file to read.
	 * @returns {Promise<void>} A promise that resolves when the header has been read.
	 */
	protected readFileHeader ( file: File ) : Promise < number >
	{
		return new Promise ( ( resolve, reject ) =>
		{
			// Make the reader.
			const reader = new FileReader();

			// This is called if there is an error.
			reader.onerror = ( event: ProgressEvent < FileReader > ) =>
			{
				reject ( GLB.makeError ( `Error reading header for file: ${file.name}`, event ) );
				return;
			}

			// This is called when the data is ready.
			reader.onload = () =>
			{
				// Make the view for the header data.
				const buffer = ( reader.result as ArrayBuffer );
				const view = new DataView ( buffer );

				// Get the header.
				const magic   = view.getUint32 ( 0, true );
				const version = view.getUint32 ( 4, true );
				const length  = view.getUint32 ( 8, true );

				// Make sure the magic number is correct.
				if ( magic !== 0x46546C67 ) // ASCII for "glTF".
				{
					reject ( new Error ( `Incorrect GLB magic number: ${magic}, should be 0x46546C67` ) );
					return;
				}

				// Make sure the version is supported.
				if ( version !== 2 )
				{
					reject ( new Error ( `Unsupported GLB version: ${version}` ) );
					return;
				}

				// Make sure the length is consistent with the file size.
				if ( length !== file.size )
				{
					reject ( new Error ( `Invalid GLB file length: expected ${length}, got ${file.size}` ) );
					return;
				}

				// We succeeded.
				resolve ( GLB_FILE_HEADER_SIZE );
			}

			// Read the file header.
			reader.readAsArrayBuffer ( file.slice ( 0, GLB_FILE_HEADER_SIZE ) );
		} );
	}

	/**
	 * Read the header of the next chunk of data.
	 * @param {File} file The file to read.
	 * @param {number} offset The offset in the file where the chunk header starts.
	 * @returns {Promise<number>} A promise that resolves with the size of the chunk header when it has been read.
	 */
	protected readChunkHeader ( file: File, offset: number ) : Promise < { length: number, type: number, offset: number } >
	{
		return new Promise ( ( resolve, reject ) =>
		{
			// Make the reader.
			const reader = new FileReader();

			// This is called if there is an error.
			reader.onerror = ( event: ProgressEvent < FileReader > ) =>
			{
				reject ( GLB.makeError ( `Error reading data chunk header at offset ${offset} for file '${file.name}'`, event ) );
			}

			// This is called when the data is ready.
			reader.onload = () =>
			{
				// Make the view for the chunk header data.
				const buffer = ( reader.result as ArrayBuffer );
				const view = new DataView ( buffer );

				// Get the chunk header.
				const length = view.getUint32 ( 0, true );
				const type   = view.getUint32 ( 4, true );

				// We succeeded.
				resolve ( { length, type, offset } );
			}

			// Read the chunk header.
			reader.readAsArrayBuffer ( file.slice ( offset, offset + GLB_CHUNK_HEADER_SIZE ) );
		} );
	}
}


////////////////////////////////////////////////////////////////////////////////
//
//	The factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

const factory: Factory = () =>
{
	return new GLB();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "glb", factory );
addReader ( "GLB", factory );
