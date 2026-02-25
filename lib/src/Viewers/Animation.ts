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
import { clampNumber } from "../Tools";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IAnimationData
{
	timeout: ITimeoutHandle;
	fun: ( IAnimationFunction | null );
}

export type IAnimationFunction = ( ( fraction: number ) => void );
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
		fun: null,
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
	 * Return the exponential decay step.
	 * @param {number} fraction - The fraction in the range [0,1].
	 * @returns {number} The next step in the decay.
	 */
	protected getExponentialDecayStep ( fraction: number ) : number
	{
		fraction = clampNumber ( fraction, 0, 1 );
		return ( 1 - Math.exp ( -5 * fraction ) );
	}

	/**
	 * Set the navigation animation.
	 * @param {IAnimationFunction} fun - The function that does the animation step.
	 */
	public set ( fun: IAnimationFunction ) : void
	{
		// Do nothing if we're animating.
		if ( null !== this.#data.timeout )
		{
			return;
		}

		// Set the animation function.
		this.#data.fun = fun;
	}

	/**
	 * Start a navigation animation.
	 * @param {number} duration - The duration of the animation in milliseconds.
	 */
	public start ( duration: number ) : void
	{
		// Get the animation data.
		const data = this.#data;

		// Do nothing if we're already animating.
		if ( null !== data.timeout )
		{
			return;
		}

		// Get the animation function.
		const { fun } = data;

		// Handle no animation function.
		if ( null === fun )
		{
			return;
		}

		// Set the start time.
		const startTime = Date.now();

		// Local function to do one animation step.
		const step = () : void =>
		{
			// How much time has passed?
			const elapsedTime = Date.now() - startTime;

			// Has enough time passed?
			if ( elapsedTime >= duration )
			{
				// Call the animation function one last time.
				fun ( 1.0 );

				// Just reset the data.
				this.reset();

				// We're done.
				return;
			}

			// Get the fraction.
			let fraction = elapsedTime / duration;
			fraction = this.getExponentialDecayStep ( fraction );

			// Call the animation function.
			fun ( fraction );

			// Request the next frame.
			data.timeout = globalThis.requestAnimationFrame ( step );
		}

		// Start the animation.
		data.timeout = globalThis.requestAnimationFrame ( step );
	}

	/**
	 * Stop any existing animation.
	 */
	public stop() : void
	{
		// Shortcuts.
		const data = this.#data;
		const { timeout } = data;

		// Is there an animation to stop?
		if ( null === timeout )
		{
			return;
		}

		// Cancel the animation.
		globalThis.cancelAnimationFrame ( timeout );

		// Reset the data.
		this.reset();
	}

	/**
	 * Reset the animation data.
	 */
	protected reset() : void
	{
		this.#data = {
			timeout: null,
			fun: null,
		};
	}
}
