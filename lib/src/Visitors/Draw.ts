///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Draw visitor class. It operates on the render graph.
//
///////////////////////////////////////////////////////////////////////////////

import { ObjectMatrices, ShaderBase, type IVertexArrayName } from "../Shaders";
import { vec4 } from "gl-matrix";
import { Visitor as BaseClass } from "./Visitor";
import type { IRenderGraphInfo, IVector4 } from "../Types";
import {
	ColorTool as Color,
	Device,
	GpuTimer,
	type IGpuTimeCallback,
	KEEP_PERFORMANCE_INFO,
} from "../Tools";
import {
	Arrays,
	Geometry,
	Indexed,
	Shape,
	type IIndexArray,
	State,
	type IStateApplyInput,
} from "../Scene";
import {
	Bin,
	Layer,
	makeRenderGraphInfo,
	Pipeline,
	ProjMatrixGroup,
	Root,
	StateGroup,
} from "../Render";


///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * What the draw visitor renders into. Give it one or the other:
 * - context: A canvas's context. Each frame goes to the canvas.
 * - texture: A texture, to render without a canvas. It must have the
 *   device's preferred format (Device.instance.preferredFormat), because the
 *   shaders make their pipelines for that format, and RENDER_ATTACHMENT
 *   usage. Add COPY_SRC usage to read the pixels back.
 */
export type IDrawVisitorInput = (
	{ context: GPUCanvasContext, texture?: undefined } |
	{ texture: GPUTexture, context?: undefined }
);


///////////////////////////////////////////////////////////////////////////////
/**
 * Require a shader from the state.
 * @param {State} state - The state to check.
 * @returns {ShaderBase} The shader.
 */
///////////////////////////////////////////////////////////////////////////////

const requireShader = ( state: State ) : ShaderBase =>
{
	const { shader } = state;
	if ( !shader )
	{
		throw new Error ( `State ${state.type} ${state.id} has no shader` );
	}
	return shader;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the timestamp writes for one of a frame's render passes. The time the
 * frame starts is written at the start of the first pass, and the time it
 * ends at the end of the last, so the time covers all of them.
 * @param {GPURenderPassTimestampWrites | undefined} timestamps - The writes
 * for the whole frame, or undefined if it's not timed with timestamps.
 * @param {boolean} first - True if it's the first pass.
 * @param {boolean} last - True if it's the last pass.
 * @returns {GPURenderPassTimestampWrites | undefined} The writes for this pass.
 */
///////////////////////////////////////////////////////////////////////////////

const getPassTimestampWrites = (
	timestamps: ( GPURenderPassTimestampWrites | undefined ),
	first: boolean,
	last: boolean ) : ( GPURenderPassTimestampWrites | undefined ) =>
{
	if ( !timestamps || ( !first && !last ) )
	{
		return undefined;
	}
	const answer: GPURenderPassTimestampWrites = { querySet: timestamps.querySet };
	if ( first )
	{
		answer.beginningOfPassWriteIndex = timestamps.beginningOfPassWriteIndex;
	}
	if ( last )
	{
		answer.endOfPassWriteIndex = timestamps.endOfPassWriteIndex;
	}
	return answer;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Draw visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Draw extends BaseClass
{
	#context: ( GPUCanvasContext | null ) = null;
	#texture: ( GPUTexture | null ) = null;
	#depthTexture: ( GPUTexture | null ) = null;
	#clearColor: IVector4 = [ ...Color.gray ];
	#renderPassEncoder: ( GPURenderPassEncoder | null ) = null;
	#commandEncoder: ( GPUCommandEncoder | null ) = null;
	#geometry: ( Geometry | null ) = null;
	#shader: ( ShaderBase | null ) = null;
	#vertexArrays: IVertexArrayName[] = [];
	#info: ( IRenderGraphInfo | null ) = null;
	#device: ( number | null ) = null;
	#frame = 0;
	#gpuTimer: ( GpuTimer | null ) = null;
	#onGpuTime: ( IGpuTimeCallback | null ) = null;
	#objects = new ObjectMatrices();
	#offsets: number[] = [];
	#boundMatrix = -1;

	/**
	 * Construct the class.
	 * @class
	 * @param {IDrawVisitorInput} input - The input for the constructor.
	 * @param {GPUCanvasContext} [input.context] - The GPU canvas context to render into.
	 * @param {GPUTexture} [input.texture] - The texture to render into.
	 */
	constructor ( { context, texture }: IDrawVisitorInput )
	{
		// Call this first.
		super();

		// Render into a texture?
		if ( texture )
		{
			if ( context )
			{
				throw new Error ( "Draw visitor was given both a context and a texture" );
			}
			if ( 0 === ( texture.usage & GPUTextureUsage.RENDER_ATTACHMENT ) )
			{
				throw new Error ( "Draw visitor texture input does not have RENDER_ATTACHMENT usage" );
			}
			this.#texture = texture;
			return;
		}

		// Otherwise, render into a canvas.
		if ( !context )
		{
			throw new Error ( "Draw visitor context input is invalid" );
		}
		if ( !( context instanceof GPUCanvasContext ) )
		{
			throw new Error ( "Draw visitor context input is not a GPUCanvasContext" );
		}
		this.#context = context;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Visitors.Draw";
	}

	/*
	 * Get the numbers of the various objects in the render graph.
	 */
	public get renderGraphInfo () : IRenderGraphInfo
	{
		let info = this.#info;
		if ( !info )
		{
			info = makeRenderGraphInfo();
			this.#info = info;
		}
		return info;
	}

	/**
	 * Set the render graph info.
	 * @param {IRenderGraphInfo} info - The render graph info.
	 */
	public set renderGraphInfo ( info: IRenderGraphInfo )
	{
		this.#info = info;
	}

	/**
	 * Get the function called with the GPU time of each frame.
	 * @returns {IGpuTimeCallback | null} The function, or null.
	 */
	public get onGpuTime () : ( IGpuTimeCallback | null )
	{
		return this.#onGpuTime;
	}

	/**
	 * Set the function called with the GPU time of each frame. The time arrives
	 * after the frame is drawn, sometimes after the next one starts. Set it to
	 * null to stop timing the GPU.
	 * @param {IGpuTimeCallback | null} callback - The function, or null.
	 */
	public set onGpuTime ( callback: ( IGpuTimeCallback | null ) )
	{
		this.#onGpuTime = callback;
		if ( !callback )
		{
			this.#gpuTimer?.destroy();
			this.#gpuTimer = null;
		}
	}

	/**
	 * Get the GPU canvas context.
	 * @returns {GPUCanvasContext} The GPU canvas context.
	 */
	protected get context () : ( GPUCanvasContext | null )
	{
		return this.#context;
	}

	/**
	 * Get the texture we render into, if we were given one instead of a context.
	 * @returns {GPUTexture | null} The texture, or null.
	 */
	public get texture () : ( GPUTexture | null )
	{
		return this.#texture;
	}

	/**
	 * Get the texture to render this frame into.
	 * @returns {GPUTexture} The texture.
	 */
	protected getColorTexture () : GPUTexture
	{
		// Were we given a texture?
		const texture = this.#texture;
		if ( texture )
		{
			// It has to match the format the shaders make their pipelines for.
			const { preferredFormat } = Device.instance;
			if ( texture.format !== preferredFormat )
			{
				throw new Error ( `Draw visitor texture has format ${texture.format} but the shaders use ${preferredFormat}` );
			}
			return texture;
		}

		// Otherwise, the canvas gives us a new texture each frame.
		const context = this.#context;
		if ( !context )
		{
			throw new Error ( "Draw visitor has neither a context nor a texture" );
		}
		const canvasTexture = context.getCurrentTexture();
		canvasTexture.label = `Texture for ${this.type} ${this.id}`;
		return canvasTexture;
	}

	/**
	 * Get the render command encoder.
	 * @returns {GPURenderCommandEncoder} The render command encoder.
	 */
	protected get commandEncoder () : GPUCommandEncoder
	{
		// Shortcut.
		const encoder = this.#commandEncoder;

		// We should always have a valid encoder.
		if ( !encoder )
		{
			throw new Error ( "Attempting to get invalid encoder in draw visitor" );
		}

		// Return the encoder.
		return encoder;
	}

	/**
	 * Get the render pass encoder.
	 * @returns {GPURenderPassEncoder} The render pass encoder.
	 */
	protected get renderPassEncoder () : GPURenderPassEncoder
	{
		// Shortcuts.
		const pass = this.#renderPassEncoder;

		// Make sure there is a render pass.
		if ( !pass )
		{
			throw new Error ( `Invalid render pass in ${this.type} ${this.id}` );
		}

		// Return the render pass encoder.
		return pass;
	}

	/**
	 * See if there is a render pass encoder.
	 * @returns {boolean} True if there is a render pass encoder.
	 */
	protected get hasRenderPassEncoder () : boolean
	{
		return ( !!( this.#renderPassEncoder ) );
	}

	/**
	 * Get the clear color.
	 * @returns {IVector4} The clear color.
	 */
	public get clearColor () : IVector4
	{
		return [ ...this.#clearColor ];
	}

	/**
	 * Set the clear color.
	 * @param {IVector4} color - The clear color to use.
	 */
	public set clearColor ( color: Readonly<IVector4> )
	{
		if ( 4 !== color.length )
		{
			throw new Error ( `Invalid color length ${color.length as number}, expected 4` );
		}
		vec4.copy ( this.#clearColor, color );
	}

	/**
	 * Get the pre-multiplied clear color.
	 * @returns {IVector4} The pre-multiplied clear color.
	 */
	public get preMultipliedClearColor () : IVector4
	{
		return Color.preMultiply ( this.#clearColor );
	}

	/**
	 * Get or make the depth texture.
	 * @param {GPUTexture} reference - The reference texture to match size.
	 * @returns {GPUTexture} The depth texture.
	 */
	protected getDepthTexture ( reference: GPUTexture ) : GPUTexture
	{
		// Shortcuts.
		const device = Device.instance.device;
		const { width, height } = reference;
		let dt = this.#depthTexture;

		// See if we need to make a new one.
		if ( ( dt?.width !== width ) || ( dt?.height !== height ) )
		{
			// Destroy the old one.
			if ( dt )
			{
				dt.destroy();
			}

			// Make the new one.
			dt = device.createTexture ( {
				size: [ width, height ],
				format: "depth24plus",
				usage: GPUTextureUsage.RENDER_ATTACHMENT,
			} );

			// Save it.
			this.#depthTexture = dt;
		}

		// Return the depth texture.
		return dt;
	}

	/**
	 * Draw the render graph.
	 * @param {IRoot} root - The root of the render graph.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public draw ( root: Root, frame: number ) : void
	{
		// Remember the frame for the shaders.
		this.#frame = frame;

		// Make sure we have a device. This can happen if the device is lost after
		// a render is scheduled but before it happens.
		if ( false === Device.valid )
		{
			console.warn ( "Cannot draw because the device is not valid" );
			return;
		}

		// The first time in here we set the device id.
		if ( null === this.#device )
		{
			this.#device = Device.instance.id;
		}

		// Make sure the current device is the same as the one we used before.
		if ( this.#device !== Device.instance.id )
		{
			throw new Error ( `Device was ${this.#device} but now it is ${Device.instance.id}` );
		}

		// Shortcut.
		const device = Device.instance.device;

		// Make a command encoder.
		const encoder = device.createCommandEncoder ( {
			label: `Command encoder for ${this.type}`
		} );
		this.#commandEncoder = encoder;

		// Shortcuts.
		const colorTexture = this.getColorTexture();
		const depthTexture = this.getDepthTexture ( colorTexture );

		// Get the GPU timer if we are timing the GPU.
		const onGpuTime = this.#onGpuTime;
		if ( onGpuTime && !this.#gpuTimer )
		{
			this.#gpuTimer = new GpuTimer ( device );
		}
		const gpuTimer = ( onGpuTime ? this.#gpuTimer : null );

		// Put the shapes' matrices where the shaders can read them.
		this.addMatrices ( root );

		// Get the layers in order.
		const layers: Layer[] = [];
		root.forEachLayer ( ( layer: Layer ) =>
		{
			layers.push ( layer );
		} );

		// Draw each layer in its own render pass. Each pass clears the depth
		// buffer, so a layer is drawn in front of the ones before it. Only the
		// first pass clears the colors. With no layers, there is still one pass,
		// to clear the colors.
		const colorView = colorTexture.createView();
		const depthView = depthTexture.createView();
		const timestamps = gpuTimer?.timestampWrites();
		const numPasses = Math.max ( 1, layers.length );
		for ( let i = 0; i < numPasses; ++i )
		{
			const first = ( 0 === i );
			const last = ( ( numPasses - 1 ) === i );

			// Make the render pass encoder.
			const pass = encoder.beginRenderPass ( {
				label: `Render pass ${i} for ${this.type} ${this.id}`,
				timestampWrites: getPassTimestampWrites ( timestamps, first, last ),
				colorAttachments: [ {
					view: colorView,
					clearValue: this.preMultipliedClearColor,
					loadOp: ( first ? "clear" : "load" ),
					storeOp: "store"
				} ],
				depthStencilAttachment: {
					view: depthView,
					depthClearValue: 1.0,
					depthLoadOp: "clear",
					depthStoreOp: "store",
				},
			} );
			this.#renderPassEncoder = pass;

			// Draw the layer.
			const layer = layers[i];
			if ( layer )
			{
				this.drawLayer ( layer );
			}

			// End this render pass.
			pass.end();
			this.#renderPassEncoder = null;
		}

		// Write all the objects' matrices at once, before the commands run.
		this.#objects.upload();

		// Copy the GPU times to where we can read them.
		gpuTimer?.afterPass ( encoder );

		// Submit the commands to the GPU.
		device.queue.submit ( [ encoder.finish() ] );

		// Get the GPU time when it's ready.
		if ( gpuTimer && onGpuTime )
		{
			gpuTimer.afterSubmit ( onGpuTime );
		}

		// Reset these.
		this.#renderPassEncoder = null;
		this.#commandEncoder = null;
		this.#geometry = null;
		this.#shader = null;
	}

	/**
	 * Draw the layer.
	 * @param {Layer} layer - The layer to draw.
	 */
	protected drawLayer ( layer: Layer ) : void
	{
		// console.log ( `Layer ${layer.id} has ${layer.numBins} bins` );

		// Draw the bins.
		layer.forEachBin ( ( bin: Bin ) =>
		{
			this.drawBin ( bin );
		} );
	}

	/**
	 * Draw the render bin.
	 * @param {Bin} bin - The bin to draw.
	 */
	protected drawBin ( bin: Bin ) : void
	{
		// console.log ( `Bin ${bin.id} has ${bin.numPipelines} pipelines` );

		// Draw the pipelines.
		bin.forEachPipeline ( ( pipeline: Pipeline ) =>
		{
			this.drawPipeline ( pipeline );
		} );
	}

	/**
	 * Draw the pipeline.
	 * @param {Pipeline} pipeline - The pipeline to draw.
	 */
	protected drawPipeline ( pipeline: Pipeline ) : void
	{
		// Shortcuts.
		const pass = this.renderPassEncoder;
		const { shader, options } = pipeline;

		// Set the render pass' pipeline, and remember which of the geometry's
		// arrays it reads.
		pass.setPipeline ( shader.getPipeline ( options ) );
		this.#vertexArrays = shader.getVertexArrays ( options );

		// console.log ( `Pipeline ${pipeline.id} has ${pipeline.numProjMatrices} projection matrices` );

		// Draw the projection matrix groups.
		pipeline.forEachProjMatrixGroup ( ( pmg: ProjMatrixGroup ) =>
		{
			this.drawProjMatrixGroup ( pipeline, pmg );
		} );
	}

	/**
	 * Add the matrices of the render graph's shapes to the buffer that the
	 * shaders read them from, and remember where each one is.
	 * @param {Root} root - The root of the render graph.
	 */
	protected addMatrices ( root: Root ) : void
	{
		const objects = this.#objects;
		const count = root.numMatrices;
		objects.begin ( count );
		const offsets = this.#offsets;
		offsets.length = count;
		for ( let i = 0; i < count; ++i )
		{
			offsets[i] = objects.add ( root.getMatrix ( i ) );
		}
	}

	/**
	 * Draw the projection matrix group.
	 * @param {Pipeline} pipeline - The pipeline to use.
	 * @param {ProjMatrixGroup} pmg - The projection matrix group to draw.
	 */
	protected drawProjMatrixGroup ( pipeline: Pipeline, pmg: ProjMatrixGroup ) : void
	{
		// Set the pipeline's projection matrix.
		pipeline.projMatrix = pmg.matrix;

		// Draw the state groups.
		pmg.forEachStateGroup ( ( sg: StateGroup ) =>
		{
			this.drawStateGroup ( pipeline, pmg, sg );
		} );
	}

	/**
	 * Draw the state group.
	 * @param {Pipeline} pipeline - The pipeline to use.
	 * @param {ProjMatrixGroup} pmg - The projection matrix group.
	 * @param {StateGroup} sg - The state group to draw.
	 */
	protected drawStateGroup ( pipeline: Pipeline, pmg: ProjMatrixGroup, sg: StateGroup ) : void
	{
		// Shortcuts.
		const { state } = sg;
		const pass = this.renderPassEncoder;

		// Input for applying and resetting the state.
		const input: IStateApplyInput = {
			state,
			shader: pipeline.shader,
			projMatrix: pmg.matrix,
		};

		// Apply the state.
		state.doApply ( input );

		// Configure the render pass now that the state has been applied.
		const shader = requireShader ( state );
		shader.configureRenderPass ( pass, this.#frame );
		this.#shader = shader;

		// Draw the shapes. Bind each one's matrix, unless it's the same as the
		// shape before it.
		this.#boundMatrix = -1;
		sg.forEachShape ( ( shape: Shape, _index: number, matrix: number ) =>
		{
			if ( matrix !== this.#boundMatrix )
			{
				this.#objects.bind ( pass, this.#offsets[matrix] );
				this.#boundMatrix = matrix;
			}

			// The shape decides which function to call in order to draw itself.
			shape.accept ( this );
		} );

		// Reset the state.
		state.doReset ( input );
		this.#shader = null;
	}

	/**
	 * Draw the shape.
	 * @param {Shape} shape - The shape to draw.
	 */
	protected drawShape ( shape: Shape ) : void
	{
		// console.log ( `Drawing ${shape.type} ${shape.id}` );

		// The shape decides which function to call in order to draw itself.
		shape.accept ( this );
	}

	/**
	 * Visit and draw the geometry.
	 * @param {Geometry} geom - The geometry to draw.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// console.log ( `Drawing '${geom.type}' ${geom.id}` );

		// Set this first.
		this.#geometry = geom;

		// Get the primitives.
		const primitives = geom.primitives;

		// Handle null.
		if ( !primitives )
		{
			// This is not an error.
			console.warn ( `Geometry '${geom.type}' ${geom.id} has no primitives to draw` );
			return;
		}

		// Is there only one?
		if ( 1 === primitives.length )
		{
			primitives[0].accept ( this );
		}

		// Otherwise ...
		else
		{
			// Draw each primitive.
			for ( const primitive of primitives )
			{
				primitive.accept ( this );
			}
		}

		// Reset this.
		this.#geometry = null;
	}

	/**
	 * Draw the indexed primitives.
	 * @param {Indexed} prims - The indexed primitives to draw.
	 */
	public visitIndexed ( prims: Indexed ): void
	{
		// console.log ( `Drawing '${prims.type}' ${prims.id}` );

		// Handle no primitives.
		const numIndices = prims.numIndices;
		if ( numIndices <= 0 )
		{
			return; // This is not an error.
		}

		// We need indices to continue.
		const indices = prims.indices?.buffer;
		if ( !indices )
		{
			return; // This is not an error.
		}

		// Does the shader read the indices and points itself?
		if ( true === this.#shader?.pullsVertices )
		{
			this.drawPulledVertices ( prims, prims.indices, numIndices, 0 );
			return;
		}

		// Set the geometry's vertex buffers, which needs points.
		if ( false === this.setVertexBuffers() )
		{
			return; // This is not an error.
		}

		// Set the index buffer and draw.
		const pass = this.renderPassEncoder;
		pass.setIndexBuffer ( indices, prims.indexType );
		pass.drawIndexed (
			numIndices, // The number of indices to draw.
			1, // Number of instances to draw.
			0, // Offset into the index buffer, in indices, to begin drawing from.
			0, // Added to each index value before indexing into the vertex buffers.
			0  // First instance to draw.
		);

		// Performance info.
		this.addPerformanceInfo ( prims.topology, numIndices );
	}

	/**
	 * Draw the arrays of primitives. These have no indices. Each vertex is
	 * used once, in the order they are in the arrays.
	 * @param {Arrays} prims - The arrays of primitives to draw.
	 */
	public visitArrays ( prims: Arrays ): void
	{
		// Handle no primitives.
		const count = prims.count;
		if ( count <= 0 )
		{
			return; // This is not an error.
		}

		// Does the shader read the points itself?
		if ( true === this.#shader?.pullsVertices )
		{
			this.drawPulledVertices ( prims, null, count, prims.first );
			return;
		}

		// Set the geometry's vertex buffers, which needs points.
		if ( false === this.setVertexBuffers() )
		{
			return; // This is not an error.
		}

		// Draw the vertices.
		this.renderPassEncoder.draw (
			count, // The number of vertices to draw.
			1, // Number of instances to draw.
			prims.first, // The first vertex to draw.
			0  // First instance to draw.
		);

		// Performance info.
		this.addPerformanceInfo ( prims.topology, count );
	}

	/**
	 * Draw with a shader that reads the indices and points from storage
	 * buffers. There are no index or vertex buffers, and each triangle
	 * corner is a separate vertex.
	 * @param {Indexed | Arrays} prims - The primitives to draw.
	 * @param {IIndexArray | null} indices - The indices, if any.
	 * @param {number} count - The number of indices, or vertices if there
	 * are no indices.
	 * @param {number} first - The first vertex to draw.
	 */
	protected drawPulledVertices ( prims: ( Indexed | Arrays ), indices: ( IIndexArray | null ), count: number, first: number ) : void
	{
		// We need a shader and a geometry.
		const shader = this.#shader;
		const geometry = this.#geometry;
		if ( ( !shader ) || ( !geometry ) )
		{
			return;
		}

		// Set the buffers. This also returns how the shader reads the indices.
		const pass = this.renderPassEncoder;
		const mode = shader.setPulledVertices ( pass, { geometry, indices, key: prims } );
		if ( null === mode )
		{
			return; // The shader already said why, if it matters.
		}

		// Draw the vertices. There is one instance, and the first instance
		// tells the shader how to read the indices.
		pass.draw ( count, 1, first, mode );

		// Performance info.
		this.addPerformanceInfo ( prims.topology, count );
	}

	/**
	 * Set the vertex buffers of the geometry being drawn: the arrays that
	 * the pipeline reads, in its order.
	 * @returns {boolean} False if there is no geometry or it does not have
	 * all the arrays.
	 */
	protected setVertexBuffers() : boolean
	{
		// Handle no geometry.
		const geom = this.#geometry;
		if ( !geom )
		{
			return false;
		}

		// Get the buffers. We need them all to continue.
		const arrays = this.#vertexArrays;
		const buffers: GPUBuffer[] = [];
		for ( const name of arrays )
		{
			const buffer = geom[name]?.buffer;
			if ( !buffer )
			{
				return false;
			}
			buffers.push ( buffer );
		}

		// Set them.
		const pass = this.renderPassEncoder;
		buffers.forEach ( ( buffer, slot ) => { pass.setVertexBuffer ( slot, buffer ); } );

		// It worked.
		return true;
	}

	/**
	 * Count the triangles or lines that were drawn, if we keep that info.
	 * @param {GPUPrimitiveTopology} topology - The primitive topology.
	 * @param {number} numVertices - The number of vertices or indices drawn.
	 */
	protected addPerformanceInfo ( topology: GPUPrimitiveTopology, numVertices: number ) : void
	{
		if ( !KEEP_PERFORMANCE_INFO )
		{
			return;
		}
		const info = this.renderGraphInfo;
		switch ( topology )
		{
			case "triangle-list":
			{
				if ( 0 === ( numVertices % 3 ) )
				{
					info.numTriangles += ( numVertices / 3 );
				}
				break;
			}
			case "line-list":
			{
				if ( 0 === ( numVertices % 2 ) )
				{
					info.numLines += ( numVertices / 2 );
				}
				break;
			}
		}
	}

	/**
	 * Reset to the initial state.
	 */
	public reset() : void
	{
		// Nothing to do.
	}
}
