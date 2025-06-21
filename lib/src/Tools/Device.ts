///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	WebGPU device object.
//
///////////////////////////////////////////////////////////////////////////////

import { Base } from "../Base";
import { IDeviceOptions, ITextureFormat } from "../Types/Graphics";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface IPipelineShaderInput
{
	label: string
	module: GPUShaderModule;
}

type IPipelineInput = ( IPipelineShaderInput | GPURenderPipelineDescriptor );


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the GPU device and other associated resources.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Device extends Base
{
	#device: ( GPUDevice | null ) = null;
	#preferredFormat: ( ITextureFormat | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {GPUDevice} device The GPU device.
	 */
	protected constructor ( device: GPUDevice )
	{
		// Do this first.
		super();

		// Set our members.
		this.#device = device;
	}

	/**
	 * Check for WebGPU support.
	 * @returns {boolean} True if WebGPU is supported, false otherwise.
	 */
	public static get supported() : boolean
	{
		const { gpu } = navigator;
		return ( !!gpu );
	}

	/**
	 * Create an instance of this class.
	 * @param {IDeviceOptions} options The options.
	 * @returns {Promise<Device>} A promise that resolves to the device instance.
	 */
	public static async create ( options?: IDeviceOptions ) : Promise < Device >
	{
		// Shortcut.
		const { gpu } = navigator;

		// Handle no WebGPU support.
		if ( !gpu )
		{
			throw new Error ( "WebGPU is not supported" );
		}

		// Get the adapter.
		const adapter = await gpu.requestAdapter ( options?.requestAdapterOptions );

		// Handle no adapter.
		if ( !adapter )
		{
			throw new Error ( "Failed to get WebGPU adapter" );
		}

		// Get the device from the adapter. Can only do this once with this
		// particular adapter, which is why we don't return it also.
		const device = await adapter.requestDevice ( options?.deviceDescriptor );

		// Handle no device.
		if ( !device )
		{
			throw new Error ( "Failed to get device from WebGPU adapter" );
		}

		// If we get to here then return the new object.
		return ( new Device ( device ) );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Tools.Device";
	}

	/**
	 * Get the GPU device.
	 * @returns {GPUDevice} The GPU device.
	 */
	public get device() : GPUDevice
	{
		const device = this.#device;
		if ( !device )
		{
			throw new Error ( "Device is not initialized" );
		}
		return device;
	}

	/**
	 * Return a configured rendering context.
	 * @param {HTMLCanvasElement | OffscreenCanvas} canvas The canvas to use for rendering.
	 * @returns {GPUCanvasContext} Configured GPU canvas context.
	 */
	public getContext ( canvas: ( HTMLCanvasElement | OffscreenCanvas ) ) : GPUCanvasContext
	{
		// Check input.
		if ( !canvas )
		{
			throw new Error ( "Invalid WebGPU canvas element when getting rendering context" );
		}

		// Get the context from the canvas.
		const context = canvas.getContext ( "webgpu" );

		// Handle invalid context.
		if ( !context )
		{
			throw new Error ( "Invalid WebGPU rendering context" );
		}

		// Configure the context.
		context.configure ( {
			device: this.device,
			format: this.preferredFormat,
			alphaMode: "premultiplied",
		} );

		// Return the context.
		return context;
	}

	/**
	 * Get the preferred canvas format for WebGPU.
	 * @returns {ITextureFormat} The preferred canvas format.
	 */
	public get preferredFormat() : ITextureFormat
	{
		// The first time we have to set it.
		if ( !this.#preferredFormat )
		{
			this.#preferredFormat = navigator.gpu.getPreferredCanvasFormat();
		}

		// Return the format.
		return this.#preferredFormat;
	}

	/**
	 * Return the limits of the device.
	 * @returns {GPUSupportedLimits} The device limits.
	 */
	public get limits() : GPUSupportedLimits
	{
		return this.device.limits;
	}

	/**
	 * Make the shader module.
	 * @param {GPUShaderModuleDescriptor} descriptor - The descriptor for the shader module.
	 * @returns {GPUShaderModule} The shader module.
	 */
	public makeShader ( descriptor: GPUShaderModuleDescriptor ) : GPUShaderModule
	{
		// Make sure the code is a string. We do this because it could have been
		// imported with vite or webpack, and that has to happen correctly.
		{
			const { code } = descriptor;
			if ( "string" !== ( typeof code ) )
			{
				throw new Error ( `Shader code type is: ${typeof code}` );
			}
		}

		// Create the shader module.
		return this.device.createShaderModule ( descriptor );
	}

	/**
	 * Return a new render pipeline.
	 * @param {IPipelineInput} [input] - The input for the pipeline.
	 * @returns {GPURenderPipeline} The new render pipeline.
	 */
	public makePipeline ( input: IPipelineInput ) : GPURenderPipeline
	{
		// Initialize the descriptor.
		let descriptor: GPURenderPipelineDescriptor | null = null;

		// See if we're supposed to make the descriptor.
		const { label, module } = ( input as IPipelineShaderInput );
		if ( module && label )
		{
			// Make the descriptor.
			const target = { format: this.preferredFormat };
			descriptor = {
				label,
				vertex: { module },
				fragment: { module, targets: [ target ] },
				primitive: { topology: "triangle-list" },
				layout: "auto",
			};
		}

		// Otherwise, just use the input as the descriptor.
		else
		{
			descriptor = ( input as GPURenderPipelineDescriptor );
		}

		// Create the pipeline.
		return this.device.createRenderPipeline ( descriptor );
	}

	/**
	 * Make a command encoder.
	 * @param {string} label - The label for the command encoder.
	 * @returns {GPUCommandEncoder} The command encoder.
	 */
	public makeEncoder ( label: string ) : GPUCommandEncoder
	{
		return this.device.createCommandEncoder ( { label } );
	}

	/**
	 * Get the GPU queue.
	 * @returns {GPUQueue} The GPU queue.
	 */
	public get queue() : GPUQueue
	{
		return this.device.queue;
	}
}
