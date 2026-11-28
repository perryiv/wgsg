///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Approximate a glTF material's metallic and roughness with the specular
//	color and shininess of the Material attribute, which is lit the way
//	OpenGL does (Blinn-Phong), so that shiny surfaces get highlights.
//
//	- Shininess: the Blinn-Phong exponent like glTF's microfacet roughness,
//	  whose width is roughness squared: 2 / roughness^4 - 2, at most 128.
//	- Specular color: what a surface reflects head on, which is 0.04 for
//	  non-metals and the base color for metals, blended by the metallic.
//	  It's made brighter by ( shininess + 8 ) / 8, as normalized Blinn-Phong
//	  does, so that a small highlight is about as bright overall as a wide
//	  one, the way the microfacet math concentrates the light. If that makes
//	  a channel more than 1, the color is scaled down, which keeps its hue.
//	- A surface too rough for a highlight (shininess below 1) has none.
//
//	The diffuse color is not changed: a metal keeps its base color as its
//	diffuse color. Metals have none in glTF, because they reflect their
//	surroundings instead, but there are no surroundings to reflect here, so
//	they would look black.
//
///////////////////////////////////////////////////////////////////////////////

import type { IVector4 } from "../../../Types";
import { MAX_SHININESS } from "../../../Tools/Constants";


///////////////////////////////////////////////////////////////////////////////
//
//	Constants.
//
///////////////////////////////////////////////////////////////////////////////

// What non-metals reflect head on, as glTF says.
export const DIELECTRIC_SPECULAR = 0.04;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the specular color and shininess like the metallic and roughness.
 * @param {IVector4} baseColor - The base color.
 * @param {number} metallic - How metallic, from 0 to 1.
 * @param {number} roughness - How rough, from 0 to 1.
 * @returns {object} The specular color and the shininess.
 */
///////////////////////////////////////////////////////////////////////////////

export const getSpecular = ( baseColor: Readonly<IVector4>, metallic: number, roughness: number ) : { specular: IVector4, shininess: number } =>
{
	// The exponent. A roughness of zero would be infinite.
	const r4 = Math.pow ( roughness, 4 );
	const exponent = ( ( r4 > 0 ) ? ( ( 2 / r4 ) - 2 ) : MAX_SHININESS );
	const shininess = Math.min ( exponent, MAX_SHININESS );

	// Too rough for a highlight.
	if ( shininess < 1 )
	{
		return { specular: [ 0, 0, 0, 1 ], shininess: 0 };
	}

	// What it reflects head on, made brighter for small highlights.
	const scale = ( shininess + 8 ) / 8;
	const rgb = [ 0, 1, 2 ].map ( ( i ) =>
		( ( DIELECTRIC_SPECULAR + ( ( baseColor[i] - DIELECTRIC_SPECULAR ) * metallic ) ) * scale ) );

	// Keep it in range without changing its hue.
	const largest = Math.max ( ...rgb );
	const fit = ( ( largest > 1 ) ? ( 1 / largest ) : 1 );
	return { specular: [ rgb[0] * fit, rgb[1] * fit, rgb[2] * fit, 1 ], shininess };
};
