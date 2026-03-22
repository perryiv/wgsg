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
/**
 * Class that contains the GPU device and other associated resources.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Device extends Base
{
	static #instance: Device | null = null;
	static #isInitializing = false;
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
	 * Initialize the singleton instance of this class.
	 * @param {IDeviceOptions} options The options.
	 * @returns {Promise<void>} A promise that resolves when the device is initialized.
	 */
	public static async init ( options?: IDeviceOptions ) : Promise < void >
	{
		// Is there already an instance?
		if ( Device.#instance )
		{
			return;
		}

		// Did we re-enter this function while initializing?
		if ( true === Device.#isInitializing )
		{
			throw new Error ( "Device is already being initialized" );
		}

		// Shortcut.
		const { gpu } = globalThis.navigator;

		// Handle no WebGPU support.
		if ( !gpu )
		{
			throw new Error ( "WebGPU is not supported" );
		}

		// If we get to here then we're starting the initialization.
		Device.#isInitializing = true;

		// Get the adapter.
		const adapter = await gpu.requestAdapter ( options?.requestAdapterOptions );

		// Handle no adapter.
		if ( !adapter )
		{
			Device.#isInitializing = false;
			throw new Error ( "Failed to get WebGPU adapter" );
		}

		// Get the device from the adapter. Can only do this once with this
		// particular adapter, which is why we don't return it also.
		const device = await adapter.requestDevice ( options?.deviceDescriptor );

		// Handle no device.
		if ( !device )
		{
			Device.#isInitializing = false;
			throw new Error ( "Failed to get device from WebGPU adapter" );
		}

		// Make the new instance.
		const instance = new Device ( device );

		// Set the label for debugging.
		device.label = `Device ${instance.id}`;

		// Capture the id now for use below.
		const id = instance.id;

		// Handle device lost events. We don't have enough information here to
		// rebuild everything that needs to be rebuilt, so we just destroy the
		// singleton instance.
		void device.lost.then ( ( { reason, message }: GPUDeviceLostInfo ) =>
		{
			console.log ( `Device ${id} lost, reason: ${reason}, message: ${message}` );
			Device.destroy();
		} );

		// If we get to here then set the singleton instance.
		Device.#instance = instance;

		// We're done initializing.
		Device.#isInitializing = false;
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		// Are we destroying while initializing?
		if ( true === Device.#isInitializing )
		{
			throw new Error ( "Device is being destroyed while it is being initialized" );
		}

		// Save the value and set it to null.
		const instance = Device.#instance;
		Device.#instance = null;

		// Is there an instance to destroy?
		if ( !instance )
		{
			return;
		}

		// Get the internal device.
		const device = instance.device;

		// Handle no device.
		if ( !device )
		{
			return;
		}

		console.log ( `Destroying singleton device ${instance.id}` );

		// Destroy the device. This prevents any future operations on it.
		device.destroy();
	}

	/**
	 * See if the device is being initialized.
	 * @returns {boolean} True if the device is being initialized, false otherwise.
	 */
	public static get isInitializing() : boolean
	{
		return ( true === Device.#isInitializing );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Tools.Device";
	}

	/**
	 * Check for WebGPU support.
	 * @returns {boolean} True if WebGPU is supported, false otherwise.
	 */
	public static get supported() : boolean
	{
		const { gpu } = globalThis.navigator;
		return ( !!gpu );
	}

	/**
	 * Is the device valid?
	 * @returns {boolean} True if the device is valid, false otherwise.
	 */
	public static get valid() : boolean
	{
		return ( !!Device.#instance );
	}

	/**
	 * Get the singleton instance.
	 * @returns {Device} The singleton instance.
	 */
	public static get instance() : Device
	{
		if ( !Device.#instance )
		{
			throw new Error ( "Device is not initialized" );
		}
		return Device.#instance;
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
	public getConfiguredContext ( canvas: ( HTMLCanvasElement | OffscreenCanvas ) ) : GPUCanvasContext
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
			// Shortcut.
			const { gpu } = globalThis.navigator;

			// Make sure we have WebGPU support.
			if ( !gpu )
			{
				throw new Error ( "WebGPU is not supported when getting the preferred canvas format" );
			}

			// Get the preferred format and save it for next time.
			this.#preferredFormat = gpu.getPreferredCanvasFormat();
		}

		// Return the format.
		return this.#preferredFormat;
	}
}
