///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the viewer.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	buildTriangleEdges,
	ColorAttribute,
	ColorTool,
	Group,
	PhongShading,
	SolidColor,
	Sphere,
	SphereNode,
	Transform,
	TwoSidedLight,
} from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

const buildSceneSphere = ( sphere: Sphere, edges: boolean ) =>
{
	const node = new SphereNode ( {
		center: sphere.center,
		radius: sphere.radius,
		numSubdivisions: 4,
	} );
	{
		const state = PhongShading.makeState ( { topology: "triangle-list" } );
		state.addAttribute ( new ColorAttribute ( [ 0.8, 0.2, 0.2, 1.0 ] ) );
		state.addAttribute ( new TwoSidedLight ( false ) );
		node.state = state;
	}

	if ( false === edges )
	{
		return node;
	}

	const root = new Group();
	root.addChild ( node );

	const lines = buildTriangleEdges ( node );
	if ( lines )
	{
		const state = SolidColor.makeState ( { topology: "line-list" } );
		state.addAttribute ( new ColorAttribute ( [ ...ColorTool.black ] ) );
		lines.state = state;
	}
	root.addChild ( lines );

	return root;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing.
//
///////////////////////////////////////////////////////////////////////////////

const buildSceneSpheres = () =>
{
	const root = new Group();
	const radius = 1.0;

	{
		const tr = new Transform();
		tr.translate ( [ 10, 0, 0 ] );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 0, 0, 0 ], radius ), false ) );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 3, 0, 0 ], radius ), false ) );
		root.addChild ( tr );
	}

	{
		const tr = new Transform();
		tr.translate ( [ 10, 3, 0 ] );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 0, 0, 0 ], radius ), false ) );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 3, 0, 0 ], radius ), false ) );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 6, 0, 0 ], radius ), false ) );
		tr.addChild ( buildSceneSphere ( new Sphere ( [ 9, 0, 0 ], radius ), false ) );
		root.addChild ( tr );
	}

	return root;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "JSON", function ()
	{
		it ( "Should be able to write a meaningful JSON file", function ()
		{
			const scene = buildSceneSphere ( new Sphere ( [ 0, 0, 0 ], 1 ), true );
			let json: ( string | object ) = JSON.stringify ( scene );
			expect ( json ).to.be.a ( "string" );
			json = JSON.parse ( json ) as object;
			console.log ( "json:", json );
			expect ( json ).to.be.deep.equal ( {} );
		} );
	} );
};
