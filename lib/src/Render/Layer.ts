///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Represents a layer. The depth buffer is cleared before rendering a layer.
//
///////////////////////////////////////////////////////////////////////////////

import { Base as BaseClass } from "../Base";
import { Bin } from "./Bin";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IBinMap = Map < number, Bin >;


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that represents a layer in the render graph.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Layer extends BaseClass
{
	#bins: IBinMap = new Map < number, Bin > ();

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		super();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Render.Layer";
	}

	/**
	 * Get the bin. Make it if we have to.
	 * @param {number} id - The bin ID.
	 * @returns {Bin} The bin.
	 */
	public getBin ( id: number ) : Bin
	{
		let bin: ( Bin | undefined ) = this.#bins.get ( id );
		if ( !bin )
		{
			bin = new Bin ();
			this.#bins.set ( id, bin );
		}
		return bin;
	}

	/**
	 * Call the given function for each bin in numerical order.
	 * @param {Function} func - The function to call.
	 */
	public forEachBin ( func: ( bin: Bin, index: number ) => void ) : void
	{
		const bins = Array.from ( this.#bins.entries() );
		bins.sort ( ( a, b ) =>
		{
			return ( a[0] - b[0] );
		} );
		bins.forEach ( ( [ index, bin ] ) =>
		{
			func ( bin, index )
		} );
	}

	/**
	 * Get the number of bins.
	 * @returns {number} The number of bins.
	 */
	public get numBins () : number
	{
		return this.#bins.size;
	}
}
