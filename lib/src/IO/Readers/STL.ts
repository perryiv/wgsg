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

import { buildTriangleEdges } from "../../Builders/Lines"
import { clampNumber } from "../../Tools";
import { Indexed } from "../../Scene/Primitives";
import { parse, ParseStepResult } from "papaparse";
import { SolidColor } from "../../Shaders";
import { State } from "../../Scene/State";
import type { IVector4 } from "../../Types";
import {
	Geometry,
	Group,
	Node as SceneNode
} from "../../Scene/Nodes";
import {
	addReader,
	Reader as BaseClass,
	ReaderFactory as Factory
} from "../Reader";


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
	 * Return a function that can be used to throttle reporting progress.
	 * @returns {Function} A function that can be used to throttle reporting progress.
	 */
	protected makeProgressCallback()
	{
		const progress = this.progress;

		if ( !progress )
		{
			return () : boolean =>
			{
				return true;
			};
		}

		let start = Date.now();

		return ( value: number, total: number, checkTime: boolean ) : boolean =>
		{
			if ( false === checkTime )
			{
				return progress ( value, total );
			}

			const now = Date.now();

			if ( ( now - start ) < 1000 )
			{
				return true;
			}

			start = now;
			return progress ( value, total );
		};
	}

	/**
	 * Read the file and return a promise that resolves to the scene node.
	 * @param {File} file The file to read.
	 * @returns {Promise<SceneNode>} A promise that resolves to the scene node.
	 */
	public override read ( file: File ) : Promise < SceneNode >
	{
		// Allocate the arrays. We make new ones if they get full, and we trim
		// them when we are done if they are not full.
		const allocateArrays = () =>
		{
			const indices = new Uint32Array ( 1024 * 1024 * 3 );
			const points = new Float32Array ( indices.length * 3 );
			const normals = new Float32Array ( points.length );
			return { points, normals, indices };
		};

		return new Promise ( ( resolve, reject ) =>
		{
			// Get the size of the file.
			const { size } = file;

			// Initialize.
			let rowCount = 0;
			let byteCount = 0;
			let done = false;
			const onProgress = this.makeProgressCallback();

			// Shortcuts used below.
			let px = 0; let py = 0; let pz = 0;
			let nx = 0; let ny = 0; let nz = 0;

			// Allocate the arrays. We make new ones if they get full, and we trim
			// them when we are done if they are not full.
			let { points, normals, indices } = allocateArrays();

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

			// This function get called for every line.
			const step = ( results: ParseStepResult < string[] > ) =>
			{
				// Did we already finish?
				if ( true === done )
				{
					return; // Is there a second solid in the file?
				}

				++rowCount;

				if ( !results )
				{
					done = true;
					reject ( new Error ( `Row ${rowCount} has no data` ) );
				}

				if ( results.errors.length > 0 )
				{
					done = true;
					reject ( new Error ( `Error when parsing row ${rowCount}: ${results.errors[0].message}` ) );
				}

				const { data: lines } = results;

				if ( false === Array.isArray ( lines ) )
				{
					done = true;
					reject ( new Error ( `Row ${rowCount} is not an array` ) );
				}

				let line = lines[0];

				if ( "string" === ( typeof line ) )
				{
					byteCount += line.length; // Do this before we trim.
					line = line.trimStart();
				}

				else // Not a string.
				{
					done = true;
					reject ( new Error ( `Row ${rowCount} array does not contain one string` ) );
				}

				onProgress ( byteCount, size, true );

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
							done = true;
							reject ( new Error ( `Keyword 'solid' on line ${rowCount} not balanced with 'endsolid'` ) );
						}

						break;
					}
					case "facet":
					{
						if ( ( 5 !== parts.length ) || ( "normal" !== parts[1].toLowerCase() ) )
						{
							done = true;
							reject ( new Error ( `Invalid facet on line ${rowCount}: ${line}` ) );
						}

						++facetCount;

						if ( 1 !== facetCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'facet' on line ${rowCount} not balanced with 'endfacet'` ) );
						}

						// Read the normal for the whole triangle.
						nx = parseFloat ( parts[2] );
						ny = parseFloat ( parts[3] );
						nz = parseFloat ( parts[4] );

						// We need a normal for each point.
						normals[normalCount++] = nx;
						normals[normalCount++] = ny;
						normals[normalCount++] = nz;

						normals[normalCount++] = nx;
						normals[normalCount++] = ny;
						normals[normalCount++] = nz;

						normals[normalCount++] = nx;
						normals[normalCount++] = ny;
						normals[normalCount++] = nz;

						break;
					}
					case "outer":
					{
						if ( "loop" !== parts[1].toLowerCase() )
						{
							done = true;
							reject ( new Error ( `Keyword 'outer' on line ${rowCount} not followed by 'loop'` ) );
						}

						++loopCount;

						if ( 1 !== loopCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'outer' on line ${rowCount} not balanced with 'endloop'` ) );
						}

						break;
					}
					case "vertex":
					{
						if ( 4 !== parts.length )
						{
							done = true;
							reject ( new Error ( `Invalid vertex on line ${rowCount}: ${line}` ) );
						}

						if ( 1 !== solidCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'solid'` ) );
						}

						if ( 1 !== facetCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'facet'` ) );
						}

						if ( 1 !== loopCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'vertex' on line ${rowCount} not inside a 'loop'` ) );
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
							done = true;
							reject ( new Error ( `Keyword 'endloop' on line ${rowCount} not balanced with 'outer'` ) );
						}

						break;
					}
					case "endfacet":
					{
						--facetCount;

						if ( 0 !== facetCount )
						{
							done = true;
							reject ( new Error ( `Keyword 'endfacet' on line ${rowCount} not balanced with 'facet'` ) );
						}

						// Did we overflow the array?
						if ( indexCount > indices.length )
						{
							done = true;
							reject ( new Error ( `Index count ${indexCount} exceeds array length ${indices.length}` ) );
						}

						// Are the arrays full?
						if ( indexCount === indices.length )
						{
							scene.addChild ( this.buildScene (
								points, normals, indices,
								pointCount, normalCount, indexCount
							) );

							const newArrays = allocateArrays();
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
							done = true;
							reject ( new Error ( `Keyword 'endsolid' on line ${rowCount} not balanced with 'solid'` ) );
						}

						// Build the final scene, which may be the only one for smaller files.
						scene.addChild ( this.buildScene (
							points, normals, indices,
							pointCount, normalCount, indexCount
						) );

						done = true;
						onProgress ( size, size, false );
						resolve ( scene );
					}

				}
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
				worker: true, // Use a web-worker.
			} );
		} );
	}

	/**
	 * Build the scene from the arrays.
	 * @param {Float32Array} points The array of point coordinates.
	 * @param {Float32Array} normals The array of normal coordinates.
	 * @param {Uint32Array} indices The array of indices.
	 * @param {number} pointCount The number of points in the points array.
	 * @param {number} normalCount The number of normals in the normals array.
	 * @param {number} indexCount The number of indices in the indices array.
	 * @returns {SceneNode} The scene node representing the STL file.
	 */
	protected buildScene ( points: Float32Array, normals: Float32Array, indices: Uint32Array, pointCount: number, normalCount: number, indexCount: number ) : SceneNode
	{
		// Make sure we alloacted enough space for the points.
		if ( pointCount > points.length )
		{
			throw new Error ( `Too many point coordinates, ${pointCount}, for allocated array of length ${points.length}` );
		}

		// Make sure we alloacted enough space for the normals.
		if ( normalCount > normals.length )
		{
			throw new Error ( `Too many normal coordinates, ${normalCount}, for allocated array of length ${normals.length}` );
		}

		// Make sure we alloacted enough space for the indices.
		if ( indexCount > indices.length )
		{
			throw new Error ( `Too many indices, ${indexCount}, for allocated array of length ${indices.length}` );
		}

		// Trim the arrays to the actual number of points, normals, and indices.
		points  = points.slice  ( 0, pointCount  );
		normals = normals.slice ( 0, normalCount );
		indices = indices.slice ( 0, indexCount  );

		// The number of points should be evenly divisible by 9.
		if ( 0 !== ( points.length % 9 ) )
		{
			throw new Error ( `Number of point coordinates, ${points.length}, is not evenly divisible by 9` );
		}

		// The number of normals should equal the number of points.
		if ( points.length !== normals.length )
		{
			throw new Error ( `Number of normals, ${normals.length}, is not equal to the number of points, ${points.length}` );
		}

		// Shortcut.
		const shader = SolidColor.instance;

		// The group that we return.
		const group = new Group()

		// The geometry for the triangles.
		const tris = new Geometry ( { points, normals } );

		// Add the triangles.
		{
			// Make the primitives.
			const topology = "triangle-list";
			tris.primitives = new Indexed ( { topology, indices } );

			// The color of the triangles.
			const color: IVector4 = [
				clampNumber ( Math.random(), 0.1, 0.9 ),
				clampNumber ( Math.random(), 0.1, 0.9 ),
				clampNumber ( Math.random(), 0.1, 0.9 ),
				1.0
			];

			// Add the state.
			tris.state = new State ( {
				name: `State with ${color.join(", ")} ${topology}`,
				shader,
				topology,
				apply: ( () =>
				{
					shader.color = color;
				} )
			} );

			// Add the triangles to the scene.
			group.addChild ( tris );
		}

		// Make the lines.
		{
			// Make the lines for the triangle edges.
			const edges = buildTriangleEdges ( tris );

			// If it worked then add state.
			if ( edges )
			{
				const topology = "line-list";
				const color: IVector4 = [ 0.0, 0.0, 0.0, 1.0 ];
				edges.state = new State ( {
					name: `State with ${color.join(", ")} ${topology}`,
					shader,
					topology,
					apply: ( () =>
					{
						shader.color = color;
					} )
				} );
			}

			// Add the edges to the scene.
			group.addChild ( edges );
		}

		// Return the group.
		return group;
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
