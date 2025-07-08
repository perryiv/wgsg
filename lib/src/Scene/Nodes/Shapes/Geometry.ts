
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	General geometry class.
//
///////////////////////////////////////////////////////////////////////////////

import { Box } from "../../../Math";
import { Shape } from "./Shape";
import { State } from "../../State";
import { Visitor } from "../../../Visitors";
import { Node } from "../Node";
import { Array3 } from "../../../Arrays";
import { Primitives } from "../../Primitives";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IVertexData
{
	data: ( Float32Array | null );
	buffer: ( GPUBuffer | null );
}
export type IPointData    = IVertexData;
export type INormalData   = IVertexData;
export type IColorData    = IVertexData;
export type ITexCoordData = IVertexData;


///////////////////////////////////////////////////////////////////////////////
/**
 * Geometry class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Geometry extends Shape
{
	#points:     IPointData    = { data: null, buffer: null };
	#normals:    INormalData   = { data: null, buffer: null };
	#colors:     IColorData    = { data: null, buffer: null };
	#texCoords:  ITexCoordData = { data: null, buffer: null };
	#primitives: ( Primitives[]  | null ) = null;
	#bounds: Box = new Box();

	/**
	 * Construct the class.
	 * @class
	 * @param {State | null} state - Optional state for this geometry.
	 */
	constructor ( state?: ( State | null ) )
	{
		super ( state );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.Nodes.Shapes.Geometry";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public override accept ( visitor: Visitor ): void
	{
		visitor.visitGeometry ( this );
	}

	/**
	 * Get the bounds of this node.
	 * @returns {Box} The bounds of this node.
	 */
	protected override getBounds() : Box
	{
		// Return the bounding box if it is valid.
		if ( true === this.#bounds.valid )
		{
			return this.#bounds;
		}

		// Make a new bounds.
		const answer = new Box();

		// Are there any points?
		if ( this.#points?.data )
		{
			// Make the helper array wrapper.
			const points = new Array3 ( this.#points.data );

			// Shortcuts.
			// TODO: Why is the "as" needed here?
			const x = ( points.x0 as Float32Array );
			const y = ( points.x1 as Float32Array );
			const z = ( points.x2 as Float32Array );
			const numVectors = points.numVectors;

			// Grow the box by all the points.
			answer.growByPoints ( numVectors, x, y, z );
		}

		// Save the answer for next time.
		this.#bounds = answer;

		// Return the answer.
		return answer;
	}

	/**
	 * Set the bounds of this node.
	 * @param {Box | null} bounds - The new bounds of this node.
	 */
	protected override setBounds ( bounds: Box | null ): void
	{
		// If we were given a box then clone it.
		// Otherwise, make a new default box.
		// Note: We can clone an invalid box, but not a null box.
		this.#bounds = ( bounds ? bounds.clone() : new Box() );

		// Let the parents know that their bounds are now invalid.
		this.forEachParent ( ( parent: Node ) =>
		{
			parent.bounds = null;
		} );
	}

	/**
	 * Get the points.
	 * @returns {Float32Array | null} Points for this geometry.
	 */
	public get points() : Float32Array | null
	{
		// Do not return a copy. These arrays can be shared.
		return this.#points.data;
	}

	/**
	 * Set the points.
	 * @param {Float32Array | null} points - Points for this geometry.
	 */
	public set points ( points: ( Float32Array | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		// We also set the buffer to null so that it gets made again.
		this.#points = { data: points, buffer: null };
	}

	/**
	 * Get the normal vectors.
	 * @returns {Float32Array | null} Normal vectors for this geometry.
	 */
	public get normals() : ( Float32Array | null )
	{
		// Do not return a copy. These arrays can be shared.
		return ( this.#normals?.data || null );
	}

	/**
	 * Set the normals.
	 * @param {Float32Array | null} normals - Normal vectors for this geometry.
	 */
	public set normals ( normals: ( Float32Array | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		// We also set the buffer to null so that it gets made again.
		this.#normals = { data: normals, buffer: null };
	}

	/**
	 * Get the colors.
	 * @returns {Float32Array | null} Colors for this geometry.
	 */
	public get colors() : ( Float32Array | null )
	{
		// Do not return a copy. These arrays can be shared.
		return ( this.#colors?.data || null );
	}

	/**
	 * Set the colors.
	 * @param {Float32Array | null} colors - Colors for this geometry.
	 */
	public set colors ( colors: ( Float32Array | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		// We also set the buffer to null so that it gets made again.
		this.#colors = { data: colors, buffer: null };
	}

	/**
	 * Get the texture coordinates.
	 * @returns {Float32Array | null} Texture coordinates for this geometry.
	 */
	public get texCoords() : ( Float32Array | null )
	{
		// Do not return a copy. These arrays can be shared.
		return ( this.#texCoords?.data || null );
	}

	/**
	 * Set the texture coordinates.
	 * @param {Float32Array | null} texCoords - Texture coordinates for this geometry.
	 */
	public set texCoords ( texCoords: ( Float32Array | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		// We also set the buffer to null so that it gets made again.
		this.#texCoords = { data: texCoords, buffer: null };
	}

	/**
	 * Get the primitives.
	 * @returns {Primitives[] | null} The primitives for this geometry.
	 */
	public get primitives() : ( Primitives[] | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#primitives;
	}

	/**
	 * Set the primitives.
	 * @param {Primitives[] | null} primitives - The primitives for this geometry.
	 */
	public set primitives ( primitives: ( Primitives | Primitives[] | null ) )
	{
		// If we were given a single primitive then make it an array.
		if ( primitives instanceof Primitives )
		{
			primitives = [ primitives ];
		}

		// Do not make a copy. These arrays can be shared.
		this.#primitives = primitives;
	}

	/**
	 * Get the number of elements.
	 * @param {Float32Array} array - The array containing the elements.
	 * @param {number} dimension - The dimension of the elements (e.g., 3 for points).
	 * @returns {number} The number of elements.
	 */
	static getNumElements ( array: ( Float32Array | null ), dimension: number ) : number
	{
		// Handle invalid array.
		if ( !array )
		{
			return 0;
		}

		// Handle no elements.
		if ( array.length < 1 )
		{
			return 0;
		}

		// The length should be evenly divisible by the given dimension.
		if ( 0 !== ( array.length % dimension ) )
		{
			throw new Error ( `Array length ${array.length} is not evenly divisible by ${dimension}` );
		}

		// Return the number of elements.
		return ( array.length / dimension );
	}

	/**
	 * Get the number of points.
	 * @returns {number} The number of points in this geometry.
	 */
	public get numPoints() : number
	{
		return Geometry.getNumElements ( this.points, 3 );
	}

	/**
	 * Get the number of normals.
	 * @returns {number} The number of normals in this geometry.
	 */
	public get numNormals() : number
	{
		return Geometry.getNumElements ( this.normals, 3 );
	}

	/**
	 * Get the number of colors.
	 * @returns {number} The number of colors in this geometry.
	 */
	public get numColors() : number
	{
		return Geometry.getNumElements ( this.colors, 4 );
	}

	/**
	 * Get the number of texture coordinates.
	 * @returns {number} The number of texture coordinates in this geometry.
	 */
	public get numTexCoords() : number
	{
		return Geometry.getNumElements ( this.texCoords, 2 );
	}

	/**
	 * Get the number of primitives.
	 * @returns {number} The number of primitives in this geometry.
	 */
	public get numPrimitives() : number
	{
		const primitives = this.primitives;
		return ( primitives ? primitives.length : 0 );
	}

	/**
	 * Get the points buffer.
	 * @param {IVertexData} input - The vertex data containing the data and buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The points buffer for this geometry.
	 */
	static getVertexBuffer ( input: IVertexData, device?: GPUDevice ) : ( GPUBuffer | null )
	{
		// If the buffer already exists then return it.
		if ( input.buffer )
		{
			return input.buffer;
		}

		// If we get to here then try to make the buffer.
		if ( input.data && device )
		{
			// Make the buffer.
			input.buffer = device.createBuffer ( {
				size: input.data.byteLength,
				usage: ( GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST )
			} );

			// Write the data to the buffer.
			device.queue.writeBuffer ( input.buffer, 0, input.data, 0, input.data.length );

			// Return the buffer.
			return input.buffer;
		}

		// If we get to here then there is no buffer.
		return null;
	}

	/**
	 * Get the points buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The points buffer for this geometry.
	 */
	public getPointsBuffer ( device?: GPUDevice ) : ( GPUBuffer | null )
	{
		return Geometry.getVertexBuffer ( this.#points, device );
	}

	/**
	 * Get the normals buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The normals buffer for this geometry.
	 */
	public getNormalsBuffer ( device?: GPUDevice ) : ( GPUBuffer | null )
	{
		return Geometry.getVertexBuffer ( this.#normals, device );
	}

	/**
	 * Get the colors buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The colors buffer for this geometry.
	 */
	public getColorsBuffer ( device?: GPUDevice ) : ( GPUBuffer | null )
	{
		return Geometry.getVertexBuffer ( this.#colors, device );
	}

	/**
	 * Get the texture coordinates buffer.
	 * @param {GPUDevice} [device] - Optional GPU device to create the buffer if it does not exist.
	 * @returns {GPUBuffer | null} The texture coordinates buffer for this geometry.
	 */
	public getTexCoordsBuffer ( device?: GPUDevice ) : ( GPUBuffer | null )
	{
		return Geometry.getVertexBuffer ( this.#texCoords, device );
	}

	/**
	 * Update this node.
	 */
	public override update() : void
	{
		// There is nothing to do here.
	}
}
