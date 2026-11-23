///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Binary STL file reader.
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled } from "../../Cancelled";
import { ColorTool as Color, DEVELOPER_BUILD } from "../../../Tools";
import { Common as BaseClass } from "./Common";
import { findBytes, readBytes, yieldToEventLoop } from "../../Functions";
import { Group, Node as SceneNode } from "../../../Scene/Nodes";
import type { IVector4 } from "../../../Types";

const STL_HEADER_LENGTH = 80;
const STL_TRIANGLE_COUNT_LENGTH = 4;
const STL_START_OF_DATA = STL_HEADER_LENGTH + STL_TRIANGLE_COUNT_LENGTH;
const STL_RECORD_LENGTH = 50;
const STL_COLOR_KEYWORD = "COLOR=";
const STL_COLOR_LENGTH = 4;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the message from an unknown error.
 * @param {unknown} error The error.
 * @returns {string} The error message.
 */
///////////////////////////////////////////////////////////////////////////////

const getErrorMessage = ( error: unknown ) : string =>
{
	return ( ( error instanceof Error ) ? error.message : String ( error ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for Binary STL file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class BinaryReader extends BaseClass
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
		return "IO.Readers.STL.BinaryReader";
	}

	/**
	 * Get the color data, if any. As described for the "Materialise Magics
	 * software", the header may contain "COLOR=" followed by 4 bytes, which
	 * are the red, green, blue, and alpha values.
	 * See: https://en.wikipedia.org/wiki/STL_(file_format)
	 * @param {File} file The file to read.
	 * @returns {Promise<IVector4|null>} A promise that resolves to the color data, or null if there is none.
	 */
	protected async getColorData ( file: File ) : Promise < IVector4 | null >
	{
		// Read the header, or as much of it as there is.
		const end = Math.min ( file.size, STL_HEADER_LENGTH );
		if ( end <= 0 )
		{
			return null;
		}
		const header = new Uint8Array ( await readBytes ( file, 0, end ) );

		// Look for the keyword. This is a byte offset, not a character index.
		const index = findBytes ( header, STL_COLOR_KEYWORD );
		if ( -1 === index )
		{
			return null;
		}

		// The color values are right after the keyword. Make sure they are
		// in the header.
		const start = index + STL_COLOR_KEYWORD.length;
		if ( ( start + STL_COLOR_LENGTH ) > header.length )
		{
			return null;
		}

		// Return the color.
		return [
			( header[start + 0] / 255 ),
			( header[start + 1] / 255 ),
			( header[start + 2] / 255 ),
			( header[start + 3] / 255 )
		];
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override async read ( file: File ) : Promise < SceneNode >
	{
		// Get the color, if there is one.
		let color: ( IVector4 | null ) = null;
		try
		{
			color = await this.getColorData ( file );
		}
		catch ( error )
		{
			throw new Error ( `Error trying to read color information from STL file: ${getErrorMessage ( error )}` );
		}

		// Use the color if we found one.
		this.color = ( color ?? this.color );

		// Read the triangles.
		try
		{
			return await this.internalRead ( file );
		}
		catch ( error )
		{
			// Do not hide the fact that reading was cancelled.
			if ( error instanceof Cancelled )
			{
				throw error;
			}

			throw new Error ( `Error reading STL file: ${getErrorMessage ( error )}` );
		}
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	protected async internalRead ( file: File ) : Promise < SceneNode >
	{
		const recordSize = STL_RECORD_LENGTH;
		const offset = STL_START_OF_DATA; // After the header and triangle count.
		const dataSize = file.size - offset;

		// Make sure the sizes make sense.
		{
			if ( dataSize < 0 )
			{
				throw new Error ( "File is too small to be a valid binary STL" );
			}

			if ( 0 !== ( dataSize % recordSize ) )
			{
				throw new Error ( "Size of binary STL data is not a multiple of the record size" );
			}
		}

		// Now we can safely determine the number of triangles.
		const numTriangles = ( dataSize / recordSize );

		// The chunk size has to be a multiple of the record size.
		const chunkSize = ( recordSize * 10000 );

		// Get or make the progress callback.
		const onProgress = this.getProgressCallback();

		// Allocate the arrays for the number of triangles, up to the most that
		// one geometry can hold. We'll make more if these fill up.
		let { points, indices } = BaseClass.allocateArrays ( numTriangles );

		// We have to keep count.
		let pointCount = 0;
		let indexCount = 0;

		// Initialize for below.
		let triangleCount = 0;
		let fileOffset = offset;
		let p1x = 0; let p1y = 0; let p1z = 0;
		let p2x = 0; let p2y = 0; let p2z = 0;
		let p3x = 0; let p3y = 0; let p3z = 0;

		// The group node we return.
		const scene = new Group();

		// While there are more chunks of data ...
		while ( fileOffset < file.size )
		{
			// Determine the end of the chunk.
			const endOffset = Math.min ( fileOffset + chunkSize, file.size );

			// Read this chunk of data and make the view for it.
			const view = new DataView ( await readBytes ( file, fileOffset, endOffset ) );

			// Initialize for the loop below.
			let byteOffset = 0;

			// While there is more data to process ...
			while ( ( byteOffset + recordSize ) <= view.byteLength )
			{
				// Skip the normal vector. Flat shading calculates it in the shader.
				byteOffset += 12;

				// Get the first point.
				p1x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p1y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p1z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

				// Make sure all the values are finite.
				if ( !isFinite ( p1x ) || !isFinite ( p1y ) || !isFinite ( p1z ) )
				{
					throw new Error ( `First point for triangle ${triangleCount} has non-finite values` );
				}

				// Get the second point.
				p2x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p2y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p2z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

				// Make sure all the values are finite.
				if ( !isFinite ( p2x ) || !isFinite ( p2y ) || !isFinite ( p2z ) )
				{
					throw new Error ( `Second point for triangle ${triangleCount} has non-finite values` );
				}

				// Get the third point.
				p3x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p3y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
				p3z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

				// Make sure all the values are finite.
				if ( !isFinite ( p3x ) || !isFinite ( p3y ) || !isFinite ( p3z ) )
				{
					throw new Error ( `Third point for triangle ${triangleCount} has non-finite values` );
				}

				// There are 2 more bytes that we ignore.
				// See https://en.wikipedia.org/wiki/STL_%28file_format%29
				byteOffset += 2;

				// Are the arrays full?
				if ( ( pointCount + 9 ) > points.length )
				{
					// Build the scene with the data we have so far.
					scene.addChild ( this.buildScene (
						points, indices,
						pointCount, indexCount
					) );

					// Make new arrays for the remaining triangles.
					const newArrays = BaseClass.allocateArrays ( numTriangles - triangleCount );
					points = newArrays.points;
					indices = newArrays.indices;
					pointCount = indexCount = 0;

					// Set a new color if this is a developer build.
					if ( DEVELOPER_BUILD )
					{
						this.color = Color.makeRandomColor ( 0.2, 0.8 );
					}
				}

				// Save the points.
				points[pointCount++] = p1x;
				points[pointCount++] = p1y;
				points[pointCount++] = p1z;

				points[pointCount++] = p2x;
				points[pointCount++] = p2y;
				points[pointCount++] = p2z;

				points[pointCount++] = p3x;
				points[pointCount++] = p3y;
				points[pointCount++] = p3z;

				// Add trivial indices.
				indices[indexCount] = indexCount++;
				indices[indexCount] = indexCount++;
				indices[indexCount] = indexCount++;

				// Report progress and check to see if reading was cancelled.
				if ( false === onProgress ( triangleCount, numTriangles ) )
				{
					throw new Cancelled ( "File reading was cancelled by the progress callback" );
				}

				// We have processed another triangle.
				triangleCount++;
			}

			// We should have used all the data in the chunk.
			if ( byteOffset !== view.byteLength )
			{
				throw new Error ( `Processed ${byteOffset} bytes of a ${view.byteLength} byte chunk` );
			}

			// Adjust the offset.
			fileOffset = endOffset;

			// If we are not at the end then let the page update before the
			// next chunk.
			if ( fileOffset < file.size )
			{
				await yieldToEventLoop();
			}
		}

		// Build the final scene, which may be the only one for smaller files.
		scene.addChild ( this.buildScene (
			points, indices,
			pointCount, indexCount
		) );

		// Send the final progress notification.
		if ( false === onProgress ( numTriangles, numTriangles ) )
		{
			throw new Cancelled ( "File reading was cancelled by the progress callback" );
		}

		// To speed things up later, calculate the bounds now.
		void scene.bounds;

		// We succeeded.
		return scene;
	}
}
