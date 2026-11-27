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

import { Base as BaseClass } from "../Base";
import { IDeviceOptions, ITextureFormat } from "../Types/Graphics";


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Called when the device is lost.
 */
export type IDeviceLostCallback = ( info: GPUDeviceLostInfo ) => void;

/**
 * Called when the device is made again after it was lost.
 */
export type IDeviceRecoveredCallback = () => void;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the GPU device and other associated resources.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Device extends BaseClass
{
	static #instance: Device | null = null;
	static #isInitializing = false;
	static #options: ( IDeviceOptions | undefined ) = undefined;
	static #onLost: ( IDeviceLostCallback | null ) = null;
	static #autoRecover = false;
	static #recovering: ( Promise < void > | null ) = null;
	static #recoveredCallbacks = new Set < IDeviceRecoveredCallback > ();
	#destroyedOnPurpose = false;
	#device: ( GPUDevice | null ) = null;
	#preferredFormat: ( ITextureFormat | null ) = null;
	#adapterInfo: GPUAdapterInfo;

	/**
	 * Construct the class.
	 * @class
	 * @param {GPUDevice} device The GPU device.
	 * @param {GPUAdapterInfo} adapterInfo The information about the adapter.
	 */
	protected constructor ( device: GPUDevice, adapterInfo: GPUAdapterInfo )
	{
		// Do this first.
		super();

		// Set our members.
		this.#device = device;
		this.#adapterInfo = adapterInfo;
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

		// If we get to here then we're starting the initialization. Keep the
		// options, to make the device the same way if it's lost.
		Device.#isInitializing = true;
		Device.#options = options;

		// Get the adapter.
		const adapter = await gpu.requestAdapter ( options?.requestAdapterOptions );

		// Handle no adapter.
		if ( !adapter )
		{
			Device.#isInitializing = false;
			throw new Error ( "Failed to get WebGPU adapter" );
		}

		// Say which GPU we got, and how big a buffer it allows.
		const { vendor, architecture, device: name, description } = adapter.info;
		const mb = ( bytes: number ) => `${( bytes / ( 1024 * 1024 ) ).toFixed ( 0 )} MB`;
		console.log ( `WebGPU adapter: ${vendor}, ${architecture}, ${name}, ${description}, ` +
			`max buffer size ${mb ( adapter.limits.maxBufferSize )}, ` +
			`max storage binding ${mb ( adapter.limits.maxStorageBufferBindingSize )}` );

		// Get the device from the adapter. Can only do this once with this
		// particular adapter, which is why we don't return it also.
		// Ask for timestamp queries if the adapter has them, so that we can
		// measure how long the GPU takes to draw.
		const descriptor: GPUDeviceDescriptor = { ...options?.deviceDescriptor };
		if ( adapter.features.has ( "timestamp-query" ) )
		{
			const features = new Set<GPUFeatureName> ( descriptor.requiredFeatures ?? [] );
			features.add ( "timestamp-query" );
			descriptor.requiredFeatures = [ ...features ];
		}
		const device = await adapter.requestDevice ( descriptor );

		// Handle no device.
		if ( !device )
		{
			Device.#isInitializing = false;
			throw new Error ( "Failed to get device from WebGPU adapter" );
		}

		// Make the new instance.
		const instance = new Device ( device, adapter.info );

		// Set the label for debugging.
		device.label = `Device ${instance.id}`;

		// Handle when the device is lost.
		void device.lost.then ( ( info: GPUDeviceLostInfo ) =>
		{
			Device.handleLost ( instance, info );
		} );

		// If we get to here then set the singleton instance.
		Device.#instance = instance;

		// We're done initializing.
		Device.#isInitializing = false;
	}

	/**
	 * Handle when a device is lost.
	 * @param {Device} instance - The instance whose device was lost.
	 * @param {GPUDeviceLostInfo} info - Why it was lost.
	 */
	private static handleLost ( instance: Device, info: GPUDeviceLostInfo ) : void
	{
		const { reason, message } = info;
		console.log ( `Device ${instance.id} lost, reason: ${reason}, message: ${message}` );

		// Forget it, if it's still the current one. A newer one may be.
		if ( Device.#instance === instance )
		{
			Device.#instance = null;
		}

		// Nothing more to do when it was destroyed on purpose.
		if ( instance.#destroyedOnPurpose )
		{
			return;
		}

		// Tell the application.
		const onLost = Device.#onLost;
		if ( onLost )
		{
			try
			{
				onLost ( info );
			}
			catch ( error )
			{
				console.error ( "Error in the device lost callback:", error );
			}
		}

		// Make a new device if we're supposed to.
		if ( Device.#autoRecover )
		{
			Device.recover().catch ( ( error: unknown ) =>
			{
				console.error ( "Failed to recover from losing the device:", error );
			} );
		}
	}

	/**
	 * Get the function called when the device is lost. It's not called when
	 * the device is destroyed on purpose with destroy().
	 * @returns {IDeviceLostCallback | null} The function, or null.
	 */
	public static get onLost () : ( IDeviceLostCallback | null )
	{
		return Device.#onLost;
	}

	/**
	 * Set the function called when the device is lost. By default, that's all
	 * that happens: the application decides whether to call recover(). Or set
	 * autoRecoverWhenDeviceLost to have that done for it.
	 * @param {IDeviceLostCallback | null} callback - The function, or null.
	 */
	public static set onLost ( callback: ( IDeviceLostCallback | null ) )
	{
		Device.#onLost = callback;
	}

	/**
	 * See if a new device is made by itself when the device is lost.
	 * @returns {boolean} True if it is.
	 */
	public static get autoRecoverWhenDeviceLost () : boolean
	{
		return Device.#autoRecover;
	}

	/**
	 * Set whether a new device is made by itself when the device is lost, by
	 * calling recover(), after the onLost function. It's off by default.
	 * @param {boolean} state - True to make a new device by itself.
	 */
	public static set autoRecoverWhenDeviceLost ( state: boolean )
	{
		Device.#autoRecover = state;
	}

	/**
	 * Make a new device after the device was lost, with the same options as
	 * before, and then call the functions added with addRecoveredCallback().
	 * The surfaces use that to draw again. The rest catches up when it's used:
	 * the shaders and the arrays make their GPU objects again when they see
	 * that the device changed. Calling this while it's already recovering
	 * waits for that, and calling it when there is a device does nothing.
	 * @returns {Promise<void>} Resolves when the new device is ready.
	 */
	public static async recover () : Promise < void >
	{
		if ( Device.#instance )
		{
			return;
		}

		let recovering = Device.#recovering;
		if ( !recovering )
		{
			recovering = ( async () =>
			{
				try
				{
					await Device.init ( Device.#options );
				}
				finally
				{
					Device.#recovering = null;
				}
				for ( const callback of Device.#recoveredCallbacks )
				{
					try
					{
						callback();
					}
					catch ( error )
					{
						console.error ( "Error in a device recovered callback:", error );
					}
				}
			} ) ();
			Device.#recovering = recovering;
		}

		await recovering;
	}

	/**
	 * Add a function to call when a new device is made by recover().
	 * @param {IDeviceRecoveredCallback} callback - The function.
	 */
	public static addRecoveredCallback ( callback: IDeviceRecoveredCallback ) : void
	{
		Device.#recoveredCallbacks.add ( callback );
	}

	/**
	 * Remove a function added with addRecoveredCallback().
	 * @param {IDeviceRecoveredCallback} callback - The function.
	 */
	public static removeRecoveredCallback ( callback: IDeviceRecoveredCallback ) : void
	{
		Device.#recoveredCallbacks.delete ( callback );
	}

	/**
	 * Lose the device, for testing. It destroys the GPU device the way a real
	 * loss would, so the onLost function is called, and a new device is made
	 * if autoRecoverWhenDeviceLost is true. The reason given is "destroyed".
	 * For a real loss in Chrome, open "about:gpucrash" in another tab.
	 */
	public static simulateLost() : void
	{
		const instance = Device.#instance;
		if ( instance )
		{
			instance.#device?.destroy();
		}
	}

	/**
	 * Destroy the singleton instance, on purpose. The onLost function is not
	 * called, and no new device is made.
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
		instance.#destroyedOnPurpose = true;
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
	public static async isSupported() : Promise<boolean>
	{
		const { gpu } = globalThis.navigator;
		if ( !gpu )
		{
			return false;
		}

		try
		{
			const adapter = await gpu.requestAdapter();
			return ( !!adapter );
		}

		catch ( error )
		{
			console.error ( "Error while checking for WebGPU support:", error );
			return false;
		}
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
	 * Get the information about the adapter: its vendor, architecture, and
	 * so on.
	 * @returns {GPUAdapterInfo} The adapter information.
	 */
	public get adapterInfo() : GPUAdapterInfo
	{
		return this.#adapterInfo;
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
