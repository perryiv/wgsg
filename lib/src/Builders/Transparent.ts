///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Builder for a semi-transparent scene.
//
///////////////////////////////////////////////////////////////////////////////

import { Color as ColorTool } from "../Math/Color";
import { FlatShading } from "../Shaders/FlatShading";
import { PhongShading } from "../Shaders/PhongShading";
import { TRANSPARENT_BIN } from "../Tools/Constants";
import type { IVector4 } from "../Types";
import {
	ColorAttribute,
	CullFace,
	Depth,
	Geometry,
	Group,
	State,
	TwoSidedLight,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ITransparentSceneInput
{
	geometry: Geometry;
	back?: State;
	front?: State;
	alpha?: number;
}


///////////////////////////////////////////////////////////////////////////////
//
//	The alpha of the states made when the geometry has none.
//
///////////////////////////////////////////////////////////////////////////////

const DEFAULT_ALPHA = 0.5;


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a state like the given one: the same shader, topology, layer, apply
 * and reset functions, and attributes. The attributes are shared, not
 * copied, so changing one, like the color, changes both states. The name is
 * not copied, so it's made from the shader and attributes, and the bin is
 * not copied, because the caller sets it.
 * @param {State} state - The state to copy.
 * @returns {State} The new state.
 */
///////////////////////////////////////////////////////////////////////////////

const copyState = ( state: State ) : State =>
{
	const { shader, topology, layer, apply, reset } = state;
	const answer = new State ( { shader: ( shader ?? undefined ), topology, layer, apply, reset } );
	for ( const [ , attribute ] of state.attributes )
	{
		answer.addAttribute ( attribute );
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make a state for a geometry that has none: Phong shading if it has
 * normals, flat shading if not, with the topology of its first primitives,
 * and gray with the given alpha.
 * @param {Geometry} geometry - The geometry.
 * @param {number} alpha - The alpha of the color.
 * @returns {State} The new state.
 */
///////////////////////////////////////////////////////////////////////////////

const makeState = ( geometry: Geometry, alpha: number ) : State =>
{
	const topology = ( geometry.primitives?.[0]?.topology ?? "triangle-list" );
	const shader = ( geometry.normals ? PhongShading : FlatShading );
	const state = shader.makeState ( { topology } );
	const gray = ColorTool.gray;
	const color: IVector4 = [ gray[0], gray[1], gray[2], alpha ];
	state.addAttribute ( new ColorAttribute ( color ) );
	return state;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Build a scene that draws a closed, semi-transparent geometry correctly
 * from any side: its back faces first, and then its front faces. The scene
 * is a group with two groups, one for the back faces and one for the front
 * faces, and each has the geometry as its only child. The geometry is left
 * without a state, because a shape's own state is used instead of its
 * parents'.
 *
 * The states for the two groups come from, in this order:
 * - The given states. If the geometry has a state, it's removed.
 * - Copies of the geometry's state, which is then removed. Its shader,
 *   topology, layer, apply and reset functions, and attributes (shared, not
 *   copied) are used. Its color is kept as it is, so it should have an alpha
 *   below one.
 * - New states, with Phong shading if the geometry has normals and flat
 *   shading if not, and gray with the given alpha, which is 0.5 by default.
 *   The alpha is only used for these.
 *
 * Then this adds to them what makes them transparent, replacing any
 * attributes of the same types:
 * - Both: no depth writes.
 * - The back faces' state: culls the front faces, lights both sides, and
 *   goes in TRANSPARENT_BIN.
 * - The front faces' state: culls the back faces, and goes in
 *   TRANSPARENT_BIN + 1, so it's drawn after the back faces.
 * @param {object} input The input object.
 * @param {Geometry} input.geometry The geometry.
 * @param {State} [input.back] The state for the back faces.
 * @param {State} [input.front] The state for the front faces.
 * @param {number} [input.alpha] The alpha of the new states' color, from 0
 * to 1. The default is 0.5.
 * @returns {Group} The group holding the scene.
 */
///////////////////////////////////////////////////////////////////////////////

export const buildTransparentScene = ( input: Readonly<ITransparentSceneInput> ) : Group =>
{
	const { geometry } = input;
	const alpha = ( input.alpha ?? DEFAULT_ALPHA );

	// The alpha has to be a fraction.
	if ( !( ( alpha >= 0 ) && ( alpha <= 1 ) ) )
	{
		throw new Error ( `Alpha ${alpha} is not from 0 to 1` );
	}

	// Each side needs its own settings.
	if ( input.back && ( input.back === input.front ) )
	{
		throw new Error ( "The back and front faces need different states" );
	}

	// Get the states, and take the geometry's away.
	const original = geometry.state;
	const make = () : State => ( original ? copyState ( original ) : makeState ( geometry, alpha ) );
	const back = ( input.back ?? make() );
	const front = ( input.front ?? make() );
	geometry.state = null;

	// The back faces, drawn first.
	back.addAttribute ( new CullFace ( "front" ) );
	back.addAttribute ( new TwoSidedLight ( true ) );
	back.addAttribute ( new Depth ( { write: false } ) );
	back.bin = TRANSPARENT_BIN;

	// The front faces, drawn second.
	front.addAttribute ( new CullFace ( "back" ) );
	front.addAttribute ( new Depth ( { write: false } ) );
	front.bin = TRANSPARENT_BIN + 1;

	// A group for each side, with the geometry in both.
	const scene = new Group();
	for ( const state of [ back, front ] )
	{
		const group = new Group();
		group.state = state;
		group.addChild ( geometry );
		scene.addChild ( group );
	}

	// Return the scene.
	return scene;
};
