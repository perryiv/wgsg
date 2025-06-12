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

import { IMatrix44, IViewport } from "../Types";
import { isPositiveFiniteNumber } from "../Math";
import { makeIdentity } from "../Tools";
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
	 * @class
	 * @param {IPerspectiveData | undefined} input - Optional input.
	 */
	constructor ( input?: IPerspectiveData )
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
	 * @returns {string} The class name.
	 */
	public getClassName() : string
	{
		return "Projections.Perspective";
	}

	/**
	 * Set the members from the given data.
	 * @param {IPerspectiveData} input - The perspective data. Any of the
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
		// If the property is undefined then we use the existing value.
		const fov    = ( ( "undefined" !== typeof ( input.fov    ) ) ? input.fov    : this.#fov    );
		const aspect = ( ( "undefined" !== typeof ( input.aspect ) ) ? input.aspect : this.#aspect );
		const near   = ( ( "undefined" !== typeof ( input.near   ) ) ? input.near   : this.#near   );
		const far    = ( ( "undefined" !== typeof ( input.far    ) ) ? input.far    : this.#far    );

		// When we get to here TypeScript thinks that all the values are numbers.
		// Do the following run-time checks anyway because this function is
		// supposed to be all-or-nothing. It sets them all, or none of them.
		if ( "number" !== ( typeof ( fov ) ) )
		{
			throw new Error ( `Invalid field-of-view: ${fov}` );
		}
		if ( "number" !== ( typeof ( aspect ) ) )
		{
			throw new Error ( `Invalid aspect ratio: ${aspect}` );
		}
		if ( "number" !== ( typeof ( near ) ) )
		{
			throw new Error ( `Invalid near distance: ${near}` );
		}
		if ( "number" !== ( typeof ( far ) ) )
		{
			throw new Error ( `Invalid far distance: ${far}` );
		}

		// When we get to here make sure the numbers are all positive.
		if ( fov <= 0 )
		{
			throw new Error ( `Invalid field-of-view: ${fov}` );
		}
		if ( aspect <= 0 )
		{
			throw new Error ( `Invalid aspect ratio: ${aspect}` );
		}
		if ( near <= 0 )
		{
			throw new Error ( `Invalid near distance: ${near}` );
		}
		if ( far <= 0 )
		{
			throw new Error ( `Invalid far distance: ${far}` );
		}

		// Make sure near is closer than far.
		if ( far <= near )
		{
			throw new Error ( `Invalid distances when setting perspective members, near: ${near}, far: ${far}` );
		}

		// If we get to here then set all the values.
		// We did so much checking above that we don't need to use the setter
		// functions, which have even more error checking.
		this.#fov = fov;
		this.#aspect = aspect;
		this.#near = near;
		this.#far = far;
	}

	/**
	 * Return the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
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
		const answer: IMatrix44 = makeIdentity();

		// Write the perspective matrix to the answer.
		mat4.perspective ( answer, fov, aspect, near, far );

		// Return the new matrix.
		return answer;
	}

	/**
	 * Get the field-of-view.
	 * @returns {number} The field-of-view.
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
		if ( false === isPositiveFiniteNumber ( fov ) )
		{
			throw new Error ( `Given field-of-view '${fov}' is not a positive finite number` );
		}

		this.#fov = fov;
	}

	/**
	 * Get the aspect ratio.
	 * @returns {number} The aspect ratio.
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
		if ( false === isPositiveFiniteNumber ( aspect ) )
		{
			throw new Error ( `Given aspect ratio '${aspect}' is not a positive finite number` );
		}

		this.#aspect = aspect;
	}

	/**
	 * Get the near distance.
	 * @returns {number} The near distance.
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
		if ( false === isPositiveFiniteNumber ( near ) )
		{
			throw new Error ( `Given near distance '${near}' is not a positive finite number` );
		}

		this.#near = near;
	}

	/**
	 * Get the far distance.
	 * @returns {number} The far distance.
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
		if ( false === isPositiveFiniteNumber ( far ) )
		{
			throw new Error ( `Given far distance '${far}' is not a positive finite number` );
		}

		this.#far = far;
	}

	/**
	 * Let the projection know about the new viewport.
	 * @param {IViewport} vp - The new viewport.
	 */
	public set viewport ( vp: IViewport )
	{
		const { width, height } = vp;

		if ( false === isPositiveFiniteNumber ( width ) )
		{
			throw new Error ( `Given viewport width '${width}' is not a positive finite number` );
		}

		if ( false === isPositiveFiniteNumber ( height ) )
		{
			throw new Error ( `Given viewport height '${height}' is not a positive finite number` );
		}

		this.aspect = ( width / height );
	}
}
