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
import { Group, SphereNode } from "../../../lib/src/Scene/Nodes";


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
			const expected = {
				id: 1,
				type: "Scene.Nodes.Groups.Group",
				state: null,
				flags: 31,
				bounds: {
					center: [ 0, 0, 0	],
					radius: 1
				},
				children: [ {
					id: 1,
					type: "Scene.Nodes.Shapes.Sphere",
					state: null,
					flags: 27,
					bounds: {
						center: [ 0, 0, 0 ],
						radius: 1
					},
					box: {
						min: [ -1, -1, -1 ],
						max: [ 1, 1, 1 ]
					},
					center: [ 0, 0, 0 ],
					radius: 1,
					numSubdivisions: 2
				} ]
			};

			const scene = new Group();
			scene.addChild ( new SphereNode() );

			let json: ( string | object ) = JSON.stringify ( scene, null, 2 );
			expect ( json ).to.be.a ( "string" );

			// console.log ( "json:", json );

			json = JSON.parse ( json ) as object;
			expect ( json ).to.be.deep.equal ( expected );
		} );
	} );
};
