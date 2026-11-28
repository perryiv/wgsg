///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Texture set attribute class.
//
//	The textures of a material, each in its named slot:
//	- Diffuse: its colors multiply the material's ambient and diffuse colors,
//	  like vertex colors do. Its alpha multiplies the material's alpha.
//	- Emissive: its colors multiply the material's emission, so that a shape
//	  can glow only in places, like the lights of a car.
//
//	The shapes need texture coordinates (Geometry.texCoords). Shapes without
//	them use the texture's top-left pixel.
//
//	While this attribute is used, it uses its textures, so that a texture's
//	GPU memory is freed when nothing uses it.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute as BaseClass, IAttributeApplyInput } from "../Attribute";
import { replaceReference } from "../../../Base/References";
import type { Texture } from "../../../Textures/Texture";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ITextureSetInput
{
	diffuse?: ( Texture | null );
	emissive?: ( Texture | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Texture set attribute class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class TextureSet extends BaseClass
{
	#diffuse: ( Texture | null ) = null;
	#emissive: ( Texture | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {ITextureSetInput} [input] - The textures.
	 */
	public constructor ( input?: Readonly<ITextureSetInput> )
	{
		super();
		this.#diffuse = ( input?.diffuse ?? null );
		this.#emissive = ( input?.emissive ?? null );
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public static override getClassName() : string
	{
		return "Scene.State.Attributes.TextureSet";
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return TextureSet.getClassName();
	}

	/**
	 * Get the diffuse texture.
	 * @returns {Texture | null} The texture, if any.
	 */
	public get diffuse () : ( Texture | null )
	{
		return this.#diffuse;
	}

	/**
	 * Set the diffuse texture.
	 * @param {Texture | null} texture - The texture, or null for none.
	 */
	public set diffuse ( texture: ( Texture | null ) )
	{
		// If this is in use then count the new texture instead of the old one.
		replaceReference ( ( this.refCount > 0 ), this.#diffuse, texture );
		this.#diffuse = texture;
	}

	/**
	 * Get the emissive texture.
	 * @returns {Texture | null} The texture, if any.
	 */
	public get emissive () : ( Texture | null )
	{
		return this.#emissive;
	}

	/**
	 * Set the emissive texture.
	 * @param {Texture | null} texture - The texture, or null for none.
	 */
	public set emissive ( texture: ( Texture | null ) )
	{
		// If this is in use then count the new texture instead of the old one.
		replaceReference ( ( this.refCount > 0 ), this.#emissive, texture );
		this.#emissive = texture;
	}

	/**
	 * Called when this starts being used. Its textures are now used too.
	 */
	protected override onFirstRef() : void
	{
		this.#diffuse?.ref();
		this.#emissive?.ref();
	}

	/**
	 * Called when this is no longer used. Neither are its textures, which
	 * frees their GPU memory if nothing else uses them.
	 */
	protected override onLastUnref() : void
	{
		this.#diffuse?.unref();
		this.#emissive?.unref();
	}

	/**
	 * Return the string representation of this attribute. It has the ids of
	 * the textures, so that states with different textures are told apart.
	 * @returns {string} The string representation of this attribute.
	 */
	public override toString() : string
	{
		return `${this.type} diffuse ${this.#diffuse?.id ?? "none"} emissive ${this.#emissive?.id ?? "none"}`;
	}

	/**
	 * Give the shader the textures, if it has a place for them.
	 * @param {IAttributeApplyInput} input - The input for applying the state attributes.
	 */
	public override apply ( input: IAttributeApplyInput ) : void
	{
		const { shader } = input;
		if ( "diffuseTexture" in shader )
		{
			shader.diffuseTexture = this.#diffuse;
		}
		if ( "emissiveTexture" in shader )
		{
			shader.emissiveTexture = this.#emissive;
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
			diffuse: ( this.#diffuse?.id ?? null ),
			emissive: ( this.#emissive?.id ?? null ),
		};
	}
}
