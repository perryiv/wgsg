///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	STL file reader.
//
///////////////////////////////////////////////////////////////////////////////

import { addReader, ReaderFactory as Factory } from "../Reader";
import { BinaryReader } from "./STL/Binary";
import { Common as BaseClass } from "./STL/Common";
import { Node as SceneNode } from "../../Scene/Nodes";
import { TextReader } from "./STL/Text";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for STL file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

class STL extends BaseClass
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
		return "IO.Readers.STL";
	}

	/**
	 * Determine if the file is binary.
	 * See: https://stackoverflow.com/questions/26171521/verifying-that-an-stl-file-is-ascii-or-binary
	 * @param {File} file The file to check.
	 * @returns {Promise<boolean>} A promise that resolves to true if the file is binary, false if it is ASCII.
	 */
	protected isBinary ( file: File ) : Promise < boolean >
	{
		return new Promise ( ( resolve, reject ) =>
		{
			const reader = new FileReader();

			reader.onload = () =>
			{
				const view = new DataView ( reader.result as ArrayBuffer );
				const numTriangles = view.getUint32 ( 0, true );
				resolve ( file.size === ( 84 + ( numTriangles * 50 ) ) );
			};

			reader.onerror = () =>
			{
				reject ( new Error ( `Error reading the file: ${reader.error}` ) );
			};

			reader.readAsArrayBuffer ( file.slice ( 80, 84 ) );
		} );
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
			this.isBinary ( file )
			.then ( ( binary ) =>
			{
				if ( true === binary )
				{
					const reader = new BinaryReader();
					reader.progress = this.progress;
					return reader.read ( file )
					.then ( resolve )
					.catch ( reject );
				}
				else
				{
					const reader = new TextReader();
					reader.progress = this.progress;
					return reader.read ( file )
					.then ( resolve )
					.catch ( reject );
				}
			} )
			.catch ( ( error ) =>
			{
				reject ( ( error instanceof Error )
					? error
					: ( new Error ( String ( error ) ) )
				);
			} );
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
	return new STL();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "stl", factory );
addReader ( "STL", factory );
