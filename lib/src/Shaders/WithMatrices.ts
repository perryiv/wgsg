///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader class that handles the uniforms: the camera's and the material's.
//
///////////////////////////////////////////////////////////////////////////////

import { Device } from "../Tools";
import { IDENTITY_MATRIX } from "../Math/Constants";
import { mat4 } from "gl-matrix";
import {
	makeVertexBufferLayouts,
	ShaderBase as BaseClass,
	type IPipelineOptions,
	type IShaderBaseInput,
} from "./ShaderBase";
import { ObjectMatrices } from "./ObjectMatrices";
import { getWhiteTexture } from "../Textures/Defaults";
import { UniformPool, type IUniformPoolTexture } from "./UniformPool";
import type { Texture } from "../Textures/Texture";
import type { IMatrix44 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IWithMatricesInput = IShaderBaseInput;

///////////////////////////////////////////////////////////////////////////////
//
//	The uniforms of one bind group.
//
///////////////////////////////////////////////////////////////////////////////

interface IUniformGroup
{
	pool: ( UniformPool | null );
	layout: ( GPUBindGroupLayout | null );
	changed: boolean;
	textured: boolean; // Whether bindings 1 and 2 are a texture and sampler.
}

const makeUniformGroup = () : IUniformGroup =>
{
	return { pool: null, layout: null, changed: true, textured: false };
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for shaders with uniforms in three bind groups, by how often
 * they change:
 * - Group 0, the camera: the projection matrix, and whatever derived classes
 *   add (e.g., the light direction).
 * - Group 1, the material: what state attributes set (e.g., the color).
 * - Group 2, the object: its matrix, from ObjectMatrices, which the caller
 *   binds.
 * The camera and material uniforms are each kept in a pool of buffers that
 * is reused every frame, and written only when they change.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class WithMatrices extends BaseClass
{
	#projMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ];
	#camera: IUniformGroup = makeUniformGroup();
	#material: IUniformGroup = { ...makeUniformGroup(), textured: true };
	#diffuseTexture: ( Texture | null ) = null;
	#pipelineLayout: ( GPUPipelineLayout | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IWithMatricesInput} [input] - The input for the shader.
	 */
	protected constructor ( input: Readonly<IWithMatricesInput> )
	{
		super ( input );
	}

	/**
	 * Destroy this instance.
	 */
	public override destroy() : void
	{
		super.destroy();
	}

	/**
	 * Release the GPU objects. Destroy the uniform buffers. They, and the
	 * layouts, are made again when needed.
	 */
	public override releaseGpuObjects() : void
	{
		this.#camera.pool?.destroy();
		this.#material.pool?.destroy();
		this.#camera = makeUniformGroup();
		this.#material = { ...makeUniformGroup(), textured: true };
		this.#pipelineLayout = null;
		super.releaseGpuObjects();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.WithMatrices";
	}

	/**
	 * Get the projection matrix.
	 * @returns {IMatrix44} The projection matrix.
	 */
	public override get projMatrix () : Readonly<IMatrix44>
	{
		return this.#projMatrix;
	}

	/**
	 * Set the projection matrix.
	 * @param {IMatrix44} matrix - The projection matrix.
	 */
	public override set projMatrix ( matrix: Readonly<IMatrix44> )
	{
		mat4.copy ( this.#projMatrix, matrix );
		this.cameraChanged();
	}

	/**
	 * Call this when any of the camera's uniform values change.
	 */
	protected cameraChanged () : void
	{
		this.#camera.changed = true;
	}

	/**
	 * Call this when any of the material's uniform values change.
	 */
	protected materialChanged () : void
	{
		this.#material.changed = true;
	}

	/**
	 * Return the camera's uniform values, in the same order as the "Camera"
	 * struct in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected abstract makeCameraUniforms () : ArrayBuffer;

	/**
	 * Return the material's uniform values, in the same order as the
	 * "Material" struct in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected abstract makeMaterialUniforms () : ArrayBuffer;

	/**
	 * Get the layout of the camera's bind group.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	protected get cameraLayout () : GPUBindGroupLayout
	{
		return this.getLayout ( this.#camera, "camera" );
	}

	/**
	 * Get the layout of the material's bind group.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	protected get materialLayout () : GPUBindGroupLayout
	{
		return this.getLayout ( this.#material, "material" );
	}

	/**
	 * Get the bind group layouts, in order. Derived classes that add bind
	 * groups after these override this.
	 * @returns {GPUBindGroupLayout[]} The bind group layouts.
	 */
	protected get bindGroupLayouts () : GPUBindGroupLayout[]
	{
		return [ this.cameraLayout, this.materialLayout, ObjectMatrices.layout ];
	}

	/**
	 * Get the pipeline layout. Use this when making the pipeline so that the
	 * bind groups in the pools work with all of this shader's pipelines.
	 * @returns {GPUPipelineLayout} The pipeline layout.
	 */
	protected get pipelineLayout () : GPUPipelineLayout
	{
		if ( !this.#pipelineLayout )
		{
			this.#pipelineLayout = Device.instance.device.createPipelineLayout ( {
				label: `Pipeline layout for shader ${this.type}`,
				bindGroupLayouts: this.bindGroupLayouts,
			} );
		}
		return this.#pipelineLayout;
	}

	/**
	 * Make the render pipeline. The vertex buffers are the arrays that
	 * getVertexArrays() says. With vertex colors, the entry points are
	 * "vsColors" and "fsColors", which use them, and otherwise they are "vs"
	 * and "fs". Without vertex colors, the drawing is exactly what it was
	 * before there were any, because interpolating a constant color can be
	 * off by a little.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline ( options: Readonly<IPipelineOptions> ) : GPURenderPipeline
	{
		// Shortcuts
		const { device, renderFormat } = Device.instance;
		const { topology, cullMode, depthWrite } = options;
		const arrays = this.getVertexArrays ( options );
		const colors = arrays.includes ( "colors" );

		// Make the pipeline.
		const pipeline = device.createRenderPipeline ( {
			label: `Render pipeline for shader ${this.type}`,
			layout: this.pipelineLayout,
			vertex: {
				module: this.module,
				entryPoint: ( colors ? "vsColors" : "vs" ),
				buffers: makeVertexBufferLayouts ( arrays, options ),
			},
			fragment: {
				module: this.module,
				entryPoint: ( colors ? "fsColors" : "fs" ),
				targets: [ {
					format: renderFormat,
					blend: {
						color: {
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha"
						},
						alpha: {
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha"
						},
					},
				} ]
			},
			primitive: {
				topology,
				cullMode,
			},
			depthStencil: {
				depthWriteEnabled: depthWrite,
				depthCompare: "less",
				format: "depth24plus",
			},
		} );

		// Do not return an invalid pipeline.
		if ( !pipeline )
		{
			throw new Error ( "Failed to create pipeline" );
		}

		// Return the new pipeline.
		return pipeline;
	}

	/**
	 * Get the layout of a bind group with one uniform buffer, and for a
	 * textured group, a texture and its sampler, making it if we have to.
	 * @param {IUniformGroup} group - The uniforms.
	 * @param {string} name - The name, for the label.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	protected getLayout ( group: IUniformGroup, name: string ) : GPUBindGroupLayout
	{
		if ( !group.layout )
		{
			const entries: GPUBindGroupLayoutEntry[] = [ {
				binding: 0,
				visibility: ( GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT ),
				buffer: { type: "uniform" },
			} ];
			if ( group.textured )
			{
				entries.push (
					{ binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
					{ binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
				);
			}
			group.layout = Device.instance.device.createBindGroupLayout ( {
				label: `Bind group layout for the ${name} in shader ${this.type}`,
				entries,
			} );
		}
		return group.layout;
	}

	/**
	 * Get the number of uniform buffers in the pools.
	 * @returns {number} The number of uniform buffers.
	 */
	public get numUniformBuffers () : number
	{
		return ( ( this.#camera.pool?.length ?? 0 ) + ( this.#material.pool?.length ?? 0 ) );
	}

	/**
	 * Configure the render pass. This sets the camera's and material's bind
	 * groups. The caller sets the object's.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public configureRenderPass ( pass: Readonly<GPURenderPassEncoder>, frame: number ) : void
	{
		// Note: The render-pass' pipeline should already be set.
		this.useUniforms ( pass, frame, 0, this.#camera, "camera", this.makeCameraUniforms() );
		const texture = ( this.#diffuseTexture ?? getWhiteTexture() );
		const textureInput: IUniformPoolTexture = { view: texture.view, sampler: texture.sampler };
		this.useUniforms ( pass, frame, 1, this.#material, "material", this.makeMaterialUniforms(), textureInput );
	}

	/**
	 * Get the diffuse texture.
	 * @returns {Texture | null} The texture, or null for none.
	 */
	public get diffuseTexture () : ( Texture | null )
	{
		return this.#diffuseTexture;
	}

	/**
	 * Set the diffuse texture. Without one, a white texture is used, which
	 * doesn't change the colors.
	 * @param {Texture | null} texture - The texture, or null for none.
	 */
	public set diffuseTexture ( texture: ( Texture | null ) )
	{
		this.#diffuseTexture = texture;
	}

	/**
	 * Put back the default values of what state attributes set: no texture.
	 * Derived classes that override this call it too.
	 */
	public override reset () : void
	{
		this.#diffuseTexture = null;
	}

	/**
	 * Get the bind group with the values, writing them if we have to, and set it.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 * @param {number} index - The bind group index.
	 * @param {IUniformGroup} group - The uniforms.
	 * @param {string} name - The name, for the labels.
	 * @param {ArrayBuffer} values - The values.
	 * @param {IUniformPoolTexture} [texture] - The texture view and sampler,
	 * for a textured group.
	 */
	protected useUniforms ( pass: Readonly<GPURenderPassEncoder>, frame: number, index: number,
		group: IUniformGroup, name: string, values: ArrayBuffer, texture?: Readonly<IUniformPoolTexture> ) : void
	{
		group.pool ??= new UniformPool ( {
			label: `${name} in shader ${this.type}`,
			layout: this.getLayout ( group, name ),
			size: values.byteLength,
			textured: group.textured,
		} );
		const bindGroup = group.pool.use ( frame, group.changed, values, texture );
		group.changed = false;
		pass.setBindGroup ( index, bindGroup );
	}
}
