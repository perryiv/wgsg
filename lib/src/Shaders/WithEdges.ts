///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Base class for lighting shaders that also draw the triangle edges.
//
//	Each corner of a triangle gets a barycentric coordinate, (1,0,0), (0,1,0),
//	or (0,0,1). Near an edge one of the interpolated components goes to zero,
//	and the fragment shader colors those pixels. To give each corner its own
//	coordinate when vertices are shared, the vertex shader reads the indices
//	and points from storage buffers (vertex pulling), and the geometry is
//	drawn without index or vertex buffers.
//
//	The shader code for each derived class must start with Edges.wgsl.
//
///////////////////////////////////////////////////////////////////////////////

import { ColorTool as Color, Device } from "../Tools";
import { vec4 } from "gl-matrix";
import { Lighting as BaseClass, type ILightingInput } from "./Lighting";
import type { IPipelineOptions, IPulledVerticesInput } from "./ShaderBase";
import type { IVector4 } from "../Types";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

export type IWithEdgesInput = ILightingInput;

interface IPulledVerticesData
{
	bindGroup: GPUBindGroup;
	indices: GPUBuffer;
	points: GPUBuffer;
	normals: ( GPUBuffer | null );
}


///////////////////////////////////////////////////////////////////////////////
//
//	How the vertex shader reads the indices. This is passed to the shader as
//	the first instance, which it gets as the instance index. There is only
//	ever one instance, so this does not need a buffer.
//
///////////////////////////////////////////////////////////////////////////////

export const PULLED_INDICES_NONE = 0;
export const PULLED_INDICES_UINT16 = 1;
export const PULLED_INDICES_UINT32 = 2;


///////////////////////////////////////////////////////////////////////////////
/**
 * Base class for lighting shaders that also draw the triangle edges.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export abstract class WithEdges extends BaseClass
{
	#edgeColor: IVector4 = [ ...Color.black ];
	#edgeWidth = 1.0;
	#verticesLayout: ( GPUBindGroupLayout | null ) = null;
	#pipelineLayout: ( GPUPipelineLayout | null ) = null;
	#pulled = new WeakMap < object, IPulledVerticesData >();
	#warned = false;

	/**
	 * Construct the class.
	 * @abstract
	 * @param {IWithEdgesInput} input - The input.
	 */
	protected constructor ( input: Readonly<IWithEdgesInput> )
	{
		super ( input );
	}

	/**
	 * Release the GPU objects. The layouts and bind groups are made again
	 * when needed.
	 */
	public override releaseGpuObjects() : void
	{
		this.#verticesLayout = null;
		this.#pipelineLayout = null;
		this.#pulled = new WeakMap();
		super.releaseGpuObjects();
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Shaders.WithEdges";
	}

	/**
	 * Return the edge color.
	 * @returns {IVector4} The edge color.
	 */
	public get edgeColor () : IVector4
	{
		return [ ...this.#edgeColor ];
	}

	/**
	 * Set the edge color.
	 * @param {IVector4} color - The edge color.
	 */
	public set edgeColor ( color: Readonly<IVector4> )
	{
		vec4.copy ( this.#edgeColor, color );
		this.uniformsChanged();
	}

	/**
	 * Return the edge width.
	 * @returns {number} The edge width in pixels.
	 */
	public get edgeWidth () : number
	{
		return this.#edgeWidth;
	}

	/**
	 * Set the edge width.
	 * @param {number} width - The edge width in pixels.
	 */
	public set edgeWidth ( width: number )
	{
		if ( !( width >= 0 ) )
		{
			throw new Error ( `Invalid edge width: ${width}` );
		}
		this.#edgeWidth = width;
		this.uniformsChanged();
	}

	// This shader pulls the vertices from storage buffers.
	public override readonly pullsVertices: boolean = true;

	// Does the shader read the normal vectors?
	protected abstract readonly usesNormals: boolean;

	/**
	 * Get the number of 4-byte values in the uniforms. The edge color, the
	 * edge width, and three unused values so that the size is a multiple of
	 * 16 bytes, like the struct in the shader code.
	 * @returns {number} The number of 4-byte values.
	 */
	protected override get numUniformValues () : number
	{
		return ( super.numUniformValues + 4 + 1 + 3 );
	}

	/**
	 * Return the uniform values, in the same order as the "Uniforms" struct
	 * in the shader code.
	 * @returns {ArrayBuffer} The uniform values.
	 */
	protected override makeUniforms () : ArrayBuffer
	{
		const uniforms = super.makeUniforms();
		const floats = new Float32Array ( uniforms );
		const start = super.numUniformValues;
		floats.set ( this.#edgeColor, start );
		floats[start + 4] = this.#edgeWidth;
		return uniforms;
	}

	/**
	 * Get the layout of the bind group with the buffers that the vertices are
	 * pulled from.
	 * @returns {GPUBindGroupLayout} The bind group layout.
	 */
	protected get verticesLayout () : GPUBindGroupLayout
	{
		if ( !this.#verticesLayout )
		{
			const buffer: GPUBufferBindingLayout = { type: "read-only-storage" };
			const visibility = GPUShaderStage.VERTEX;
			const entries: GPUBindGroupLayoutEntry[] = [
				{ binding: 0, visibility, buffer }, // Indices
				{ binding: 1, visibility, buffer }, // Points
			];
			if ( this.usesNormals )
			{
				entries.push ( { binding: 2, visibility, buffer } ); // Normals
			}
			this.#verticesLayout = Device.instance.device.createBindGroupLayout ( {
				label: `Bind group layout for pulled vertices in shader ${this.type}`,
				entries,
			} );
		}
		return this.#verticesLayout;
	}

	/**
	 * Get the pipeline layout. Group 0 has the uniforms and group 1 has the
	 * buffers that the vertices are pulled from.
	 * @returns {GPUPipelineLayout} The pipeline layout.
	 */
	protected override get pipelineLayout () : GPUPipelineLayout
	{
		if ( !this.#pipelineLayout )
		{
			this.#pipelineLayout = Device.instance.device.createPipelineLayout ( {
				label: `Pipeline layout for shader ${this.type}`,
				bindGroupLayouts: [ this.bindGroupLayout, this.verticesLayout ],
			} );
		}
		return this.#pipelineLayout;
	}

	/**
	 * Set the bind group with the buffers that the vertices are pulled from.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {IPulledVerticesInput} input - The geometry, its indices if any,
	 * and an object that identifies the primitives, for caching.
	 * @returns {number | null} The value to pass as the first instance when
	 * drawing, or null if the vertices cannot be drawn.
	 */
	public override setPulledVertices ( pass: Readonly<GPURenderPassEncoder>, input: Readonly<IPulledVerticesInput> ) : ( number | null )
	{
		// Shortcuts.
		const { geometry, indices, key } = input;

		// We need points.
		const points = geometry.points?.buffer;
		if ( !points )
		{
			return null;
		}

		// We need normals if the shader uses them.
		const normals = ( this.usesNormals ? ( geometry.normals?.buffer ?? null ) : null );
		if ( this.usesNormals && !normals )
		{
			return null;
		}

		// Get the index buffer and how to read it. Without indices the binding
		// still needs a buffer, so use the points, which the shader won't read.
		let indexBuffer = points;
		let mode = PULLED_INDICES_NONE;
		if ( indices )
		{
			const buffer = indices.buffer;
			if ( !buffer )
			{
				return null;
			}
			indexBuffer = buffer;
			mode = ( ( 2 === indices.values?.BYTES_PER_ELEMENT ) ? PULLED_INDICES_UINT16 : PULLED_INDICES_UINT32 );
		}

		// Use the bind group we made before if the buffers are the same.
		let data = this.#pulled.get ( key );
		if ( ( data?.indices !== indexBuffer ) || ( data.points !== points ) || ( data.normals !== normals ) )
		{
			// Each buffer has to fit in one storage buffer binding.
			const { device } = Device.instance;
			const maxSize = device.limits.maxStorageBufferBindingSize;
			const tooBig = [ indexBuffer, points, normals ].find (
				( buffer ) => ( ( buffer?.size ?? 0 ) > maxSize ) );
			if ( tooBig )
			{
				if ( !this.#warned )
				{
					this.#warned = true;
					console.warn ( `Cannot draw triangle edges of a ${tooBig.size} byte buffer, ` +
						`because the limit for storage buffers is ${maxSize} bytes` );
				}
				return null;
			}

			// Make the bind group.
			const entries: GPUBindGroupEntry[] = [
				{ binding: 0, resource: { buffer: indexBuffer } },
				{ binding: 1, resource: { buffer: points } },
			];
			if ( normals )
			{
				entries.push ( { binding: 2, resource: { buffer: normals } } );
			}
			const bindGroup = device.createBindGroup ( {
				label: `Bind group for pulled vertices in shader ${this.type}`,
				layout: this.verticesLayout,
				entries,
			} );

			// Save it for next time.
			data = { bindGroup, indices: indexBuffer, points, normals };
			this.#pulled.set ( key, data );
		}

		// Use the bind group.
		pass.setBindGroup ( 1, data.bindGroup );

		// Return how the vertex shader should read the indices.
		return mode;
	}

	/**
	 * Make the render pipeline. There are no vertex buffers.
	 * @param {IPipelineOptions} options - The pipeline options.
	 * @returns {GPURenderPipeline} The render pipeline.
	 */
	protected makePipeline ( { topology, cullMode }: Readonly<IPipelineOptions> ) : GPURenderPipeline
	{
		// Shortcuts
		const { device, preferredFormat } = Device.instance;

		// Make the pipeline.
		const pipeline = device.createRenderPipeline ( {
			label: `Render pipeline for shader ${this.type}`,
			layout: this.pipelineLayout,
			vertex: {
				module: this.module,
				entryPoint: "vs",
				buffers: []
			},
			fragment: {
				module: this.module,
				entryPoint: "fs",
				targets: [ {
					format: preferredFormat,
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
				depthWriteEnabled: true,
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
}
