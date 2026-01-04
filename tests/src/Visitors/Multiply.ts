///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test code for the visitor classes.
//
///////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import {
	Group,
	IMatrix44,
	Multiply,
	Transform,
	Visitor,
} from "../wgsg";


///////////////////////////////////////////////////////////////////////////////
//
//	Used below.
//
///////////////////////////////////////////////////////////////////////////////

class MyMultiplyVisitor extends Multiply
{
	public result = new Array < IMatrix44 > ();
	public override getClassName() : string
	{
		return "MyMultiplyVisitor";
	}
	public override visitGroup ( group: Group ): void
	{
		this.result.push ( [ ...this.viewMatrix ] );
		super.visitGroup ( group );
	}
	public override visitTransform ( tr: Transform ): void
	{
		this.result.push ( [ ...this.viewMatrix ] );
		super.visitTransform ( tr );
	}
	public override reset()
	{
		// Do nothing.
	}
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Multiply", function ()
	{
		it ( "Can inherit from matrix-multiplying visitor class", function ()
		{
			const a = new MyMultiplyVisitor();
			expect ( a instanceof Visitor ).to.be.true;
			expect ( a instanceof Multiply ).to.be.true;
			expect ( a.type ).to.be.equal ( a.getClassName() );
			expect ( a.type ).to.be.equal ( "MyMultiplyVisitor" );
			expect ( a.id ).to.exist;
			expect ( typeof a.id ).to.be.equal ( "number" );
			expect ( a.id ).to.be.greaterThan ( 0 );
		} );

		it ( "Should multiply the matrix as it traverses", function ()
		{
			const t1 = new Transform();
			t1.translate ( [ 10, 0, 0 ] );

			const t2 = new Transform();
			t2.translate ( [ 0, 10, 0 ] );

			const t3 = new Transform();
			t3.translate ( [ 0, 0, 10 ] );

			const root = new Group();
			root.addChild ( t1 );
			t1.addChild ( t2 );
			t2.addChild ( t3 );
			t3.addChild ( new Group() );

			const visitor = new MyMultiplyVisitor();
			root.accept ( visitor );

			expect ( visitor.result.length ).to.be.equal ( 5 );
			expect ( visitor.result[0] ).to.be.deep.equal ( [
				 1,  0,  0,  0, // Top level group node.
				 0,  1,  0,  0, // No transformation.
				 0,  0,  1,  0,
				 0,  0,  0,  1
			] );
			expect ( visitor.result[1] ).to.be.deep.equal ( [
				 1,  0,  0,  0, // First transform node.
				 0,  1,  0,  0, // This is before the base class' function is called
				 0,  0,  1,  0, // to multiply the matrices and continue the traveral.
				 0,  0,  0,  1
			] );
			expect ( visitor.result[2] ).to.be.deep.equal ( [
				 1,  0,  0,  0, // Second transform node.
				 0,  1,  0,  0, // It has the first transform applied.
				 0,  0,  1,  0,
				10,  0,  0,  1
			] );
			expect ( visitor.result[3] ).to.be.deep.equal ( [
				 1,  0,  0,  0, // Third transform node.
				 0,  1,  0,  0, // It has the first and second transforms applied.
				 0,  0,  1,  0,
				10, 10,  0,  1
			] );
			expect ( visitor.result[4] ).to.be.deep.equal ( [
				 1,  0,  0,  0, // Last group node.
				 0,  1,  0,  0, // It has all three transforms applied.
				 0,  0,  1,  0,
				10, 10, 10,  1
			] );
		} );
	} );
};
