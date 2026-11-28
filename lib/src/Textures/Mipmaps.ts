///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Make the mipmaps of a texture on the GPU, because WebGPU doesn't. Each
//	level is drawn from the one before it, with one render pass for each, as
//	three.js and Babylon.js do. See Mipmaps.wgsl.
//
//	The alpha is averaged like the colors, without pre-multiplying, which can
//	tint the edges of transparent parts a little. That's what three.js and
//	Babylon.js do too.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools/Device";
import code from "./Mipmaps.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	What's made with the current device: the shader module, a sampler, and a
//	pipeline for each texture format.
//
///////////////////////////////////////////////////////////////////////////////

let module: ( GPUShaderModule | null ) = null;
let sampler: ( GPUSampler | null ) = null;
const pipelines = new Map < GPUTextureFormat, GPURenderPipeline > ();
let madeWithDevice = 0;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the pipeline that draws a level in the format, making what we have to.
 * @param {GPUDevice} device - The device.
 * @param {GPUTextureFormat} format - The format of the texture.
 * @returns {GPURenderPipeline} The pipeline.
 */
///////////////////////////////////////////////////////////////////////////////

const getPipeline = ( device: GPUDevice, format: GPUTextureFormat ) : GPURenderPipeline =>
{
	// What was made with a device that was lost can't be used with the new one.
	const { id } = Device.instance;
	if ( madeWithDevice !== id )
	{
		module = null;
		sampler = null;
		pipelines.clear();
		madeWithDevice = id;
	}

	// Make what we have to.
	module ??= device.createShaderModule ( { label: "Mipmaps", code } );
	sampler ??= device.createSampler ( { label: "Mipmaps", magFilter: "linear", minFilter: "linear" } );
	let pipeline = pipelines.get ( format );
	if ( !pipeline )
	{
		pipeline = device.createRenderPipeline ( {
			label: `Mipmaps in ${format}`,
			layout: "auto",
			vertex: { module, entryPoint: "vs" },
			fragment: { module, entryPoint: "fs", targets: [ { format } ] },
			primitive: { topology: "triangle-list" },
		} );
		pipelines.set ( format, pipeline );
	}
	return pipeline;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the mipmaps of the texture from its first level. It needs
 * TEXTURE_BINDING and RENDER_ATTACHMENT usage.
 * @param {GPUTexture} texture - The texture.
 */
///////////////////////////////////////////////////////////////////////////////

export const generateMipmaps = ( texture: GPUTexture ) : void =>
{
	const { device } = Device.instance;
	const pipeline = getPipeline ( device, texture.format );
	const encoder = device.createCommandEncoder ( { label: "Mipmaps" } );

	// Draw each level from the one before it.
	for ( let level = 1; level < texture.mipLevelCount; ++level )
	{
		const bindGroup = device.createBindGroup ( {
			layout: pipeline.getBindGroupLayout ( 0 ),
			entries: [
				{ binding: 0, resource: texture.createView ( { baseMipLevel: ( level - 1 ), mipLevelCount: 1 } ) },
				{ binding: 1, resource: sampler! },
			],
		} );
		const pass = encoder.beginRenderPass ( {
			label: `Mipmap level ${level}`,
			colorAttachments: [ {
				view: texture.createView ( { baseMipLevel: level, mipLevelCount: 1 } ),
				loadOp: "clear",
				storeOp: "store",
			} ],
		} );
		pass.setPipeline ( pipeline );
		pass.setBindGroup ( 0, bindGroup );
		pass.draw ( 3 );
		pass.end();
	}

	device.queue.submit ( [ encoder.finish() ] );
};
