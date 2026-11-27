///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the face culling attribute, and how it gets to the pipeline.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Bin, makeRenderGraphInfo } from "../../../../lib/src/Render";
import { CullFace, TwoSidedLight } from "../../../../lib/src/Scene/State/Attributes";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { State } from "../../../../lib/src/Scene/State";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "CullFace", function ()
	{
		it ( "Should cull the back faces by default", function ()
		{
			expect ( new CullFace().mode ).to.equal ( "back" );
			expect ( new CullFace ( "front" ).mode ).to.equal ( "front" );

			const cull = new CullFace();
			cull.mode = "none";
			expect ( cull.mode ).to.equal ( "none" );
		} );

		it ( "Should say its mode in its string and JSON", function ()
		{
			const cull = new CullFace ( "front" );
			expect ( cull.toString() ).to.equal ( "Scene.State.Attributes.CullFace front" );
			expect ( cull.toJSON() ).to.include ( { mode: "front" } );
		} );

		it ( "Should not cull without the attribute", function ()
		{
			const state = new State ( { topology: "line-list" } );
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "line-list", cullMode: "none", depthWrite: true } );

			// Attributes that are not part of the pipeline don't change it.
			state.addAttribute ( new TwoSidedLight ( true ) );
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "line-list", cullMode: "none", depthWrite: true } );
		} );

		it ( "Should put the cull mode in the state's pipeline options", function ()
		{
			const state = new State();
			state.addAttribute ( new CullFace() );
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "back", depthWrite: true } );
			expect ( state.name ).to.include ( "CullFace back" );
		} );

		it ( "Should put states with different culling in different pipelines", function ()
		{
			const info = makeRenderGraphInfo();
			const bin = new Bin();
			const make = ( mode: ( GPUCullMode | null ) ) : State =>
			{
				const state = FlatShading.makeState ( { topology: "triangle-list" } );
				if ( mode )
				{
					state.addAttribute ( new CullFace ( mode ) );
				}
				return state;
			};

			const none = bin.getPipeline ( info, make ( null ) );
			const back = bin.getPipeline ( info, make ( "back" ) );
			expect ( back ).not.to.equal ( none );
			expect ( none.options ).to.deep.equal ( { topology: "triangle-list", cullMode: "none", depthWrite: true } );
			expect ( back.options ).to.deep.equal ( { topology: "triangle-list", cullMode: "back", depthWrite: true } );

			// The same options share a pipeline, and "none" is the same as no attribute.
			expect ( bin.getPipeline ( info, make ( "back" ) ) ).to.equal ( back );
			expect ( bin.getPipeline ( info, make ( "none" ) ) ).to.equal ( none );
			expect ( bin.numPipelines ).to.equal ( 2 );
			expect ( info.numPipelines ).to.equal ( 2 );
		} );
	} );
};
