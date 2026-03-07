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
import type { IAnimationFunction } from "../Types";


///////////////////////////////////////////////////////////////////////////////
/**
 * An animation class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Animation extends BaseClass
{
	#fun: ( IAnimationFunction | null ) = null;
	#name: ( string | null ) = null;
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
		// Stop any existing animation and reset our members.
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
	protected static getExponentialDecayStep ( fraction: number ) : number
	{
		fraction = clampNumber ( fraction, 0, 1 );
		return ( 1 - Math.exp ( -5 * fraction ) );
	}

	/**
	 * Call the given function "in the next event cycle".
	 * https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
	 * @param {() => void} callback - The function to call after the timeout.
	 */
	protected static callSoon ( callback: () => void ) : void
	{
		// Do not use requestAnimationFrame() because the viewer's requestRender()
		// uses it. If we also use it here then the viewer may not get around to
		// rendering while it's animating.
		globalThis.setTimeout ( callback );
	}

	/**
	 * Perform one animation step.
	 */
	protected step () : void
	{
		// Shortcuts.
		const fun = this.#fun;

		// Handle no function. This could happen if the animation was stopped.
		if ( null === fun )
		{
			// console.warn ( `No animation function for '${this.#name}'` );
			return;
		}

		// Shortcuts.
		const startTime = this.#startTime;
		const duration = this.#duration;

		// How much time has passed?
		const elapsedTime = Date.now() - startTime;

		// Has enough time passed?
		if ( elapsedTime >= duration )
		{
			// Call the animation function one last time.
			fun ( 1.0, this );

			// console.log ( `Animation '${this.#name}' completed because enough time has passed` );

			// This will reset our members.
			this.stop();

			// We're done.
			return;
		}

		// Get the fraction.
		let fraction = elapsedTime / duration;
		fraction = Animation.getExponentialDecayStep ( fraction );

		// console.log ( `Animation '${this.#name}' step` );

		// Call the animation function.
		fun ( fraction, this );

		// Request the next step.
		Animation.callSoon ( () =>
		{
			this.step();
		} );
	}

	/**
	 * Set the navigation animation.
	 * @param {string} name - The name of the animation.
	 * @param {IAnimationFunction} fun - The function that does the animation step.
	 */
	public set ( name: string, fun: IAnimationFunction ) : void
	{
		// console.log ( `Setting animation function '${name}'` );

		this.#name = name;
		this.#fun = fun;
	}

	/**
	 * Start a navigation animation.
	 * @param {number} duration - The duration of the animation in milliseconds.
	 */
	public start ( duration: number ) : void
	{
		// console.log ( `Starting animation '${this.#name}'` );

		// Set the start time and duration.
		this.#startTime = Date.now();
		this.#duration = duration;

		// Start the animation.
		Animation.callSoon ( () =>
		{
			this.step();
		} );
	}

	/**
	 * Stop any existing animation.
	 */
	public stop() : void
	{
		// console.log ( `Stopping animation '${this.#name}'` );

		this.#fun = null;
		this.#name = null;
		this.#startTime = 0;
		this.#duration = 0;
	}

	/**
	 * Get the name of the current animation.
	 * @returns {string | null} The name of the current animation or null.
	 */
	public get name() : ( string | null )
	{
		return this.#name;
	}
}
