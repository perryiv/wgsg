///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Singleton class. CoPilot wrote this. I changed very little.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class Singleton
{
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	static #instances = new Map < Function, unknown > ();

	/**
	 * Construct the class.
	 * @protected
	 */
	protected constructor()
	{
		// Nothing to do.
	}

	/**
	 * Get the singleton instance of the class.
	 * @param {T} this - The class type.
	 * @returns {T} The singleton instance.
	 */
	public static getInstance < T > ( this: new () => T ) : T
	{
		let instance = ( Singleton.#instances.get ( this ) as ( T | undefined ) );

		if ( !instance )
		{
			instance = new this();
			Singleton.#instances.set ( this, instance );
		}

		return instance;
	}

	/**
	 * Destroy the singleton instance of the class.
	 * @param {T} this - The class type.
	 */
	public static destroyInstance < T > ( this: new () => T ): void
	{
		const instance = ( Singleton.#instances.get ( this ) as ( T | undefined ) );

		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
		if ( instance && ( typeof ( ( instance as any ).destroy ) === "function" ) )
		{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			( instance as any ).destroy();
		}

		Singleton.#instances.delete ( this );
	}
}
