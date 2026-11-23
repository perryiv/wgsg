///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Functions for showing the triangle edges.
//
///////////////////////////////////////////////////////////////////////////////

import { FlatEdges } from "./FlatEdges";
import { FlatShading } from "./FlatShading";
import { PhongEdges } from "./PhongEdges";
import { PhongShading } from "./PhongShading";
import type { Node } from "../Scene";
import type { ShaderBase } from "./ShaderBase";


///////////////////////////////////////////////////////////////////////////////
/**
 * Return the shader to use for showing or hiding the triangle edges.
 * @param {ShaderBase} shader - The shader in use now.
 * @param {boolean} show - True to show the edges, false to hide them.
 * @returns {ShaderBase | null} The shader to use, or null if it does not change.
 */
///////////////////////////////////////////////////////////////////////////////

export const getTriangleEdgesShader = ( shader: ShaderBase, show: boolean ) : ( ShaderBase | null ) =>
{
	if ( show )
	{
		if ( shader === FlatShading.instance )
		{
			return FlatEdges.instance;
		}
		if ( shader === PhongShading.instance )
		{
			return PhongEdges.instance;
		}
	}
	else
	{
		if ( shader === FlatEdges.instance )
		{
			return FlatShading.instance;
		}
		if ( shader === PhongEdges.instance )
		{
			return PhongShading.instance;
		}
	}
	return null;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Show or hide the triangle edges in the scene, by changing the shaders of
 * its states to ones that draw the edges, or back again. Only flat and
 * Phong shading have versions that draw the edges.
 * @param {Node} scene - The scene.
 * @param {boolean} show - True to show the edges, false to hide them.
 * @returns {number} The number of states that changed.
 */
///////////////////////////////////////////////////////////////////////////////

export const showTriangleEdges = ( scene: Node, show: boolean ) : number =>
{
	let count = 0;
	scene.traverse ( ( node: Node ) =>
	{
		const { state } = node;
		const shader = state?.shader;
		if ( state && shader )
		{
			const next = getTriangleEdgesShader ( shader, show );
			if ( next )
			{
				state.shader = next;
				++count;
			}
		}
	} );
	return count;
}
