///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Material attribute class.
//
//	The colors of a lit surface, like OpenGL's glMaterial, with the same
//	defaults:
//	- Ambient: the color under the ambient light.
//	- Diffuse: the color under the light. Its alpha is the surface's alpha.
//	- Specular: the color of the highlights.
//	- Emission: the light the surface gives off itself.
//	- Shininess: how small the highlights are, from 0 to 128.
//	- Alpha mask: when it's on, a pixel whose alpha is below the alpha cutoff
//	  isn't drawn, and the others are drawn opaque, like the leaves of a
//	  plant drawn on a square. It's off by default.
//
//	The colors are linear: 0.5 is half the light, which is drawn as 188 of
//	255, because the screen's colors are sRGB. The same values are used for
//	both sides. Vertex colors multiply the ambient and diffuse colors. Shaders
//	without lighting use the diffuse color.
//
//	The Color attribute is a shortcut that sets only the diffuse color. If a
//	state has both, the material is used.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";
import { vec4 } from "gl-matrix";
import type { IVector4 } from "../../../Types";
import {
	DEFAULT_ALPHA_CUTOFF,
	DEFAULT_AMBIENT,
	DEFAULT_DIFFUSE,
	DEFAULT_EMISSION,
	DEFAULT_SHININESS,
	DEFAULT_SPECULAR,
	MAX_SHININESS,
} from "../../../Tools/Constants";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IMaterialInput
{
	ambient?: Readonly<IVector4>;
	diffuse?: Readonly<IVector4>;
	specular?: Readonly<IVector4>;
	emission?: Readonly<IVector4>;
	shininess?: number;
	alphaMask?: boolean;
	alphaCutoff?: number;
}



///////////////////////////////////////////////////////////////////////////////
/**
 * Material attribute class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Material extends BaseClass
{
	#ambient: IVector4 = [ ...DEFAULT_AMBIENT ];
	#diffuse: IVector4 = [ ...DEFAULT_DIFFUSE ];
	#specular: IVector4 = [ ...DEFAULT_SPECULAR ];
	#emission: IVector4 = [ ...DEFAULT_EMISSION ];
	#shininess = DEFAULT_SHININESS;
	#alphaMask = false;
	#alphaCutoff = DEFAULT_ALPHA_CUTOFF;

	/**
	 * Construct the class. What's left out has the default value.
	 * @class
	 * @param {IMaterialInput} [input] - The colors and shininess.
	 */
	public constructor ( input?: Readonly<IMaterialInput> )
	{
		super();
		if ( input?.ambient )
		{
			this.ambient = input.ambient;
		}
		if ( input?.diffuse )
		{
			this.diffuse = input.diffuse;
		}
		if ( input?.specular )
		{
			this.specular = input.specular;
		}
		if ( input?.emission )
		{
			this.emission = input.emission;
		}
		if ( undefined !== input?.shininess )
		{
			this.shininess = input.shininess;
		}
		if ( undefined !== input?.alphaMask )
		{
			this.#alphaMask = input.alphaMask;
		}
		if ( undefined !== input?.alphaCutoff )
		{
			this.alphaCutoff = input.alphaCutoff;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.Material";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return Material.getClassName();
	}

	/**
	 * Get the ambient color.
	 * @returns {IVector4} The color.
	 */
	public get ambient () : Readonly<IVector4>
	{
		return this.#ambient;
	}

	/**
	 * Set the ambient color.
	 * @param {IVector4} color - The color.
	 */
	public set ambient ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#ambient, color );
	}

	/**
	 * Get the diffuse color.
	 * @returns {IVector4} The color.
	 */
	public get diffuse () : Readonly<IVector4>
	{
		return this.#diffuse;
	}

	/**
	 * Set the diffuse color.
	 * @param {IVector4} color - The color.
	 */
	public set diffuse ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#diffuse, color );
	}

	/**
	 * Get the specular color.
	 * @returns {IVector4} The color.
	 */
	public get specular () : Readonly<IVector4>
	{
		return this.#specular;
	}

	/**
	 * Set the specular color.
	 * @param {IVector4} color - The color.
	 */
	public set specular ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#specular, color );
	}

	/**
	 * Get the emission color.
	 * @returns {IVector4} The color.
	 */
	public get emission () : Readonly<IVector4>
	{
		return this.#emission;
	}

	/**
	 * Set the emission color.
	 * @param {IVector4} color - The color.
	 */
	public set emission ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#emission, color );
	}

	/**
	 * Get the shininess.
	 * @returns {number} The shininess, from 0 to 128.
	 */
	public get shininess () : number
	{
		return this.#shininess;
	}

	/**
	 * Set the shininess.
	 * @param {number} shininess - The shininess, from 0 to 128.
	 */
	public set shininess ( shininess: number )
	{
		if ( !( ( shininess >= 0 ) && ( shininess <= MAX_SHININESS ) ) )
		{
			throw new Error ( `Shininess ${shininess} is not from 0 to ${MAX_SHININESS}` );
		}
		this.#shininess = shininess;
	}

	/**
	 * See if the alpha mask is on.
	 * @returns {boolean} True if pixels whose alpha is below the cutoff aren't drawn.
	 */
	public get alphaMask () : boolean
	{
		return this.#alphaMask;
	}

	/**
	 * Turn the alpha mask on or off.
	 * @param {boolean} alphaMask - True if pixels whose alpha is below the
	 * cutoff aren't drawn, and the others are drawn opaque.
	 */
	public set alphaMask ( alphaMask: boolean )
	{
		this.#alphaMask = alphaMask;
	}

	/**
	 * Get the alpha cutoff, used when the alpha mask is on.
	 * @returns {number} The cutoff, from 0 to 1.
	 */
	public get alphaCutoff () : number
	{
		return this.#alphaCutoff;
	}

	/**
	 * Set the alpha cutoff, used when the alpha mask is on.
	 * @param {number} cutoff - The cutoff, from 0 to 1.
	 */
	public set alphaCutoff ( cutoff: number )
	{
		if ( !( ( cutoff >= 0 ) && ( cutoff <= 1 ) ) )
		{
			throw new Error ( `Alpha cutoff ${cutoff} is not from 0 to 1` );
		}
		this.#alphaCutoff = cutoff;
	}

	/**
	 * Return the string representation of this attribute.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		const a = this.#ambient.join ( ", " );
		const d = this.#diffuse.join ( ", " );
		const s = this.#specular.join ( ", " );
		const e = this.#emission.join ( ", " );
		const mask = ( this.#alphaMask ? ` alpha cutoff ${this.#alphaCutoff}` : "" );
		return `${this.type} ambient [${a}] diffuse [${d}] specular [${s}] emission [${e}] shininess ${this.#shininess}${mask}`;
	}

	/**
	 * Give the shader the values it can use.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		const { shader } = input;
		if ( "ambient" in shader )
		{
			shader.ambient = this.#ambient;
		}
		if ( "diffuse" in shader )
		{
			shader.diffuse = this.#diffuse;
		}
		if ( "specular" in shader )
		{
			shader.specular = this.#specular;
		}
		if ( "emission" in shader )
		{
			shader.emission = this.#emission;
		}
		if ( "shininess" in shader )
		{
			shader.shininess = this.#shininess;
		}
		if ( "alphaCutoff" in shader )
		{
			shader.alphaCutoff = ( this.#alphaMask ? this.#alphaCutoff : null );
		}
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		return {
			...super.toJSON(),
			ambient: this.#ambient,
			diffuse: this.#diffuse,
			specular: this.#specular,
			emission: this.#emission,
			shininess: this.#shininess,
			alphaMask: this.#alphaMask,
			alphaCutoff: this.#alphaCutoff,
		};
	}
}
