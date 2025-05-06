///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Perspective projection class.
//
///////////////////////////////////////////////////////////////////////////////

import { IDENTITY_MATRIX } from "../Tools";
import { IMatrix44 } from "../Types";
import { mat4 } from "gl-matrix";
import { Projection } from "./Projection";



///////////////////////////////////////////////////////////////////////////////
//
//	The data that defines a perspective projection.
//
///////////////////////////////////////////////////////////////////////////////

export interface IPerspectiveData
{
	fov?: number;
	aspect?: number;
	near?: number;
	far?: number;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Perspective projection class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Perspective extends Projection
{
	#fov = 45;
	#aspect = 1;
	#near = 1;
	#far = 10000;

	/**
	 * Construct the class.
	 * @constructor
	 */
	constructor ( input?: ( IPerspectiveData | null ) )
	{
		// Call this first.
		super();

		// Set our members from the input.
		if ( input )
		{
			this.setFrom ( input );
		}
	}

	/**
	 * Return the class name.
	 * @return {string} The class name.
	 */
	public getClassName() : string
	{
		return "Perspective";
	}

	/**
	 * Set the members from the given data.
	 * @param {IPerspectiveData} data - The perspective data. Any of the
	 * properties can be missing. However, if they are included then they have
	 * to be valid. Otherwise, an exception is thrown.
	 */
	public setFrom ( input: IPerspectiveData )
	{
		// Handle no input.
		if ( !input )
		{
			return;
		}

		// Initialize the new values.
		const fov    = ( ( "fov"    in input ) ? input.fov    : this.#fov    );
		const aspect = ( ( "aspect" in input ) ? input.aspect : this.#aspect );
		const near   = ( ( "near"   in input ) ? input.near   : this.#near   );
		const far    = ( ( "far"    in input ) ? input.far    : this.#far    );

		// Now that they're all set either with new values or our existing ones,
		// make sure they're valid.
		if ( ( "number" !== ( typeof fov ) ) || ( fov <= 0 ) )
		{
			throw new Error ( `Invalid field-of-view: ${fov}` );
		}
		if ( ( "number" !== ( typeof aspect ) ) || ( aspect <= 0 ) )
		{
			throw new Error ( `Invalid aspect ratio: ${aspect}` );
		}
		if ( ( "number" !== ( typeof near ) ) || ( near <= 0 ) )
		{
			throw new Error ( `Invalid near distance: ${near}` );
		}
		if ( ( "number" !== ( typeof far ) ) || ( far <= 0 ) )
		{
			throw new Error ( `Invalid far distance: ${far}` );
		}

		// Make sure near is closer than far.
		if ( far <= near)
		{
			throw new Error ( `Invalid distances when setting perspective members, near: ${near}, far: ${far}` );
		}

		// If we get to here then set all the values.
		this.#fov = fov;
		this.#aspect = aspect;
		this.#near = near;
		this.#far = far;
	}

	/**
	 * Return the projection matrix.
	 * @return {IMatrix44} The projection matrix.
	 */
	public get matrix() : IMatrix44
	{
		// Shortcuts.
		const fov = this.#fov;
		const aspect = this.#aspect;
		const near = this.#near;
		const far = this.#far;

		// Make sure near is closer than far.
		if ( near >= far )
		{
			throw new Error ( `Invalid distances when making perspective matrix, near: ${near}, far: ${far}` );
		}

		// Initialize the answer.
		const answer: IMatrix44 = [ ...IDENTITY_MATRIX ];

		// Write the perspective matrix to the answer.
		mat4.perspective ( answer, fov, aspect, near, far );

		// Return the new matrix.
		return answer;
	}

	/**
	 * Get the field-of-view.
	 * @return {number} The field-of-view.
	 */
	public get fov() : number
	{
		return this.#fov;
	}

	/**
	 * Set the field-of-view.
	 * @param {number} fov - The field-of-view.
	 */
	public set fov ( fov: number )
	{
		if ( ( "number" === ( typeof fov ) ) && ( fov > 0 ) )
		{
			this.fov = fov;
		}
	}

	/**
	 * Get the aspect ratio.
	 * @return {number} The aspect ratio.
	 */
	public get aspect() : number
	{
		return this.#aspect;
	}

	/**
	 * Set the aspect ratio.
	 * @param {number} aspect - The aspect ratio.
	 */
	public set aspect ( aspect: number )
	{
		if ( ( "number" === ( typeof aspect ) ) && ( aspect > 0 ) )
		{
			this.aspect = aspect;
		}
	}

	/**
	 * Get the near distance.
	 * @return {number} The near distance.
	 */
	public get near() : number
	{
		return this.#near;
	}

	/**
	 * Set the near distance.
	 * @param {number} near - The near distance.
	 */
	public set near ( near: number )
	{
		if ( ( "number" === ( typeof near ) ) && ( near > 0 ) )
		{
			this.near = near;
		}
	}

	/**
	 * Get the far distance.
	 * @return {number} The far distance.
	 */
	public get far() : number
	{
		return this.#far;
	}

	/**
	 * Set the far distance.
	 * @param {number} far - The far distance.
	 */
	public set far ( far: number )
	{
		if ( ( "number" === ( typeof far ) ) && ( far > 0 ) )
		{
			this.far = far;
		}
	}
}
