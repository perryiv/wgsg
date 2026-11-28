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
import { IRenderGraphInfo } from "../Types";
import { Bin } from "./Bin";
import { DEVELOPER_BUILD } from "../Tools/Environment";
import type { IBinSort } from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IBinMap = Map < number, Bin >;

// The bins whose states disagreed on the sort, so each is said only once.
const warned = new Set < string > ();


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
	 * @param {IRenderGraphInfo} info - The render graph info.
	 * @param {number} id - The bin ID.
	 * @param {IBinSort | null} [sort] - How a new bin sorts its shapes by
	 * depth. An existing bin keeps its own. The default is null, which is not
	 * at all.
	 * @returns {Bin} The bin.
	 */
	public getBin ( info: IRenderGraphInfo, id: Readonly<number>, sort: ( IBinSort | null ) = null ) : Bin
	{
		let bin: ( Bin | undefined ) = this.#bins.get ( id );
		if ( !bin )
		{
			bin = new Bin ( sort );
			this.#bins.set ( id, bin );
			info.numBins++;
		}

		// In developer builds, say when states in the same bin disagree.
		else if ( DEVELOPER_BUILD && ( sort !== bin.sort ) )
		{
			const describe = ( mode: ( IBinSort | null ) ) : string => ( mode ? `sorted ${mode}` : "not sorted by depth" );
			const key = `${id} ${bin.sort} ${sort}`;
			if ( !warned.has ( key ) )
			{
				warned.add ( key );
				console.warn ( `Bin ${id} is ${describe ( bin.sort )}, so a state that wants it ${describe ( sort )} is not used` );
			}
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
