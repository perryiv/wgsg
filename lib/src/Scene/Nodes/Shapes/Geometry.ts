
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

import { Visitor } from "../../../Visitors";
import { State } from "../../State";
import { Shape } from "./Shape";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type VertexArray    = Float32Array;
export type NormalArray    = Float32Array;
export type ColorArray     = Float32Array;
export type TexCoordsArray = Float32Array;


///////////////////////////////////////////////////////////////////////////////
/**
 * General class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Geometry extends Shape
{
	#vertices:  ( VertexArray    | null ) = null;
	#normals:   ( NormalArray    | null ) = null;
	#colors:    ( ColorArray     | null ) = null;
	#texCoords: ( TexCoordsArray | null ) = null;

	/**
	 * Construct the class.
	 * @constructor
	 * @param {State | null} state - State for this geometry.
	 */
	constructor ( state?: ( State | null ) )
	{
		super ( state );
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Scene.Nodes.Shapes.Geometry";
	}

	/**
	 * Accept the visitor.
	 * @param {Visitor} visitor - The visitor object.
	 */
	public accept ( visitor: Visitor ): void
	{
		visitor.visitGeometry ( this );
	}

	/**
	 * Get the vertices.
	 * @return {VertexArray | null} Vertices for this geometry.
	 */
	public get vertices() : ( VertexArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#vertices;
	}

	/**
	 * Set the vertices.
	 * @param {VertexArray | null} vertices - Vertices for this geometry.
	 */
	public set vertices ( vertices: ( VertexArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#vertices = vertices;
	}

	/**
	 * Get the normal vectors.
	 * @return {NormalArray | null} Normal vectors for this geometry.
	 */
	public get normals() : ( NormalArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#normals;
	}

	/**
	 * Set the normals.
	 * @param {NormalArray | null} vertices - Normal vectors for this geometry.
	 */
	public set normals ( normals: ( NormalArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#normals = normals;
	}

	/**
	 * Get the colors.
	 * @return {ColorArray | null} Colors for this geometry.
	 */
	public get colors() : ( ColorArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#colors;
	}

	/**
	 * Set the colors.
	 * @param {ColorArray | null} colors - Colors for this geometry.
	 */
	public set colors ( colors: ( ColorArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#colors = colors;
	}

	/**
	 * Get the texture coordinates.
	 * @return {TexCoordsArray | null} Texture coordinates for this geometry.
	 */
	public get texCoords() : ( TexCoordsArray | null )
	{
		// Do not return a copy. These arrays can be shared.
		return this.#texCoords;
	}

	/**
	 * Set the texture coordinates.
	 * @param {TexCoordsArray | null} texCoords - Texture coordinates for this geometry.
	 */
	public set texCoords ( texCoords: ( TexCoordsArray | null ) )
	{
		// Do not make a copy. These arrays can be shared.
		this.#texCoords = texCoords;
	}

	/**
	 * Draw the shape.
	 */
	public draw() : void
	{
		console.log ( `Drawing ${this.type} ${this.id}` );
	}
}
