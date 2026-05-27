///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Color class.
//
///////////////////////////////////////////////////////////////////////////////

import { clampNumber } from "../Math/Functions";
import type { IVector4 } from "../Types";


//////////////////////////////////////////////////////////////////////////
/**
 * Color class.
 * @class
 */
//////////////////////////////////////////////////////////////////////////

export class Color
{
	static #black:       Readonly<IVector4> = [ 0.0, 0.0, 0.0, 1.0 ];
	static #blue:        Readonly<IVector4> = [ 0.0, 0.0, 1.0, 1.0 ];
	static #gray:        Readonly<IVector4> = [ 0.5, 0.5, 0.5, 1.0 ];
	static #green:       Readonly<IVector4> = [ 0.0, 1.0, 0.0, 1.0 ];
	static #magenta:     Readonly<IVector4> = [ 1.0, 0.0, 1.0, 1.0 ];
	static #orange:      Readonly<IVector4> = [ 1.0, 0.5, 0.0, 1.0 ];
	static #red:         Readonly<IVector4> = [ 1.0, 0.0, 0.0, 1.0 ];
	static #transparent: Readonly<IVector4> = [ 0.0, 0.0, 0.0, 0.0 ];
	static #white:       Readonly<IVector4> = [ 1.0, 1.0, 1.0, 1.0 ];
	static #yellow:      Readonly<IVector4> = [ 1.0, 1.0, 0.0, 1.0 ];

	/**
	 * Make a random color.
	 * @param {number} low - The lower bound for the color components.
	 * @param {number} high - The upper bound for the color components.
	 * @returns {IVector4} A random color.
	 */
	public static makeRandomColor ( low = 0.2, high = 0.8 ): IVector4
	{
		const delta = ( high - low );
		return [
			( low + delta * Math.random() ),
			( low + delta * Math.random() ),
			( low + delta * Math.random() ),
			1.0
		];
	}

	/**
	 * Get a random color.
	 * @returns {IVector4} A random color.
	 */
	public static get random(): IVector4
	{
		return this.makeRandomColor();
	}

	/**
	 * Return the pre-multiplied color.
	 * @param {IVector4} color - The color to pre-multiply.
	 * @returns {IVector4} The pre-multiplied color.
	 */
	public static preMultiply ( color: Readonly<IVector4> ): IVector4
	{
		const a = color[3];
		return [
			color[0] * a,
			color[1] * a,
			color[2] * a,
			a
		];
	}

	/**
	 * Return the color as a CSS string.
	 * @param {IVector4} color - The color to convert.
	 * @returns {string} The color as a CSS string.
	 */
	public static toCSS ( color: Readonly<IVector4> ): string
	{
		const r = Math.round ( ( clampNumber ( color[0], 0, 1 ) ) * 255 );
		const g = Math.round ( ( clampNumber ( color[1], 0, 1 ) ) * 255 );
		const b = Math.round ( ( clampNumber ( color[2], 0, 1 ) ) * 255 );
		const a = clampNumber ( color[3], 0, 1 );
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	/**
	 * Return the color as a hex string.
	 * @param {IVector4} color - The color to convert.
	 * @returns {string} The color as a hex string.
	 */
	public static toHex ( color: Readonly<IVector4> ): string
	{
		const r = Math.round ( ( clampNumber ( color[0], 0, 1 ) ) * 255 );
		const g = Math.round ( ( clampNumber ( color[1], 0, 1 ) ) * 255 );
		const b = Math.round ( ( clampNumber ( color[2], 0, 1 ) ) * 255 );
		const a = Math.round ( ( clampNumber ( color[3], 0, 1 ) ) * 255 );
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a.toString(16).padStart(2, "0")}`;
	}

	/**
	 * Convert a hex string to a color.
	 * @param {string} hex - The hex string to convert.
	 * @returns {Readonly<IVector4>} The color as an IVector4.
	 */
	public static fromHex ( hex: string ): Readonly<IVector4>
	{
		if ( hex.startsWith ( "#" ) )
		{
			hex = hex.slice ( 1 );
		}

		else if ( hex.startsWith ( "0x" ) )
		{
			hex = hex.slice ( 2 );
		}

		if ( !/^[0-9a-fA-F]+$/.test ( hex ) )
		{
			throw new Error ( `Invalid hex color: ${hex}` );
		}

		switch ( hex.length )
		{
			case 3: // #rgb
			{
				const r = parseInt ( hex[0] + hex[0], 16 ) / 255;
				const g = parseInt ( hex[1] + hex[1], 16 ) / 255;
				const b = parseInt ( hex[2] + hex[2], 16 ) / 255;
				return [ r, g, b, 1.0 ];
			}
			case 4: // #rgba
			{
				const r = parseInt ( hex[0] + hex[0], 16 ) / 255;
				const g = parseInt ( hex[1] + hex[1], 16 ) / 255;
				const b = parseInt ( hex[2] + hex[2], 16 ) / 255;
				const a = parseInt ( hex[3] + hex[3], 16 ) / 255;
				return [ r, g, b, a ];
			}
			case 6: // #rrggbb
			{
				const r = parseInt ( hex.slice ( 0, 2 ), 16 ) / 255;
				const g = parseInt ( hex.slice ( 2, 4 ), 16 ) / 255;
				const b = parseInt ( hex.slice ( 4, 6 ), 16 ) / 255;
				return [ r, g, b, 1.0 ];
			}
			case 8: // #rrggbbaa
			{
				const r = parseInt ( hex.slice ( 0, 2 ), 16 ) / 255;
				const g = parseInt ( hex.slice ( 2, 4 ), 16 ) / 255;
				const b = parseInt ( hex.slice ( 4, 6 ), 16 ) / 255;
				const a = parseInt ( hex.slice ( 6, 8 ), 16 ) / 255;
				return [ r, g, b, a ];
			}
			default:
			{
				throw new Error ( `Invalid hex color: ${hex}` );
			}
		}
	}

	/**
	 * Convert a color from RGBA to HSLA.
	 * @param {IVector4} color - The RGBA color to convert.
	 * @returns {IVector4} The color in HSLA format.
	 */
	public static rgba_to_hsla ( color: Readonly<IVector4> ): IVector4
	{
		const r = color[0];
		const g = color[1];
		const b = color[2];
		const a = color[3];

		const max = Math.max ( r, g, b );
		const min = Math.min ( r, g, b );
		const delta = max - min;

		let h = 0;
		let s = 0;
		const l = ( max + min ) / 2;

		if ( delta !== 0 )
		{
			s = delta / ( 1 - Math.abs ( 2 * l - 1 ) );

			switch ( max )
			{
				case r:
					h = ( ( g - b ) / delta ) % 6;
					break;
				case g:
					h = ( b - r ) / delta + 2;
					break;
				case b:
					h = ( r - g ) / delta + 4;
					break;
			}

			h *= 60;
			if ( h < 0 )
			{
				h += 360;
			}
		}

		return [ h, s, l, a ];
	}

	/**
	 * Convert a color from HSLA to RGBA.
	 * @param {IVector4} color - The HSLA color to convert.
	 * @returns {IVector4} The color in RGBA format.
	 */
	public static hsla_to_rgba ( color: Readonly<IVector4> ): IVector4
	{
		const h = color[0];
		const s = color[1];
		const l = color[2];
		const a = color[3];

		const c = ( 1 - Math.abs ( 2 * l - 1 ) ) * s;
		const x = c * ( 1 - Math.abs ( ( h / 60 ) % 2 - 1 ) );
		const m = l - c / 2;

		let r = 0;
		let g = 0;
		let b = 0;

		if ( h < 60 )
		{
			r = c;
			g = x;
			b = 0;
		}
		else if ( h < 120 )
		{
			r = x;
			g = c;
			b = 0;
		}
		else if ( h < 180 )
		{
			r = 0;
			g = c;
			b = x;
		}
		else if ( h < 240 )
		{
			r = 0;
			g = x;
			b = c;
		}
		else if ( h < 300 )
		{
			r = x;
			g = 0;
			b = c;
		}
		else
		{
			r = c;
			g = 0;
			b = x;
		}

		return [ r + m, g + m, b + m, a ];
	}

	/**
	 * Return the color black.
	 * @returns {IVector4} The color black.
	 */
	public static get black(): Readonly<IVector4>
	{
		return this.#black;
	}

	/**
	 * Return the color blue.
	 * @returns {IVector4} The color blue.
	 */
	public static get blue(): Readonly<IVector4>
	{
		return this.#blue;
	}

	/**
	 * Return the color gray.
	 * @returns {IVector4} The color gray.
	 */
	public static get gray(): Readonly<IVector4>
	{
		return this.#gray;
	}

	/**
	 * Return the color green.
	 * @returns {IVector4} The color green.
	 */
	public static get green(): Readonly<IVector4>
	{
		return this.#green;
	}

	/**
	 * Return the color magenta.
	 * @returns {IVector4} The color magenta.
	 */
	public static get magenta(): Readonly<IVector4>
	{
		return this.#magenta;
	}

	/**
	 * Return the color orange.
	 * @returns {IVector4} The color orange.
	 */
	public static get orange(): Readonly<IVector4>
	{
		return this.#orange;
	}

	/**
	 * Return the color red.
	 * @returns {IVector4} The color red.
	 */
	public static get red(): Readonly<IVector4>
	{
		return this.#red;
	}

	/**
	 * Return the color transparent.
	 * @returns {IVector4} The color transparent.
	 */
	public static get transparent(): Readonly<IVector4>
	{
		return this.#transparent;
	}

	/**
	 * Return the color white.
	 * @returns {IVector4} The color white.
	 */
	public static get white(): Readonly<IVector4>
	{
		return this.#white;
	}

	/**
	 * Return the color yellow.
	 * @returns {IVector4} The color yellow.
	 */
	public static get yellow(): Readonly<IVector4>
	{
		return this.#yellow;
	}
}
