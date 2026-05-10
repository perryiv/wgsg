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
import { Color, DEVELOPER_BUILD } from "../../../Tools";
import { Common as BaseClass } from "./Common";
import { Group, Node as SceneNode } from "../../../Scene/Nodes";
import { vec3 } from "gl-matrix";
import type { IVector3, IVector4 } from "../../../Types";

const STL_HEADER_LENGTH = 80;
const STL_TRIANGLE_COUNT_LENGTH = 4;
const STL_START_OF_DATA = STL_HEADER_LENGTH + STL_TRIANGLE_COUNT_LENGTH;
const STL_RECORD_LENGTH = 50;


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
	 * Get the color data, if any.
	 * @param {File} file The file to read.
	 * @returns {Promise<IVector4|null>} A promise that resolves to the color data, or null if there is none.
	 */
	protected async getColorData ( file: File ) : Promise < IVector4 | null >
	{
		const header = await ( file.slice ( 0, STL_HEADER_LENGTH ) ).text();
		let index = header.indexOf ( "COLOR=" );

		if ( -1 === index )
		{
			return null;
		}

		index += 6; // Skip "COLOR=".
		const data = await ( file.slice ( index, index + 12 ) ).arrayBuffer();
		const view = new DataView ( data );
		const color: IVector4 = [
			( view.getUint8 ( 0 ) / 255 ),
			( view.getUint8 ( 1 ) / 255 ),
			( view.getUint8 ( 2 ) / 255 ),
			( view.getUint8 ( 3 ) / 255 )
		];

		return color;
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
			this.getColorData ( file )
			.then ( ( color ) =>
			{
				this.color = ( color ?? this.color );
				this.internalRead ( file )
				.then ( ( scene ) =>
				{
					resolve ( scene );
				} )
				.catch ( ( error ) =>
				{
					reject ( new Error ( `Error reading STL file: ${error}` ) );
				} );
			} ).catch ( ( error ) =>
			{
				reject ( new Error ( `Error trying to read color information from STL file: ${error}` ) );
			} );
		} );
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	protected internalRead ( file: File ) : Promise < SceneNode >
	{
		return new Promise ( ( resolve, reject ) =>
		{
			const recordSize = STL_RECORD_LENGTH;
			const offset = STL_START_OF_DATA; // After the header and triangle count.
			const dataSize = file.size - offset;

			// Make sure the sizes make sense.
			{
				if ( dataSize < 0 )
				{
					reject ( new Error ( "File is too small to be a valid binary STL" ) );
					return;
				}

				if ( 0 !== ( dataSize % recordSize ) )
				{
					reject ( new Error ( "Size of binary STL data is not a multiple of the record size" ) );
					return;
				}
			}

			// Now we can safely determine the number of triangles.
			const numTriangles = ( dataSize / recordSize );

			// The chunk size has to be a multiple of the record size,
			// but can't be bigger than all of the data.
			const chunkSize = Math.min ( dataSize, ( recordSize * 10000 ) );

			// Get or make the progress callback.
			const onProgress = this.getProgressCallback();

			// Allocate the arrays to a reasonably large size. We'll make more if
			// these fill up, and we'll trim them if there is extra space.
			let { points, normals, indices } = BaseClass.allocateArrays ( 1024 * 1024 );

			// We have to keep count.
			let pointCount = 0;
			let normalCount = 0;
			let indexCount = 0;

			// Initialize for below.
			const reader = new FileReader();
			let triangleCount = 0;
			let fileOffset = offset;
			let p1x = 0; let p1y = 0; let p1z = 0;
			let p2x = 0; let p2y = 0; let p2z = 0;
			let p3x = 0; let p3y = 0; let p3z = 0;
			const normal: IVector3 = [ 0, 0, 0 ];

			// The group node we return.
			const scene = new Group();

			// Process one chunk of data.
			const processChunk = () =>
			{
				// Determine the end of the chunk.
				const endOffset = Math.min ( fileOffset + chunkSize, file.size );

				// Make a blob for this portion of the data.
				const blob = file.slice ( fileOffset, endOffset );

				// This is called if there is an error.
				reader.onerror = () =>
				{
					reject ( new Error (`Error reading the file: ${reader.error}` ) );
					return;
				};

				// This is called when the chunk of data is ready.
				reader.onload = () =>
				{
					// Make the view for the data.
					const buffer = ( reader.result as ArrayBuffer );
					const view = new DataView ( buffer );

					// Initialize for the loop below.
					let byteOffset = 0;

					// While there is more data to process ...
					while ( ( byteOffset + recordSize ) <= view.byteLength )
					{
						// Get the normal vector.
						normal[0] = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						normal[1] = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						normal[2] = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

						// Make sure all the values are finite.
						if ( !isFinite ( normal[0] ) || !isFinite ( normal[1] ) || !isFinite ( normal[2] ) )
						{
							reject ( new Error ( `Normal vector for triangle ${triangleCount} has non-finite values` ) );
							return;
						}

						// Make sure it is a unit vector.
						vec3.normalize ( normal, normal );

						// Get the first point.
						p1x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p1y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p1z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

						// Make sure all the values are finite.
						if ( !isFinite ( p1x ) || !isFinite ( p1y ) || !isFinite ( p1z ) )
						{
							reject ( new Error ( `First point for triangle ${triangleCount} has non-finite values` ) );
							return;
						}

						// Get the second point.
						p2x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p2y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p2z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

						// Make sure all the values are finite.
						if ( !isFinite ( p2x ) || !isFinite ( p2y ) || !isFinite ( p2z ) )
						{
							reject ( new Error ( `Second point for triangle ${triangleCount} has non-finite values` ) );
							return;
						}

						// Get the third point.
						p3x = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p3y = view.getFloat32 ( byteOffset, true ); byteOffset += 4;
						p3z = view.getFloat32 ( byteOffset, true ); byteOffset += 4;

						// Make sure all the values are finite.
						if ( !isFinite ( p3x ) || !isFinite ( p3y ) || !isFinite ( p3z ) )
						{
							reject ( new Error ( `Third point for triangle ${triangleCount} has non-finite values` ) );
							return;
						}

						// There are 2 more bytes that we ignore.
						// See https://en.wikipedia.org/wiki/STL_%28file_format%29
						byteOffset += 2;

						// Can the arrays hold more?
						if ( ( pointCount + 9 ) >= points.length )
						{
							// Build the scene with the data we have so far.
							scene.addChild ( this.buildScene (
								points, normals, indices,
								pointCount, normalCount, indexCount
							) );

							// Make new arrays.
							const newArrays = BaseClass.allocateArrays ( 1024 * 1024 );
							points = newArrays.points;
							normals = newArrays.normals;
							indices = newArrays.indices;
							pointCount = normalCount = indexCount = 0;

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

						// Is the normal vector zero length?
						if ( ( 0 === normal[0] ) && ( 0 === normal[1] ) && ( 0 === normal[2] ) )
						{
							this.setNormalFromCrossProduct ( normal, points, pointCount );
						}

						// We need a normal for each point.
						normals[normalCount++] = normal[0];
						normals[normalCount++] = normal[1];
						normals[normalCount++] = normal[2];

						normals[normalCount++] = normal[0];
						normals[normalCount++] = normal[1];
						normals[normalCount++] = normal[2];

						normals[normalCount++] = normal[0];
						normals[normalCount++] = normal[1];
						normals[normalCount++] = normal[2];

						// Add trivial indices.
						indices[indexCount] = indexCount++;
						indices[indexCount] = indexCount++;
						indices[indexCount] = indexCount++;

						// Report progress and check to see if reading was cancelled.
						if ( false === onProgress ( triangleCount, numTriangles ) )
						{
							reader.abort();
							reject ( new Cancelled ( "File reading was cancelled by the progress callback" ) );
							return;
						}

						// We have processed another triangle.
						triangleCount++;
					}

					// The byte offset should be a multiple of the record size.
					if ( 0 !== ( byteOffset % recordSize ) )
					{
						reject ( new Error ( `Byte offset ${byteOffset} is not a multiple of the record size ${recordSize}` ) );
						return;
					}

					// Adjust the offset.
					fileOffset = endOffset;

					// If we are not at the end ...
					if ( fileOffset < file.size )
					{
						// Do it again as soon as possible.
						setTimeout ( processChunk, 0 );
					}
					else
					{
						// Build the final scene, which may be the only one for smaller files.
						scene.addChild ( this.buildScene (
							points, normals, indices,
							pointCount, normalCount, indexCount
						) );

						// Send the final progress notification.
						if ( false === onProgress ( numTriangles, numTriangles ) )
						{
							reject ( new Error ( "File reading was cancelled by the progress callback" ) );
							return;
						}

						// To speed things up later, calculate the bounds now.
						void scene.bounds;

						// We succeeded.
						resolve ( scene );
					}
				};

				// Read the chunk of data.
				reader.readAsArrayBuffer ( blob );
			};

			// Get things started.
			processChunk();
		} );
	}
}
