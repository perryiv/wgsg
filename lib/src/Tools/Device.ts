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

		// If we get to here then set the singleton instance.
		Device.#instance = new Device ( device );

		// Set the label for debugging.
		device.label = `Device ${Device.#instance.id}`;

		// Handle device lost events. We don't have enough information here to
		// rebuild everything that needs to be rebuilt, so we just destroy the
		// singleton instance.
		void device.lost.then ( ( { reason, message }: GPUDeviceLostInfo ) =>
		{
			console.log ( `Device lost, reason: ${reason}, message: ${message}` );
			Device.destroy();
		} );
	}

	/**
	 * Destroy the singleton instance.
	 */
	public static destroy() : void
	{
		const instance = Device.#instance;
		if ( instance )
		{
			const device = instance.device;
			if ( device )
			{
				// Destroy the device. This prevents any future operations on it.
				device.destroy();
			}
		}
		Device.#instance = null;
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
		const { gpu } = navigator;
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
			this.#preferredFormat = navigator.gpu.getPreferredCanvasFormat();
		}

		// Return the format.
		return this.#preferredFormat;
	}
}
