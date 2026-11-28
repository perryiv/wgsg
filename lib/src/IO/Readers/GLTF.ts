///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	glTF file reader, for .glb and .gltf files.
//	See: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
//
///////////////////////////////////////////////////////////////////////////////

import { addReader, ReaderFactory as Factory } from "../Reader";
import { Cancelled } from "../Cancelled";
import { getErrorMessage } from "../Functions";
import { Node as SceneNode } from "../../Scene/Nodes";
import { Reader as BaseClass } from "../Reader";
import { readGlb, readGltf } from "./GLTF/Container";
import { Builder as SceneBuilder } from "./GLTF/Builder";
import { decodeImage, type IImageDecoder } from "./GLTF/Images";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for glTF file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class GLTF extends BaseClass
{
	// Decodes the images of textures. The default is the browser's
	// createImageBitmap(). Set it to decode images another way.
	public imageDecoder: IImageDecoder = decodeImage;

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
		return "IO.Readers.GLTF";
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * A .gltf file is JSON. Anything else is read as a .glb file.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override async read ( file: File ) : Promise < SceneNode >
	{
		try
		{
			const isJson = file.name.toLowerCase().endsWith ( ".gltf" );
			const data = await ( isJson ? readGltf ( file ) : readGlb ( file ) );
			return await new SceneBuilder ( data, this.getProgressCallback(), this.imageDecoder ).build();
		}
		catch ( error )
		{
			// Do not hide the fact that reading was cancelled.
			if ( error instanceof Cancelled )
			{
				throw error;
			}
			throw new Error ( `Error reading glTF file: ${getErrorMessage ( error )}` );
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
	return new GLTF();
};


////////////////////////////////////////////////////////////////////////////////
//
//	Add the factory function for this reader.
//
////////////////////////////////////////////////////////////////////////////////

addReader ( "glb", factory );
addReader ( "GLB", factory );
addReader ( "gltf", factory );
addReader ( "GLTF", factory );
