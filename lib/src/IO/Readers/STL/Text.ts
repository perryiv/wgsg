///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Text STL file reader.
//
///////////////////////////////////////////////////////////////////////////////

import { Common as BaseClass } from "./Common";
import { parse, Parser, ParseStepResult } from "papaparse";
import { vec3 } from "gl-matrix";
import type { IVector3 } from "../../../Types";
import {
	Group,
	Node as SceneNode,
} from "../../../Scene/Nodes";


///////////////////////////////////////////////////////////////////////////////
/**
 * Class for Text STL file reader.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class TextReader extends BaseClass
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
		return "IO.Readers.STL.TextReader";
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
			// Get the size of the file.
			const { size } = file;

			// Initialize.
			let rowCount = 0;
			let byteCount = 0;

			// This will get or make a progress callback function.
			const onProgress = this.getProgressCallback();

			// Shortcuts used below.
			let px = 0; let py = 0; let pz = 0;
			const normal: IVector3 = [ 0, 0, 0 ];

			// Allocate the arrays. We make new ones if they get full, and we trim
			// them when we are done if they are not full.
			let { points, normals, indices } = BaseClass.allocateArrays ( 1024 * 1024 );

			// Keep count.
			let indexCount = 0;
			let pointCount = 0;
			let normalCount = 0;

			// These are used below.
			let solidCount = 0;
			let facetCount = 0;
			let loopCount = 0;

			// The group node we return.
			const scene = new Group();

			// This function gets called for every line.
			const innerStep = ( results: ParseStepResult < string[] > ) =>
			{
				++rowCount;

				if ( !results )
				{
					throw new Error ( `Row ${rowCount} has no data` );
				}

				if ( results.errors.length > 0 )
				{
					throw new Error ( `Error when parsing row ${rowCount}: ${results.errors[0].message}` );
				}

				const { data: lines } = results;

				if ( false === Array.isArray ( lines ) )
				{
					throw new Error ( `Row ${rowCount} is not an array` );
				}

				let line = lines[0];

				if ( "string" === ( typeof line ) )
				{
					byteCount += line.length; // Do this before we trim.
					line = line.trimStart();
				}

				else // Not a string.
				{
					throw new Error ( `Row ${rowCount} array does not contain one string` );
				}

				onProgress ( byteCount, size );

				if ( line.length <= 0 )
				{
					return; // This is not an error, just skip it.
				}

				// Split the line at any space character.
				const parts = line.trim().split ( /\s+/ );

				// Handle no parts.
				if ( parts.length <= 0 )
				{
					return; // TODO: Should this be an error?
				}

				switch ( parts[0].toLowerCase() )
				{
					case "solid":
					{
						++solidCount;

						if ( 1 !== solidCount )
						{
							throw new Error ( `Keyword 'solid' on line ${rowCount} not balanced with 'endsolid'` );
						}

						break;
					}
					case "facet":
					{
						if ( ( 5 !== parts.length ) || ( "normal" !== parts[1].toLowerCase() ) )
						{
							throw new Error ( `Invalid facet on line ${rowCount}: ${line}` );
						}

						++facetCount;

						if ( 1 !== facetCount )
						{
							throw new Error ( `Keyword 'facet' on line ${rowCount} not balanced with 'endfacet'` );
						}

						// Read the normal for the whole triangle.
						normal[0] = parseFloat ( parts[2] );
						normal[1] = parseFloat ( parts[3] );
						normal[2] = parseFloat ( parts[4] );

						break;
					}
					case "outer":
					{
						if ( "loop" !== parts[1].toLowerCase() )
						{
							throw new Error ( `Keyword 'outer' on line ${rowCount} not followed by 'loop'` );
						}

						++loopCount;

						if ( 1 !== loopCount )
						{
							throw new Error ( `Keyword 'outer' on line ${rowCount} not balanced with 'endloop'` );
						}

						break;
					}
					case "vertex":
					{
						if ( 4 !== parts.length )
						{
							throw new Error ( `Invalid vertex on line ${rowCount}: ${line}` );
						}

						if ( 1 !== solidCount )
						{
							throw new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'solid'` );
						}

						if ( 1 !== facetCount )
						{
							throw new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'facet'` );
						}

						if ( 1 !== loopCount )
						{
							throw new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'loop'` );
						}

						// Read the point into a local variable for easier debugging.
						px = parseFloat ( parts[1] );
						py = parseFloat ( parts[2] );
						pz = parseFloat ( parts[3] );

						// Save the point.
						points[pointCount++] = px;
						points[pointCount++] = py;
						points[pointCount++] = pz;

						// Add trivial indices.
						indices[indexCount] = indexCount++;

						break;
					}
					case "endloop":
					{
						--loopCount;

						if ( 0 !== loopCount )
						{
							throw new Error ( `Keyword 'endloop' on line ${rowCount} not balanced with 'outer'` );
						}

						// Is the normal vector zero length?
						if ( ( 0 === normal[0] ) && ( 0 === normal[1] ) && ( 0 === normal[2] ) )
						{
							this.setNormalFromCrossProduct ( normal, points, pointCount );
						}

						// Make sure it is a unit vector.
						vec3.normalize ( normal, normal );

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

						break;
					}
					case "endfacet":
					{
						--facetCount;

						if ( 0 !== facetCount )
						{
							throw new Error ( `Keyword 'endfacet' on line ${rowCount} not balanced with 'facet'` );
						}

						// Did we overflow the array?
						if ( indexCount > indices.length )
						{
							throw new Error ( `Index count ${indexCount} exceeds array length ${indices.length}` );
						}

						// Are the arrays full?
						if ( indexCount === indices.length )
						{
							scene.addChild ( this.buildScene (
								points, normals, indices,
								pointCount, normalCount, indexCount
							) );

							const newArrays = BaseClass.allocateArrays ( 1024 * 1024 );
							points = newArrays.points;
							normals = newArrays.normals;
							indices = newArrays.indices;
							pointCount = normalCount = indexCount = 0;
						}

						break;
					}
					case "endsolid":
					{
						--solidCount;

						if ( 0 !== solidCount )
						{
							throw new Error ( `Keyword 'endsolid' on line ${rowCount} not balanced with 'solid'` );
						}

						break;
					}
				}
			};

			// Wrap the step function to catch all errors.
			const step = ( results: ParseStepResult < string[] >, parser: Parser ) =>
			{
				try
				{
					innerStep ( results );
				}
				catch ( error )
				{
					parser.abort();
					reject ( ( error instanceof Error )
						? error
						: ( new Error ( String ( error ) ) )
					);
				}
			};

			// This gets called when the parsing is done.
			const complete = () =>
			{
				// Build the final scene, which may be the only one for smaller files.
				scene.addChild ( this.buildScene (
					points, normals, indices,
					pointCount, normalCount, indexCount
				) );

				// Send the final progress notification.
				onProgress ( size, size );

				// We succeeded.
				resolve ( scene );
			};

			// We do not want the lines to be split so using a delimeter
			// that should not be in an STL file.
			const delimiter = ";";

			// Parse the file.
			parse ( file, {
				chunkSize: ( 1024 * 1024 ), // 1 MB.
				delimiter,
				fastMode: true,
				skipEmptyLines: true,
				step,
				complete,
				// TODO: Figure out how to move a progress bar when using a worker.
				worker: false,
			} );
		} );
	}
}
