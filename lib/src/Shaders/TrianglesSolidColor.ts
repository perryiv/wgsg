///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that renders a solid color.
//	https://stackoverflow.com/questions/71535213/a-way-to-load-wglsl-files-in-typescript-files-using-esbuild
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";
import { IVector4 } from "../Types";
import { ShaderBase as BaseClass } from "./ShaderBase";
import { vec4 } from "gl-matrix";

// @ts-expect-error TypeScript does not recognize WGSL files.
import code from "./TrianglesSolidColor.wgsl?raw";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface ITriangleSolidColorShaderInput
{
	color?: IVector4;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the shader code.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class TriangleSolidColor extends BaseClass
{
	#color: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ];

	/**
	 * Construct the class.
	 * @class
	 * @param {ITriangleSolidColorShaderInput} input - The input for the constructor.
	 * @param {IVector4} [input.color] - The color to use.
	 */
	public constructor ( input?: ITriangleSolidColorShaderInput )
	{
		super ( { code: ( code as string ) } );

		const { color } = ( input ? input : {} );

		if ( ( color ) && ( 4 === color.length ) )
		{
			vec4.copy ( this.#color, color );
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.TriangleSolidColor";
	}

	/**
	 * Set the color.
	 * @param {IVector4} color The color to use.
	 */
	public set color ( color: IVector4 )
	{
		vec4.copy ( this.#color, color );
	}

	/**
	 * Return the color.
	 * @returns {IVector4} The color.
	 */
	public get color () : IVector4
	{
		return [ ...this.#color ];
	}

	/**
	 * Make the render pipeline.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline() : GPURenderPipeline
	{
		// Define the array stride.
		// https://www.w3.org/TR/webgpu/#enumdef-gpuvertexstepmode
		const arrayStride = 12; // 3 floats * 4 bytes each.
					
		// Make the pipeline.
		const pipeline = Device.instance.device.createRenderPipeline ( {
			label: `Pipeline for shader ${this.type}`,
			vertex: {
				module: this.module,
				buffers: [
				{
					attributes: [
					{
						shaderLocation: 0,
						offset: 0,
						format: "float32x3", // Position
					} ],
					arrayStride,
					stepMode: "vertex",
				} ]
			},
			fragment: {
				module: this.module,
				targets: [ {
					format: Device.instance.preferredFormat
				} ]
			},
			primitive: {
				topology: "triangle-list"
			},
			layout: "auto",
		} );

		// Do not return an invalid pipeline.
		if ( !pipeline )
		{
			throw new Error ( "Failed to create pipeline" );
		}

		// Return the new pipeline.
		return pipeline;
	}
}
