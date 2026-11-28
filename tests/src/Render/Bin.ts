///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the render bins and how they sort their shapes.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	Bin,
	Layer,
	makeRenderGraphInfo,
	Pipeline,
	ProjMatrixGroup,
	StateGroup,
	type ISortedShape,
} from "../../../lib/src/Render";
import {
	Shape,
	SphereNode as Sphere,
	State,
	type IBinSort,
} from "../../../lib/src/Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Add shapes with the depths to a new bin, and get their depths and names
 * in the order the bin draws them.
 * @param {IBinSort} sort - How the bin sorts.
 * @param {Array} shapes - The name and depth of each shape.
 * @returns {string[]} The names, in order.
 */
const getOrder = ( sort: IBinSort, shapes: readonly ( readonly [ string, number ] )[] ) : string[] =>
{
	const bin = new Bin ( sort );
	const info = makeRenderGraphInfo();
	const sg = new StateGroup ( new State() );
	const names = new Map < Shape, string > ();
	for ( const [ name, depth ] of shapes )
	{
		const shape = new Sphere ( { center: [ 0, 0, 0 ], radius: 1 } );
		names.set ( shape, name );
		bin.addShape ( info, { pipeline: {} as Pipeline, pmg: {} as ProjMatrixGroup, sg, shape, matrix: 0, depth } );
	}
	expect ( info.numShapes ).to.equal ( shapes.length );
	const answer: string[] = [];
	bin.forEachSortedShape ( ( item: Readonly<ISortedShape> ) => { answer.push ( names.get ( item.shape ) ?? "" ); } );
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Bin", function ()
	{
		it ( "Should keep the shapes in their state groups by default", function ()
		{
			const bin = new Bin();
			expect ( bin.sort ).to.be.null;
			expect ( bin.sorted ).to.be.false;

			const info = makeRenderGraphInfo();
			const sg = new StateGroup ( new State() );
			const shape: Shape = new Sphere ( { center: [ 0, 0, 0 ], radius: 1 } );
			bin.addShape ( info, { pipeline: {} as Pipeline, pmg: {} as ProjMatrixGroup, sg, shape, matrix: 3, depth: 0 } );
			expect ( bin.numSortedShapes ).to.equal ( 0 );
			expect ( sg.numShapes ).to.equal ( 1 );
			expect ( info.numShapes ).to.equal ( 1 );
		} );

		it ( "Should keep the shapes in a list when sorted by depth", function ()
		{
			const bin = new Bin ( "back-to-front" );
			expect ( bin.sorted ).to.be.true;
			const sg = new StateGroup ( new State() );
			const shape = new Sphere ( { center: [ 0, 0, 0 ], radius: 1 } );
			bin.addShape ( makeRenderGraphInfo(), { pipeline: {} as Pipeline, pmg: {} as ProjMatrixGroup, sg, shape, matrix: 3, depth: 0 } );
			expect ( bin.numSortedShapes ).to.equal ( 1 );
			expect ( sg.numShapes ).to.equal ( 0 );
		} );

		it ( "Should sort back to front and front to back, keeping the order of equal depths", function ()
		{
			const shapes = [ [ "a", 0.5 ], [ "b", 0.2 ], [ "c", 0.9 ], [ "d", 0.5 ], [ "e", 0.2 ] ] as const;
			expect ( getOrder ( "back-to-front", shapes ) ).to.deep.equal ( [ "c", "a", "d", "b", "e" ] );
			expect ( getOrder ( "front-to-back", shapes ) ).to.deep.equal ( [ "b", "e", "a", "d", "c" ] );
		} );

		it ( "Should put shapes behind the eye nearest", function ()
		{
			const shapes = [ [ "a", 0.5 ], [ "behind1", -Infinity ], [ "b", 0.7 ], [ "behind2", -Infinity ] ] as const;
			expect ( getOrder ( "back-to-front", shapes ) ).to.deep.equal ( [ "b", "a", "behind1", "behind2" ] );
			expect ( getOrder ( "front-to-back", shapes ) ).to.deep.equal ( [ "behind1", "behind2", "a", "b" ] );
		} );

		it ( "Should let the first state decide the sort of a layer's bin, and warn once when another disagrees", function ()
		{
			const warnings: string[] = [];
			const original = console.warn;
			console.warn = ( ...args: unknown[] ) => { warnings.push ( args.join ( " " ) ); };
			try
			{
				const info = makeRenderGraphInfo();
				const layer = new Layer();
				const bin = layer.getBin ( info, 4321, "back-to-front" );
				expect ( bin.sort ).to.equal ( "back-to-front" );
				expect ( layer.getBin ( info, 4321, "back-to-front" ) ).to.equal ( bin );
				expect ( layer.getBin ( info, 4321, null ) ).to.equal ( bin );
				expect ( layer.getBin ( info, 4321, "front-to-back" ) ).to.equal ( bin );
				expect ( layer.getBin ( info, 4321 ) ).to.equal ( bin );
				expect ( bin.sort ).to.equal ( "back-to-front" );
				expect ( info.numBins ).to.equal ( 1 );
				expect ( layer.getBin ( info, 4322 ).sort ).to.be.null;
				expect ( layer.getBin ( info, 4322, "back-to-front" ).sort ).to.be.null;
			}
			finally
			{
				console.warn = original;
			}
			expect ( warnings ).to.deep.equal ( [
				"Bin 4321 is sorted back-to-front, so a state that wants it not sorted by depth is not used",
				"Bin 4321 is sorted back-to-front, so a state that wants it sorted front-to-back is not used",
				"Bin 4322 is not sorted by depth, so a state that wants it sorted back-to-front is not used",
			] );
		} );
	} );
};
