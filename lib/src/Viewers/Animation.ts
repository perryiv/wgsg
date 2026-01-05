///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Class that helps perform an animation.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base/Base";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IAnimationData
{
	startTime: number;
	duration: number;
	timeout: ITimeoutHandle;
}

export type IAnimationFunction = ( () => void );
export type ITimeoutHandle = ( number | null );


///////////////////////////////////////////////////////////////////////////////
/**
 * An animation class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Animation extends BaseClass
{
	#data: IAnimationData = {
		startTime: 0,
		duration: 0,
		timeout: null,
	};

	/**
	 * Construct the class.
	 * @class
	 */
	constructor ()
	{
		super();
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		// Stop any existing animation.
		this.stop();

		// Call the base class function.
		super.destroy();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Viewers.Animation";
	}

	/**
	 * Get the next step in an exponential decay.
	 * @param {number} timeElapsed - The time elapsed since the start of the animation.
	 * @returns {number} The next step in the decay.
	 */
	protected getExponentialDecayStep ( timeElapsed: number ) : number
	{
		// Shortcuts.
		const { duration } = this.#data;

		// Compute the normalized time.
		const t = Math.min ( timeElapsed / duration, 1 );

		// Return the exponential decay step.
		return 1 - Math.exp ( -5 * t );
	}

	/**
	 * Start a navigation animation.
	 * @param {IAnimationFunction} fun - The function that does the animation step.
	 * @param {number} duration - The duration of the animation in milliseconds.
	 */
	public start ( fun: IAnimationFunction, duration = 2000 ) : void
	{
		// Stop any existing animation.
		this.stop();

		// Local function to do one animation step.
		const step = () : void =>
		{
			// Call the animation function.
			fun();

			// Request the next frame.
			this.#data.timeout = globalThis.requestAnimationFrame ( step );
		}

		// Start the animation.
		this.#data = {
			startTime: Date.now(),
			duration,
			timeout: globalThis.requestAnimationFrame ( step )
		};
	}

	/**
	 * Stop any existing animation.
	 */
	public stop() : void
	{
		// Shortcuts.
		const { timeout } = this.#data;

		// Is there an animation to stop?
		if ( null === timeout )
		{
			return;
		}

		// Cancel the animation.
		globalThis.cancelAnimationFrame ( timeout );

		// Reset the data.
		this.#data = {
			startTime: 0,
			duration: 0,
			timeout: null,
		};
	}
}
