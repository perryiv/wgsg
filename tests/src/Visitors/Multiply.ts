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
import { mat4 } from "gl-matrix";
import {
	Group,
	IDENTITY_MATRIX,
	IMatrix44,
	Multiply,
	Transform,
	Visitor,
} from "wgsg-lib";


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
		this.result.push ( [ ...this.modelMatrix ] );
		super.visitGroup ( group );
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public override reset() {}
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
			mat4.translate ( t1.matrix, IDENTITY_MATRIX, [ 10, 0, 0 ] );

			const t2 = new Transform();
			mat4.translate ( t2.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );

			const t3 = new Transform();
			mat4.translate ( t3.matrix, IDENTITY_MATRIX, [ 0, 0, 10 ] );

			const root = new Group();
			root.addChild ( t1 );
			t1.addChild ( t2 );
			t2.addChild ( t3 );

			const visitor = new MyMultiplyVisitor();
			root.accept ( visitor );

			expect ( visitor.result.length ).to.be.equal ( 4 );
			expect ( visitor.result[0] ).to.be.deep.equal ( [
				 1,  0,  0,  0,
				 0,  1,  0,  0,
				 0,  0,  1,  0,
				 0,  0,  0,  1
			] );
			expect ( visitor.result[1] ).to.be.deep.equal ( [
				 1,  0,  0,  0,
				 0,  1,  0,  0,
				 0,  0,  1,  0,
				10,  0,  0,  1
			] );
			expect ( visitor.result[2] ).to.be.deep.equal ( [
				 1,  0,  0,  0,
				 0,  1,  0,  0,
				 0,  0,  1,  0,
				10, 10,  0,  1
			] );
			expect ( visitor.result[3] ).to.be.deep.equal ( [
				 1,  0,  0,  0,
				 0,  1,  0,  0,
				 0,  0,  1,  0,
				10, 10, 10,  1
			] );
		} );
	} );
};
