///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Helpers for reference counting.
//
//	JavaScript has no destructors or assignment operators, so there is no
//	equivalent of a C++ smart pointer. Instead, the setters of the objects
//	that hold other objects do the counting, like a smart pointer's
//	assignment operator would. Users never call ref() or unref() themselves.
//
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
//
//	Anything that can be referenced.
//
///////////////////////////////////////////////////////////////////////////////

export interface IReferenced
{
	ref(): void;
	unref(): void;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Change what a holder refers to, like a smart pointer's assignment. Only a
 * holder that is itself in use counts its references, so pass false for
 * "inUse" otherwise. Reference the new one first, in case it is the same one.
 * @param {boolean} inUse - Whether the holder is in use.
 * @param {IReferenced | null | undefined} oldValue - What the holder referred to.
 * @param {IReferenced | null | undefined} newValue - What the holder will refer to.
 */
///////////////////////////////////////////////////////////////////////////////

export function replaceReference ( inUse: boolean, oldValue: ( IReferenced | null | undefined ), newValue: ( IReferenced | null | undefined ) ) : void
{
	if ( false === inUse )
	{
		return;
	}
	newValue?.ref();
	oldValue?.unref();
}
