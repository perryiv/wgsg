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

import { Cancelled } from "../../Cancelled";
import { Common as BaseClass, STL_MAX_TRIANGLES_PER_GEOMETRY } from "./Common";
import { Group, Node as SceneNode } from "../../../Scene/Nodes";
import { readLines } from "../../Functions";

// The fewest bytes one facet can take, when written like this:
// "facet normal 0 0 0\n" + "outer loop\n" + 3 * "vertex 0 0 0\n" +
// "endloop\n" + "endfacet\n". Dividing the file size by this gives the
// most triangles the file can have.
const STL_TEXT_MIN_FACET_BYTES = 86;


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
	public override async read ( file: File ) : Promise < SceneNode >
	{
		// Get the size of the file.
		const { size } = file;

		// This will get or make a progress callback function.
		const onProgress = this.getProgressCallback();

		// Shortcuts used below.
		let px = 0; let py = 0; let pz = 0;

		// Allocate the array for the most triangles the file can have, up to
		// the most that one geometry can hold. We make a new one if it gets
		// full, and we trim it when we are done if it is not full.
		let points = BaseClass.allocatePoints (
			Math.ceil ( size / STL_TEXT_MIN_FACET_BYTES )
		);

		// Keep count.
		let pointCount = 0;

		// These are used below.
		let solidCount = 0;
		let facetCount = 0;
		let loopCount = 0;
		let foundSolid = false;

		// The group node we return.
		const scene = new Group();

		// This function gets called for every line.
		const onLine = ( text: string, lineNumber: number ) =>
		{
			// Remove the white space from both ends.
			const line = text.trim();

			// Skip empty lines.
			if ( line.length <= 0 )
			{
				return;
			}

			// Split the line at any space character.
			const parts = line.split ( /\s+/ );

			switch ( parts[0].toLowerCase() )
			{
				case "solid":
				{
					++solidCount;
					foundSolid = true;

					if ( 1 !== solidCount )
					{
						throw new Error ( `Keyword 'solid' on line ${lineNumber} not balanced with 'endsolid'` );
					}

					break;
				}
				case "facet":
				{
					if ( ( 5 !== parts.length ) || ( "normal" !== parts[1].toLowerCase() ) )
					{
						throw new Error ( `Invalid facet on line ${lineNumber}: ${line}` );
					}

					++facetCount;

					if ( 1 !== facetCount )
					{
						throw new Error ( `Keyword 'facet' on line ${lineNumber} not balanced with 'endfacet'` );
					}

					// The normal is not used. Flat shading calculates it in the shader.

					break;
				}
				case "outer":
				{
					if ( ( parts.length < 2 ) || ( "loop" !== parts[1].toLowerCase() ) )
					{
						throw new Error ( `Keyword 'outer' on line ${lineNumber} not followed by 'loop'` );
					}

					++loopCount;

					if ( 1 !== loopCount )
					{
						throw new Error ( `Keyword 'outer' on line ${lineNumber} not balanced with 'endloop'` );
					}

					break;
				}
				case "vertex":
				{
					if ( 4 !== parts.length )
					{
						throw new Error ( `Invalid vertex on line ${lineNumber}: ${line}` );
					}

					if ( 1 !== solidCount )
					{
						throw new Error ( `Keyword 'vertex' on line ${lineNumber} not inside a 'solid'` );
					}

					if ( 1 !== facetCount )
					{
						throw new Error ( `Keyword 'vertex' on line ${lineNumber} not inside a 'facet'` );
					}

					if ( 1 !== loopCount )
					{
						throw new Error ( `Keyword 'vertex' on line ${lineNumber} not inside a 'loop'` );
					}

					// Read the point into a local variable for easier debugging.
					px = parseFloat ( parts[1] );
					py = parseFloat ( parts[2] );
					pz = parseFloat ( parts[3] );

					// Save the point.
					points[pointCount++] = px;
					points[pointCount++] = py;
					points[pointCount++] = pz;

					break;
				}
				case "endloop":
				{
					--loopCount;

					if ( 0 !== loopCount )
					{
						throw new Error ( `Keyword 'endloop' on line ${lineNumber} not balanced with 'outer'` );
					}

					break;
				}
				case "endfacet":
				{
					--facetCount;

					if ( 0 !== facetCount )
					{
						throw new Error ( `Keyword 'endfacet' on line ${lineNumber} not balanced with 'facet'` );
					}

					// Did we overflow the array?
					if ( pointCount > points.length )
					{
						throw new Error ( `Point count ${pointCount} exceeds array length ${points.length}` );
					}

					// Is the array full?
					if ( pointCount === points.length )
					{
						scene.addChild ( this.buildScene ( points, pointCount ) );
						points = BaseClass.allocatePoints ( STL_MAX_TRIANGLES_PER_GEOMETRY );
						pointCount = 0;
					}

					break;
				}
				case "endsolid":
				{
					--solidCount;

					if ( 0 !== solidCount )
					{
						throw new Error ( `Keyword 'endsolid' on line ${lineNumber} not balanced with 'solid'` );
					}

					break;
				}
			}
		};

		// Read all the lines. This throws if there is an error or if the
		// progress callback cancels the reading.
		await readLines ( file, onLine, onProgress );

		// If there was no 'solid' then this is not a text STL file.
		if ( false === foundSolid )
		{
			throw new Error ( "Text STL file has no 'solid' keyword" );
		}

		// Build the final scene, which may be the only one for smaller files.
		scene.addChild ( this.buildScene ( points, pointCount ) );

		// Send the final progress notification.
		if ( false === onProgress ( size, size ) )
		{
			throw new Cancelled ( "File reading was cancelled by the progress callback" );
		}

		// We succeeded.
		return scene;
	}
}
