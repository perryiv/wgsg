///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the shaders that draw the triangle edges. Most of these need a GPU.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../../lib/src/Arrays";
import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatEdges } from "../../../lib/src/Shaders/FlatEdges";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { Geometry, Group } from "../../../lib/src/Scene/Nodes";
import { IDENTITY_MATRIX } from "../../../lib/src/Tools/Constants";
import { PhongEdges } from "../../../lib/src/Shaders/PhongEdges";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import { State } from "../../../lib/src/Scene/State";
import { WithEdges } from "../../../lib/src/Shaders/WithEdges";
import {
	getTriangleEdgesShader,
	showTriangleEdges,
} from "../../../lib/src/Shaders/TriangleEdges";
import {
	PULLED_INDICES_NONE,
	PULLED_INDICES_UINT16,
	PULLED_INDICES_UINT32,
} from "../../../lib/src/Shaders/WithEdges";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

// The size of the image we render. The width times 4 bytes has to be a
// multiple of 256 to copy the image to a buffer.
const SIZE = 64;

// A front-facing triangle in the middle of the image, with identity matrices.
// Its bottom edge is at y = -0.5, which is between pixel rows 47 and 48.
const TRIANGLE = [ -0.5, -0.5, 0.5,   0.5, -0.5, 0.5,   0, 0.5, 0.5 ];

// The same triangle after a point that is not used, so that the indices
// have to be read to draw it.
const OFFSET_TRIANGLE = [ 9, 9, 9, ...TRIANGLE ];

// Normals pointing at the camera, for each of the 4 points above.
const NORMALS = [ 0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1 ];

// The pixel in the middle of the triangle, and one next to its bottom edge.
const CENTER = { x: ( SIZE / 2 ), y: ( SIZE / 2 ) };
const NEAR_EDGE = { x: ( SIZE / 2 ), y: 47 };

// Each render in these tests is a new frame.
let frameCount = 0;

interface IRenderInput
{
	shader: WithEdges;
	points: number[];
	normals?: number[];
	indices?: ( Uint16Array | Uint32Array );
	edgeWidth?: number;
}

interface IRenderOutput
{
	mode: ( number | null );
	center: number[];
	nearEdge: number[];
	error: ( GPUError | null );
}

/**
 * Get the shader's compilation errors.
 * @param {WithEdges} shader The shader.
 * @returns {Promise<string[]>} The error messages.
 */
const getCompilationErrors = async ( shader: WithEdges ) : Promise < string[] > =>
{
	const info = await shader.module.getCompilationInfo();
	return info.messages
		.filter ( ( message ) => ( "error" === message.type ) )
		.map ( ( message ) => `${message.lineNum}:${message.linePos} ${message.message}` );
};

/**
 * Make the shader's pipeline and return any WebGPU validation error.
 * @param {WithEdges} shader The shader.
 * @returns {Promise<GPUError | null>} The validation error, or null if there is none.
 */
const getPipelineError = async ( shader: WithEdges ) : Promise < GPUError | null > =>
{
	const device = Device.instance.device;
	device.pushErrorScope ( "validation" );
	shader.getPipeline ( "triangle-list" );
	return await device.popErrorScope();
};

/**
 * Render one red triangle with black edges, pulling the vertices like the
 * draw visitor does, and return two of the pixels.
 * @param {IRenderInput} input The shader, geometry, and edge width.
 * @returns {Promise<IRenderOutput>} The pixels, how the indices were read, and any validation error.
 */
const render = async ( { shader, points, normals, indices, edgeWidth = 4 }: IRenderInput ) : Promise < IRenderOutput > =>
{
	const { device, preferredFormat } = Device.instance;
	device.pushErrorScope ( "validation" );

	// Set up the shader.
	shader.viewMatrix = IDENTITY_MATRIX;
	shader.projMatrix = IDENTITY_MATRIX;
	shader.color = [ 1, 0, 0, 1 ];
	shader.twoSidedLight = false;
	shader.edgeColor = [ 0, 0, 0, 1 ];
	shader.edgeWidth = edgeWidth;

	// The images we render into.
	const texture = device.createTexture ( {
		size: [ SIZE, SIZE ],
		format: preferredFormat,
		usage: ( GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC ),
	} );
	const depth = device.createTexture ( {
		size: [ SIZE, SIZE ],
		format: "depth24plus",
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	} );

	// The geometry.
	const geometry = new Geometry ( {
		points: new Float32Array ( points ),
		normals: ( normals ? new Float32Array ( normals ) : null ),
	} );
	const indexArray = ( indices ? new Array1 ( indices ) : null );
	const count = ( indexArray ? indexArray.values!.length : ( points.length / 3 ) );

	// Draw the triangle.
	const encoder = device.createCommandEncoder();
	const pass = encoder.beginRenderPass ( {
		colorAttachments: [ {
			view: texture.createView(),
			clearValue: [ 1, 1, 1, 1 ],
			loadOp: "clear",
			storeOp: "store",
		} ],
		depthStencilAttachment: {
			view: depth.createView(),
			depthClearValue: 1,
			depthLoadOp: "clear",
			depthStoreOp: "store",
		},
	} );
	pass.setPipeline ( shader.getPipeline ( "triangle-list" ) );
	shader.configureRenderPass ( pass, ++frameCount );
	const mode = shader.setPulledVertices ( pass, { geometry, indices: indexArray, key: {} } );
	if ( null !== mode )
	{
		pass.draw ( count, 1, 0, mode );
	}
	pass.end();

	// Copy the image to a buffer that we can read.
	const bytesPerRow = SIZE * 4;
	const readBuffer = device.createBuffer ( {
		size: bytesPerRow * SIZE,
		usage: ( GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ ),
	} );
	encoder.copyTextureToBuffer ( { texture }, { buffer: readBuffer, bytesPerRow }, [ SIZE, SIZE ] );
	device.queue.submit ( [ encoder.finish() ] );

	// Read the pixels. Get the mapped range only once, because getting it
	// again would overlap the first one.
	await readBuffer.mapAsync ( GPUMapMode.READ );
	const image = readBuffer.getMappedRange();
	const getPixel = ( { x, y }: { x: number, y: number } ) : number[] =>
	{
		const bytes = Array.from ( new Uint8Array ( image, ( y * bytesPerRow ) + ( x * 4 ), 4 ) );
		return ( ( "bgra8unorm" === preferredFormat ) ? [ bytes[2], bytes[1], bytes[0], bytes[3] ] : bytes );
	};
	const answer = { mode, center: getPixel ( CENTER ), nearEdge: getPixel ( NEAR_EDGE ) };
	readBuffer.unmap();

	// Clean up.
	texture.destroy();
	depth.destroy();
	readBuffer.destroy();
	geometry.points?.reset();
	geometry.normals?.reset();
	indexArray?.reset();

	return { ...answer, error: await device.popErrorScope() };
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Edges", function ()
	{
		const shaders: [ string, () => WithEdges, number[] | undefined ][] = [
			[ "FlatEdges", () => FlatEdges.instance, undefined ],
			[ "PhongEdges", () => PhongEdges.instance, NORMALS ],
		];

		for ( const [ name, getShader, normals ] of shaders )
		{
			describe ( name, function ()
			{
				it ( "Should compile without errors", async function ()
				{
					expect ( await getCompilationErrors ( getShader() ) ).to.deep.equal ( [] );
				} );

				it ( "Should make a pipeline without validation errors", async function ()
				{
					expect ( await getPipelineError ( getShader() ) ).to.be.null;
				} );

				it ( "Should pull vertices", function ()
				{
					expect ( getShader().pullsVertices ).to.be.true;
				} );

				it ( "Should draw the edges of a triangle without indices", async function ()
				{
					const { mode, center, nearEdge, error } = await render ( {
						shader: getShader(), points: TRIANGLE, normals } );
					expect ( error ).to.be.null;
					expect ( mode ).to.equal ( PULLED_INDICES_NONE );
					expect ( center ).to.deep.equal ( [ 255, 0, 0, 255 ] );
					expect ( nearEdge ).to.deep.equal ( [ 0, 0, 0, 255 ] );
				} );

				it ( "Should draw the edges of a triangle with 32-bit indices", async function ()
				{
					const { mode, center, nearEdge, error } = await render ( {
						shader: getShader(), points: OFFSET_TRIANGLE, normals,
						indices: new Uint32Array ( [ 1, 2, 3 ] ) } );
					expect ( error ).to.be.null;
					expect ( mode ).to.equal ( PULLED_INDICES_UINT32 );
					expect ( center ).to.deep.equal ( [ 255, 0, 0, 255 ] );
					expect ( nearEdge ).to.deep.equal ( [ 0, 0, 0, 255 ] );
				} );

				it ( "Should draw the edges of a triangle with 16-bit indices", async function ()
				{
					// Three 16-bit indices use both halves of the first 32-bit
					// value and the low half of the second.
					const { mode, center, nearEdge, error } = await render ( {
						shader: getShader(), points: OFFSET_TRIANGLE, normals,
						indices: new Uint16Array ( [ 1, 2, 3 ] ) } );
					expect ( error ).to.be.null;
					expect ( mode ).to.equal ( PULLED_INDICES_UINT16 );
					expect ( center ).to.deep.equal ( [ 255, 0, 0, 255 ] );
					expect ( nearEdge ).to.deep.equal ( [ 0, 0, 0, 255 ] );
				} );

				it ( "Should not draw edges when the width is zero", async function ()
				{
					const { center, nearEdge, error } = await render ( {
						shader: getShader(), points: TRIANGLE, normals, edgeWidth: 0 } );
					expect ( error ).to.be.null;
					expect ( center ).to.deep.equal ( [ 255, 0, 0, 255 ] );
					expect ( nearEdge ).to.deep.equal ( [ 255, 0, 0, 255 ] );
				} );
			} );
		}

		describe ( "PhongEdges without normals", function ()
		{
			it ( "Should not draw", async function ()
			{
				const { mode, center, error } = await render ( {
					shader: PhongEdges.instance, points: TRIANGLE } );
				expect ( error ).to.be.null;
				expect ( mode ).to.be.null;
				expect ( center ).to.deep.equal ( [ 255, 255, 255, 255 ] );
			} );
		} );

		describe ( "Edge properties", function ()
		{
			it ( "Should have black edges one pixel wide by default", function ()
			{
				// Use a new class so the singleton's values don't matter.
				class Test extends FlatEdges
				{
					public constructor() { super(); }
				}
				const shader = new Test();
				expect ( shader.edgeColor ).to.deep.equal ( [ 0, 0, 0, 1 ] );
				expect ( shader.edgeWidth ).to.equal ( 1 );
				shader.destroy();
			} );

			it ( "Should not accept a negative or invalid edge width", function ()
			{
				const shader = FlatEdges.instance;
				expect ( () => { shader.edgeWidth = -1; } ).to.throw();
				expect ( () => { shader.edgeWidth = NaN; } ).to.throw();
			} );

			it ( "Should not pull vertices with the other shaders", function ()
			{
				expect ( FlatShading.instance.pullsVertices ).to.be.false;
				expect ( PhongShading.instance.pullsVertices ).to.be.false;
				expect ( SolidColor.instance.pullsVertices ).to.be.false;
			} );
		} );

		describe ( "Showing the triangle edges", function ()
		{
			it ( "Should get the shader that shows or hides the edges", function ()
			{
				expect ( getTriangleEdgesShader ( FlatShading.instance, true ) ).to.equal ( FlatEdges.instance );
				expect ( getTriangleEdgesShader ( PhongShading.instance, true ) ).to.equal ( PhongEdges.instance );
				expect ( getTriangleEdgesShader ( FlatEdges.instance, false ) ).to.equal ( FlatShading.instance );
				expect ( getTriangleEdgesShader ( PhongEdges.instance, false ) ).to.equal ( PhongShading.instance );
			} );

			it ( "Should not change a shader that is already right or has no edge version", function ()
			{
				expect ( getTriangleEdgesShader ( FlatShading.instance, false ) ).to.be.null;
				expect ( getTriangleEdgesShader ( FlatEdges.instance, true ) ).to.be.null;
				expect ( getTriangleEdgesShader ( SolidColor.instance, true ) ).to.be.null;
				expect ( getTriangleEdgesShader ( SolidColor.instance, false ) ).to.be.null;
			} );

			it ( "Should change the shaders in a scene and back again", function ()
			{
				// A group with flat shading, holding a geometry with Phong
				// shading and one with a solid color.
				const root = new Group();
				root.state = new State ( { shader: FlatShading.instance } );
				const phong = new Geometry();
				phong.state = new State ( { shader: PhongShading.instance } );
				const solid = new Geometry();
				solid.state = new State ( { shader: SolidColor.instance } );
				root.addChild ( phong );
				root.addChild ( solid );

				expect ( showTriangleEdges ( root, true ) ).to.equal ( 2 );
				expect ( root.state.shader ).to.equal ( FlatEdges.instance );
				expect ( phong.state.shader ).to.equal ( PhongEdges.instance );
				expect ( solid.state.shader ).to.equal ( SolidColor.instance );

				// Doing it again changes nothing.
				expect ( showTriangleEdges ( root, true ) ).to.equal ( 0 );

				expect ( showTriangleEdges ( root, false ) ).to.equal ( 2 );
				expect ( root.state.shader ).to.equal ( FlatShading.instance );
				expect ( phong.state.shader ).to.equal ( PhongShading.instance );
				expect ( solid.state.shader ).to.equal ( SolidColor.instance );
			} );
		} );
	} );
}
