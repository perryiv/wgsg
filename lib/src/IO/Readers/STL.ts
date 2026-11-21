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
import { readBytes } from "../Functions";
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
	protected async isBinary ( file: File ) : Promise < boolean >
	{
		// A binary STL file has an 80 byte header followed by a 4 byte triangle
		// count, so anything smaller than that can not be binary.
		if ( file.size < 84 )
		{
			return false;
		}

		// Read the triangle count and see if the file is the expected size.
		const view = new DataView ( await readBytes ( file, 80, 84 ) );
		const numTriangles = view.getUint32 ( 0, true );
		return ( file.size === ( 84 + ( numTriangles * 50 ) ) );
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override async read ( file: File ) : Promise < SceneNode >
	{
		// Make the reader for the type of file.
		const binary = await this.isBinary ( file );
		const reader = ( ( true === binary ) ? new BinaryReader() : new TextReader() );

		// Read the file with the same progress callback.
		reader.progress = this.progress;
		return await reader.read ( file );
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
