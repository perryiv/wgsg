///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the depth attribute, and how it gets to the pipeline.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Bin, makeRenderGraphInfo } from "../../../../lib/src/Render";
import { CullFace, Depth } from "../../../../lib/src/Scene/State/Attributes";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { makePipelineKey } from "../../../../lib/src/Shaders/ShaderBase";
import { State } from "../../../../lib/src/Scene/State";


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Depth", function ()
	{
		it ( "Should write depth by default", function ()
		{
			expect ( new Depth().write ).to.be.true;
			expect ( new Depth ( {} ).write ).to.be.true;
			expect ( new Depth ( { write: false } ).write ).to.be.false;

			const depth = new Depth();
			depth.write = false;
			expect ( depth.write ).to.be.false;
		} );

		it ( "Should say whether it writes in its string and JSON", function ()
		{
			const depth = new Depth ( { write: false } );
			expect ( depth.toString() ).to.equal ( "Scene.State.Attributes.Depth no-write" );
			expect ( depth.toJSON() ).to.include ( { write: false } );
			expect ( new Depth().toString() ).to.equal ( "Scene.State.Attributes.Depth write" );
		} );

		it ( "Should put depth writing in the state's pipeline options", function ()
		{
			const state = new State();
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "none", depthWrite: true } );

			state.addAttribute ( new Depth ( { write: false } ) );
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "none", depthWrite: false } );
			expect ( state.name ).to.include ( "Depth no-write" );

			// It works with the other pipeline attributes.
			state.addAttribute ( new CullFace() );
			expect ( state.pipelineOptions ).to.deep.equal ( { topology: "triangle-list", cullMode: "back", depthWrite: false } );
		} );

		it ( "Should make a different pipeline key with and without depth writing", function ()
		{
			const write = makePipelineKey ( { topology: "triangle-list", cullMode: "none", depthWrite: true } );
			const noWrite = makePipelineKey ( { topology: "triangle-list", cullMode: "none", depthWrite: false } );
			expect ( write ).not.to.equal ( noWrite );
		} );

		it ( "Should put states with and without depth writing in different pipelines", function ()
		{
			const info = makeRenderGraphInfo();
			const bin = new Bin();
			const make = ( write: ( boolean | null ) ) : State =>
			{
				const state = FlatShading.makeState ( { topology: "triangle-list" } );
				if ( null !== write )
				{
					state.addAttribute ( new Depth ( { write } ) );
				}
				return state;
			};

			const writes = bin.getPipeline ( info, make ( null ) );
			const noWrites = bin.getPipeline ( info, make ( false ) );
			expect ( noWrites ).not.to.equal ( writes );
			expect ( writes.options.depthWrite ).to.be.true;
			expect ( noWrites.options.depthWrite ).to.be.false;

			// The same options share a pipeline, and writing is the same as no attribute.
			expect ( bin.getPipeline ( info, make ( false ) ) ).to.equal ( noWrites );
			expect ( bin.getPipeline ( info, make ( true ) ) ).to.equal ( writes );
			expect ( bin.numPipelines ).to.equal ( 2 );
			expect ( info.numPipelines ).to.equal ( 2 );
		} );
	} );
};
