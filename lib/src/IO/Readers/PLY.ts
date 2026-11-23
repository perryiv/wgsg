///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	PLY file reader.
//	See: https://paulbourke.net/dataformats/ply/
//
///////////////////////////////////////////////////////////////////////////////

import { addReader, ReaderFactory as Factory } from "../Reader";
import { Cancelled } from "../Cancelled";
import { getErrorMessage } from "../Functions";
import { MeshBuilder } from "./PLY/Common";
import { Node as SceneNode } from "../../Scene/Nodes";
import { Reader as BaseClass } from "../Reader";
import { readHeader } from "./PLY/Header";
import { readText } from "./PLY/Text";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for PLY file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class PLY extends BaseClass
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
		return "IO.Readers.PLY";
	}

	/**
	 * Get the most vertices in one geometry. The faces of a file are split
	 * into geometries of at most this many vertices.
	 * @returns {number} The most vertices.
	 */
	public static get maxVerticesPerGeometry () : number
	{
		return MeshBuilder.maxVerticesPerGeometry;
	}

	/**
	 * Set the most vertices in one geometry, for the files read after this.
	 * Up to 65536 uses 16-bit indices, which take half the memory. More than
	 * that uses 32-bit indices, but makes fewer geometries to draw.
	 * @param {number} maxVertices The most vertices, an integer of at least 3.
	 */
	public static set maxVerticesPerGeometry ( maxVertices: number )
	{
		MeshBuilder.maxVerticesPerGeometry = maxVertices;
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override async read ( file: File ) : Promise < SceneNode >
	{
		try
		{
			const header = await readHeader ( file );
			switch ( header.format )
			{
				case "ascii":
				{
					return await readText ( file, header, this.getProgressCallback() );
				}
				default:
				{
					throw new Error ( "Binary PLY files are not supported yet" );
				}
			}
		}
		catch ( error )
		{
			// Do not hide the fact that reading was cancelled.
			if ( error instanceof Cancelled )
			{
				throw error;
			}
			throw new Error ( `Error reading PLY file: ${getErrorMessage ( error )}` );
		}
	}
}


////////////////////////////////////////////////////////////////////////////////
//
//	The factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

const factory: Factory = () =>
{
	return new PLY();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "ply", factory );
addReader ( "PLY", factory );
