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
import { PhongShading } from "../../../lib/src/Shaders/PhongShading";


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
	shader.getPipeline ( "triangle-list" );
	return await device.popErrorScope();
};

/**
 * Render one red triangle and return the color of the center pixel.
 * @param {Lighting} shader The shader.
 * @param {number[]} points The triangle's points.
 * @param {number[] | null} normals The normals, or null for none.
 * @param {boolean} twoSidedLight Whether to use two-sided lighting.
 * @returns {Promise<{ rgba: number[], error: GPUError | null }>} The color, and any validation error.
 */
const renderCenterPixel = async ( shader: Lighting, points: number[], normals: number[] | null, twoSidedLight: boolean ) :
	Promise < { rgba: number[], error: GPUError | null } > =>
{
	const { device, preferredFormat } = Device.instance;
	device.pushErrorScope ( "validation" );

	// Set up the shader. Set the view matrix last because that is what makes
	// the shader update its uniform buffer.
	shader.projMatrix = IDENTITY_MATRIX;
	shader.color = [ 1, 0, 0, 1 ];
	shader.twoSidedLight = twoSidedLight;
	shader.viewMatrix = IDENTITY_MATRIX;

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
	pass.setPipeline ( shader.getPipeline ( "triangle-list" ) );
	shader.configureRenderPass ( pass, "triangle-list" );
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
	device.queue.submit ( [ encoder.finish() ] );

	// Read the center pixel. The byte order depends on the format.
	await readBuffer.mapAsync ( GPUMapMode.READ );
	const center = ( ( SIZE / 2 ) * bytesPerRow ) + ( ( SIZE / 2 ) * 4 );
	const bytes = Array.from ( new Uint8Array ( readBuffer.getMappedRange(), center, 4 ) );
	readBuffer.unmap();
	const rgba = ( ( "bgra8unorm" === preferredFormat ) ? [ bytes[2], bytes[1], bytes[0], bytes[3] ] : bytes );

	// Clean up.
	texture.destroy();
	depth.destroy();
	readBuffer.destroy();

	return { rgba, error: await device.popErrorScope() };
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
