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

export type IAnimationFunction = ( ( fraction: number ) => void );
export type ITimeoutHandle = number;


///////////////////////////////////////////////////////////////////////////////
/**
 * An animation class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Animation extends BaseClass
{
	#timeout: ( ITimeoutHandle | null ) = null;
	#fun: ( IAnimationFunction | null ) = null;
	#startTime = 0;
	#duration = 0;

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

		// Reset our members.
		this.reset();

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
	protected static getExponentialDecayStep ( fraction: number ) : number
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
		if ( null !== this.#timeout )
		{
			return;
		}

		// Set the animation function.
		this.#fun = fun;
	}

	/**
	 * Perform one animation step.
	 */
	protected step () : void
	{
		// Get the members.
		const fun = this.#fun;
		const startTime = this.#startTime;
		const duration = this.#duration;

		// Handle no animation function.
		if ( null === fun )
		{
			return;
		}

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
		fraction = Animation.getExponentialDecayStep ( fraction );

		// Call the animation function.
		fun ( fraction );

		// Request the next step.
		this.#timeout = globalThis.requestAnimationFrame ( () =>
		{
			this.step();
		} );
	}

	/**
	 * Start a navigation animation.
	 * @param {number} duration - The duration of the animation in milliseconds.
	 */
	public start ( duration: number ) : void
	{
		// Get the members.
		const fun = this.#fun;
		const timeout = this.#timeout;

		// Do nothing if we're already animating.
		if ( null !== timeout )
		{
			return;
		}

		// Handle no animation function.
		if ( null === fun )
		{
			return;
		}

		// Set the start time and duration.
		this.#startTime = Date.now();
		this.#duration = duration;

		// Start the animation.
		this.#timeout = globalThis.requestAnimationFrame ( () =>
		{
			this.step();
		} );
	}

	/**
	 * Stop any existing animation.
	 */
	public stop() : void
	{
		// Shortcuts.
		const timeout = this.#timeout;

		// Is there an animation to stop?
		if ( null !== timeout )
		{
			// Cancel the animation.
			globalThis.cancelAnimationFrame ( timeout );
		}

		// Reset the data.
		this.reset();
	}

	/**
	 * Reset the animation data.
	 */
	protected reset() : void
	{
		this.#timeout = null;
		this.#fun = null;
		this.#startTime = 0;
		this.#duration = 0;
	}
}
