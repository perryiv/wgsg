///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	The samplers, shared by the textures with the same settings. They're made
//	when first needed, and again after the device is lost.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools/Device";
import type { ISamplerSettings } from "./Texture";


///////////////////////////////////////////////////////////////////////////////
//
//	The samplers made with the current device, by their settings.
//
///////////////////////////////////////////////////////////////////////////////

const samplers = new Map < string, GPUSampler > ();
let samplersDevice = 0;


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the sampler with the settings, making it if we have to.
 * @param {ISamplerSettings} settings - The settings.
 * @returns {GPUSampler} The sampler.
 */
///////////////////////////////////////////////////////////////////////////////

export const getSampler = ( settings: Readonly<ISamplerSettings> ) : GPUSampler =>
{
	// Samplers from a device that was lost can't be used with the new one.
	const { id, device } = Device.instance;
	if ( samplersDevice !== id )
	{
		samplers.clear();
		samplersDevice = id;
	}

	// Make it if we have to.
	const { wrapU, wrapV, magFilter, minFilter } = settings;
	const key = `${wrapU} ${wrapV} ${magFilter} ${minFilter}`;
	let sampler = samplers.get ( key );
	if ( !sampler )
	{
		sampler = device.createSampler ( {
			label: `Sampler ${key}`,
			addressModeU: wrapU,
			addressModeV: wrapV,
			magFilter,
			minFilter,
		} );
		samplers.set ( key, sampler );
	}
	return sampler;
};
