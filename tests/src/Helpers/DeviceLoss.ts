///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Help with losing the device in tests.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../../../lib/src/Tools/Device";


///////////////////////////////////////////////////////////////////////////////
/**
 * Lose the device the way a real loss would, and wait until the library has
 * handled it. The library's handler was added when the device was made, so
 * it has run by the time this resolves.
 * @returns {Promise<GPUDeviceLostInfo>} Why the device was lost.
 */
///////////////////////////////////////////////////////////////////////////////

export const loseDevice = async () : Promise < GPUDeviceLostInfo > =>
{
	const lost = Device.instance.device.lost;
	Device.simulateLost();
	return await lost;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Put things back the way the other tests expect: no lost function, no
 * automatic recovery, and a device.
 * @returns {Promise<void>} Resolves when there is a device.
 */
///////////////////////////////////////////////////////////////////////////////

export const restoreDevice = async () : Promise < void > =>
{
	Device.onLost = null;
	Device.autoRecoverWhenDeviceLost = false;
	if ( !Device.valid )
	{
		await Device.recover();
	}
};
