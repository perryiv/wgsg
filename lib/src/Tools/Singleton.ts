///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helper for classes that have one instance. The class keeps its own base
//	class and holds the helper in a private static field:
//
//	export class MyShader extends BaseClass
//	{
//		static readonly #singleton = makeSingleton ( () => new MyShader() );
//
//		public static get instance () : MyShader
//		{
//			return MyShader.#singleton.get();
//		}
//
//		public static destroy () : void
//		{
//			MyShader.#singleton.destroy();
//		}
//	}
//
//	The function that makes the instance is written in the class, so the
//	constructor can be protected, and nothing else can make another one.
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ISingleton < T >
{
	// Get the instance, making it the first time.
	get: () => T;

	// Destroy the instance, if there is one. The next get() makes a new one.
	destroy: () => void;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the helper that keeps a class's one instance.
 * @param {Function} create - Makes the instance. It's called the first time
 * the instance is needed, and again after it's destroyed.
 * @returns {ISingleton} The helper.
 */
///////////////////////////////////////////////////////////////////////////////

export const makeSingleton = < T extends { destroy: () => void } > ( create: () => T ) : ISingleton < T > =>
{
	let instance: ( T | null ) = null;
	return {
		get: () : T =>
		{
			instance ??= create();
			return instance;
		},
		destroy: () : void =>
		{
			instance?.destroy();
			instance = null;
		},
	};
};
