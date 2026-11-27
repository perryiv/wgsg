///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the shaders that use the Lighting base class. These need a GPU.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../../lib/src/Arrays";
import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { FlatShading } from "../../../lib/src/Shaders/FlatShading";
import { IDENTITY_MATRIX } from "../../../lib/src/Tools/Constants";
import { Lighting } from "../../../lib/src/Shaders/Lighting";
import { ObjectMatrices } from "../../../lib/src/Shaders/ObjectMatrices";
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";
import { SolidColor } from "../../../lib/src/Shaders/SolidColor";
import type { IMatrix44 } from "../../../lib/src/Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions.
//
///////////////////////////////////////////////////////////////////////////////

// The size of the image we render. The width times 4 bytes has to be a
// multiple of 256 to copy the image to a buffer.
const SIZE = 64;

// A triangle in front of the camera that covers the center pixel.
// With identity matrices these are also the clip-space positions.
// Counter-clockwise, so it is front facing.
const FRONT_FACING = [ -1, -1, 0.5,   1, -1, 0.5,   0, 1, 0.5 ];

// The same triangle wound the other way, so it is back facing.
const BACK_FACING = [ -1, -1, 0.5,   0, 1, 0.5,   1, -1, 0.5 ];

// Each render in these tests is a new frame.
let frameCount = 0;

// A projection matrix that moves everything 5 to the right, which puts the
// triangle off the screen. The matrix is column-major.
const MOVE_RIGHT: IMatrix44 = [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   5, 0, 0, 1 ];

/**
 * Get the shader's compilation errors.
 * @param {Lighting} shader The shader.
 * @returns {Promise<string[]>} The error messages.
 */
const getCompilationErrors = async ( shader: Lighting ) : Promise < string[] > =>
{
	const info = await shader.module.getCompilationInfo();
	return info.messages
		.filter ( ( message ) => ( "error" === message.type ) )
		.map ( ( message ) => `${message.lineNum}:${message.linePos} ${message.message}` );
};

/**
 * Make the shader's pipeline and return any WebGPU validation error.
 * @param {Lighting} shader The shader.
 * @returns {Promise<GPUError | null>} The validation error, or null if there is none.
 */
const getPipelineError = async ( shader: Lighting ) : Promise < GPUError | null > =>
{
	const device = Device.instance.device;
	device.pushErrorScope ( "validation" );
	shader.getPipeline ( { topology: "triangle-list", cullMode: "none", depthWrite: true } );
	return await device.popErrorScope();
};

/**
 * Render one red triangle and return the color of the center pixel.
 * @param {Lighting | SolidColor} shader The shader.
 * @param {number[]} points The triangle's points.
 * @param {number[] | null} normals The normals, or null for none.
 * @param {boolean} twoSidedLight Whether to use two-sided lighting. Only used by lighting shaders.
 * @param {boolean} [setUp] Whether to set up the shader's color and matrices first.
 * @param {GPUCullMode} [cullMode] Which faces to cull.
 * @returns {Promise<{ rgba: number[], error: GPUError | null }>} The color, and any validation error.
 */
const renderCenterPixel = async ( shader: Lighting | SolidColor, points: number[], normals: number[] | null, twoSidedLight: boolean, setUp = true, cullMode: GPUCullMode = "none" ) :
	Promise < { rgba: number[], error: GPUError | null } > =>
{
	const { device, preferredFormat } = Device.instance;
	device.pushErrorScope ( "validation" );

	// The object's matrix is the identity.
	const objects = new ObjectMatrices();
	objects.begin ( 1 );
	const objectOffset = objects.add ( IDENTITY_MATRIX );

	// Set up the shader, unless the test has already done it.
	if ( setUp )
	{
		shader.projMatrix = IDENTITY_MATRIX;
		shader.color = [ 1, 0, 0, 1 ];
		if ( shader instanceof Lighting )
		{
			shader.twoSidedLight = twoSidedLight;
		}
	}

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
	const pointBuffer = new Array1 ( new Float32Array ( points ) ).buffer;
	const normalBuffer = ( normals ? new Array1 ( new Float32Array ( normals ) ).buffer : null );
	const indexBuffer = new Array1 ( new Uint32Array ( [ 0, 1, 2 ] ) ).buffer;

	// Draw the triangle.
	const encoder = device.createCommandEncoder();
	const pass = encoder.beginRenderPass ( {
		colorAttachments: [ {
			view: texture.createView(),
			clearValue: [ 0, 0, 0, 0 ],
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
	pass.setPipeline ( shader.getPipeline ( { topology: "triangle-list", cullMode, depthWrite: true } ) );
	shader.configureRenderPass ( pass, ++frameCount );
	objects.bind ( pass, objectOffset );
	pass.setVertexBuffer ( 0, pointBuffer );
	if ( normalBuffer )
	{
		pass.setVertexBuffer ( 1, normalBuffer );
	}
	pass.setIndexBuffer ( indexBuffer!, "uint32" );
	pass.drawIndexed ( 3 );
	pass.end();

	// Copy the image to a buffer that we can read.
	const bytesPerRow = SIZE * 4;
	const readBuffer = device.createBuffer ( {
		size: bytesPerRow * SIZE,
		usage: ( GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ ),
	} );
	encoder.copyTextureToBuffer ( { texture }, { buffer: readBuffer, bytesPerRow }, [ SIZE, SIZE ] );
	objects.upload();
	device.queue.submit ( [ encoder.finish() ] );

	// Read the center pixel. The byte order depends on the format.
	await readBuffer.mapAsync ( GPUMapMode.READ );
	const center = ( ( SIZE / 2 ) * bytesPerRow ) + ( ( SIZE / 2 ) * 4 );
	const bytes = Array.from ( new Uint8Array ( readBuffer.getMappedRange(), center, 4 ) );
	readBuffer.unmap();
	const rgba = ( ( "bgra8unorm" === preferredFormat ) ? [ bytes[2], bytes[1], bytes[0], bytes[3] ] : bytes );

	// Clean up.
	texture.destroy();
	objects.destroy();
	depth.destroy();
	readBuffer.destroy();

	return { rgba, error: await device.popErrorScope() };
};

/**
 * Render two triangles in one render pass and one frame, the left one red
 * and the right one green, like two state groups that use the same shader.
 * Return the colors of a pixel in each triangle.
 * @param {Lighting | SolidColor} shader The shader.
 * @param {number[] | null} normals The normals for each triangle, or null for none.
 * @returns {Promise<{ left: number[], right: number[], error: GPUError | null }>} The colors, and any validation error.
 */
const renderTwoColors = async ( shader: Lighting | SolidColor, normals: number[] | null ) :
	Promise < { left: number[], right: number[], error: GPUError | null } > =>
{
	const { device, preferredFormat } = Device.instance;
	device.pushErrorScope ( "validation" );

	// The object's matrix is the identity.
	const objects = new ObjectMatrices();
	objects.begin ( 1 );
	const objectOffset = objects.add ( IDENTITY_MATRIX );

	shader.projMatrix = IDENTITY_MATRIX;
	if ( shader instanceof Lighting )
	{
		shader.twoSidedLight = false;
	}

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

	// Two front-facing triangles, one in each half of the image.
	const left = new Array1 ( new Float32Array ( [ -1, -1, 0.5,   0, -1, 0.5,   -0.5, 1, 0.5 ] ) ).buffer;
	const right = new Array1 ( new Float32Array ( [ 0, -1, 0.5,   1, -1, 0.5,   0.5, 1, 0.5 ] ) ).buffer;
	const normalBuffer = ( normals ? new Array1 ( new Float32Array ( normals ) ).buffer : null );
	const indexBuffer = new Array1 ( new Uint32Array ( [ 0, 1, 2 ] ) ).buffer;

	const encoder = device.createCommandEncoder();
	const pass = encoder.beginRenderPass ( {
		colorAttachments: [ {
			view: texture.createView(),
			clearValue: [ 0, 0, 0, 0 ],
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
	pass.setPipeline ( shader.getPipeline ( { topology: "triangle-list", cullMode: "none", depthWrite: true } ) );
	pass.setIndexBuffer ( indexBuffer!, "uint32" );
	if ( normalBuffer )
	{
		pass.setVertexBuffer ( 1, normalBuffer );
	}

	// The same frame for both, like the draw stage of one frame.
	const frame = ++frameCount;

	shader.color = [ 1, 0, 0, 1 ];
	shader.configureRenderPass ( pass, frame );
	objects.bind ( pass, objectOffset );
	pass.setVertexBuffer ( 0, left );
	pass.drawIndexed ( 3 );

	shader.color = [ 0, 1, 0, 1 ];
	shader.configureRenderPass ( pass, frame );
	pass.setVertexBuffer ( 0, right );
	pass.drawIndexed ( 3 );

	pass.end();

	const bytesPerRow = SIZE * 4;
	const readBuffer = device.createBuffer ( {
		size: bytesPerRow * SIZE,
		usage: ( GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ ),
	} );
	encoder.copyTextureToBuffer ( { texture }, { buffer: readBuffer, bytesPerRow }, [ SIZE, SIZE ] );
	objects.upload();
	device.queue.submit ( [ encoder.finish() ] );

	// Read a pixel in the middle of each triangle. Get the mapped range only
	// once, because getting it again would overlap the first one.
	await readBuffer.mapAsync ( GPUMapMode.READ );
	const image = readBuffer.getMappedRange();
	const row = ( SIZE / 2 ) * bytesPerRow;
	const getPixel = ( x: number ) : number[] =>
	{
		const bytes = Array.from ( new Uint8Array ( image, row + ( x * 4 ), 4 ) );
		return ( ( "bgra8unorm" === preferredFormat ) ? [ bytes[2], bytes[1], bytes[0], bytes[3] ] : bytes );
	};
	const answer = { left: getPixel ( SIZE / 4 ), right: getPixel ( ( 3 * SIZE ) / 4 ) };
	readBuffer.unmap();

	texture.destroy();
	objects.destroy();
	depth.destroy();
	readBuffer.destroy();

	return { ...answer, error: await device.popErrorScope() };
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Lighting", function ()
	{
		const shaders: [ string, () => Lighting ][] = [
			[ "PhongShading", () => PhongShading.instance ],
			[ "FlatShading", () => FlatShading.instance ],
		];

		for ( const [ name, getShader ] of shaders )
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
			} );
		}

		describe ( "FlatShading drawing", function ()
		{
			it ( "Should light a front-facing triangle that has no normals", async function ()
			{
				const { rgba, error } = await renderCenterPixel ( FlatShading.instance, FRONT_FACING, null, false );
				expect ( error ).to.be.null;
				expect ( rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );
			} );

			it ( "Should not light a back-facing triangle with one-sided lighting", async function ()
			{
				const { rgba, error } = await renderCenterPixel ( FlatShading.instance, BACK_FACING, null, false );
				expect ( error ).to.be.null;
				expect ( rgba ).to.deep.equal ( [ 0, 0, 0, 255 ] );
			} );

			it ( "Should light a back-facing triangle with two-sided lighting", async function ()
			{
				const { rgba, error } = await renderCenterPixel ( FlatShading.instance, BACK_FACING, null, true );
				expect ( error ).to.be.null;
				expect ( rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );
			} );

			it ( "Should draw a triangle that has normals, and ignore them", async function ()
			{
				const normals = [ 0, 0, -1,   0, 0, -1,   0, 0, -1 ]; // Pointing away.
				const { rgba, error } = await renderCenterPixel ( FlatShading.instance, FRONT_FACING, normals, false );
				expect ( error ).to.be.null;
				expect ( rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );
			} );
		} );

		describe ( "Face culling", function ()
		{
			const cases: [ string, () => Lighting | SolidColor, number[] | null ][] = [
				[ "PhongShading", () => PhongShading.instance, [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] ],
				[ "FlatShading", () => FlatShading.instance, null ],
				[ "SolidColor", () => SolidColor.instance, null ],
			];

			for ( const [ name, getShader, normals ] of cases )
			{
				it ( `Should make one pipeline for each set of options with ${name}`, function ()
				{
					const shader = getShader();
					const none = shader.getPipeline ( { topology: "triangle-list", cullMode: "none", depthWrite: true } );
					const back = shader.getPipeline ( { topology: "triangle-list", cullMode: "back", depthWrite: true } );
					expect ( back ).not.to.equal ( none );
					expect ( shader.getPipeline ( { topology: "triangle-list", cullMode: "none", depthWrite: true } ) ).to.equal ( none );
					expect ( shader.getPipeline ( { topology: "triangle-list", cullMode: "back", depthWrite: true } ) ).to.equal ( back );
				} );

				it ( `Should cull the back faces with ${name}`, async function ()
				{
					// Two-sided lighting, so that only culling hides the back.
					const front = await renderCenterPixel ( getShader(), FRONT_FACING, normals, true, true, "back" );
					expect ( front.error ).to.be.null;
					expect ( front.rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );

					const back = await renderCenterPixel ( getShader(), BACK_FACING, normals, true, true, "back" );
					expect ( back.error ).to.be.null;
					expect ( back.rgba ).to.deep.equal ( [ 0, 0, 0, 0 ] );
				} );

				it ( `Should cull the front faces with ${name}`, async function ()
				{
					const front = await renderCenterPixel ( getShader(), FRONT_FACING, normals, true, true, "front" );
					expect ( front.error ).to.be.null;
					expect ( front.rgba ).to.deep.equal ( [ 0, 0, 0, 0 ] );
				} );
			}
		} );

		describe ( "Changing only the projection matrix", function ()
		{
			// Before the fix, the shader kept using its old uniform buffer, so
			// the second draw still showed the triangle.
			const cases: [ string, () => Lighting | SolidColor, number[] | null ][] = [
				[ "PhongShading", () => PhongShading.instance, [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] ],
				[ "FlatShading", () => FlatShading.instance, null ],
				[ "SolidColor", () => SolidColor.instance, null ],
			];

			for ( const [ name, getShader, normals ] of cases )
			{
				it ( `Should update the uniforms of ${name}`, async function ()
				{
					const shader = getShader();

					// First draw with identity matrices, so the triangle covers the center.
					const first = await renderCenterPixel ( shader, FRONT_FACING, normals, false );
					expect ( first.error ).to.be.null;
					expect ( first.rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );

					// Change only the projection matrix and draw again without setting
					// anything else. The triangle is now off the screen, so the center
					// pixel is the clear color.
					shader.projMatrix = MOVE_RIGHT;
					const second = await renderCenterPixel ( shader, FRONT_FACING, normals, false, false );
					expect ( second.error ).to.be.null;
					expect ( second.rgba ).to.deep.equal ( [ 0, 0, 0, 0 ] );
				} );
			}
		} );

		describe ( "Two colors in one frame", function ()
		{
			// Each color needs its own uniform buffer, because all the writes
			// happen before the frame's draw calls run. If the second color
			// overwrote the first buffer then both triangles would be green.
			const cases: [ string, () => Lighting | SolidColor, number[] | null ][] = [
				[ "PhongShading", () => PhongShading.instance, [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] ],
				[ "FlatShading", () => FlatShading.instance, null ],
				[ "SolidColor", () => SolidColor.instance, null ],
			];

			for ( const [ name, getShader, normals ] of cases )
			{
				it ( `Should draw both colors with ${name}`, async function ()
				{
					const shader = getShader();
					const { left, right, error } = await renderTwoColors ( shader, normals );
					expect ( error ).to.be.null;
					expect ( left ).to.deep.equal ( [ 255, 0, 0, 255 ] );
					expect ( right ).to.deep.equal ( [ 0, 255, 0, 255 ] );
				} );

				it ( `Should reuse the same uniform buffers in later frames with ${name}`, async function ()
				{
					const shader = getShader();
					await renderTwoColors ( shader, normals );
					const count = shader.numUniformBuffers;
					for ( let i = 0; i < 5; ++i )
					{
						await renderTwoColors ( shader, normals );
					}
					expect ( shader.numUniformBuffers ).to.equal ( count );
				} );
			}
		} );

		describe ( "PhongShading drawing", function ()
		{
			it ( "Should light a triangle with normals towards the camera", async function ()
			{
				const normals = [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ];
				const { rgba, error } = await renderCenterPixel ( PhongShading.instance, FRONT_FACING, normals, false );
				expect ( error ).to.be.null;
				expect ( rgba ).to.deep.equal ( [ 255, 0, 0, 255 ] );
			} );
		} );
	} );
};
