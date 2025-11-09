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

import { ShaderBase } from "../Shaders";
import { vec4 } from "gl-matrix";
import { Visitor as BaseClass } from "./Visitor";
import type { IRenderGraphInfo, IVector4 } from "../Types";
import {
	DEVELOPER_BUILD,
	Device,
	preMultiplyColor,
} from "../Tools";
import {
	Arrays,
	Geometry,
	Indexed,
	Shape,
	State,
	type IStateApplyInput,
} from "../Scene";
import {
	Bin,
	Layer,
	ModelMatrixGroup,
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

export interface IDrawVisitorInput
{
	context: GPUCanvasContext;
};


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
 * Draw visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Draw extends BaseClass
{
	#context: GPUCanvasContext;
	#depthTexture: ( GPUTexture | null ) = null;
	#clearColor: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ]; // Grey.
	#renderPassEncoder: ( GPURenderPassEncoder | null ) = null;
	#commandEncoder: ( GPUCommandEncoder | null ) = null;
	#geometry: ( Geometry | null ) = null;
	#info: ( IRenderGraphInfo | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IDrawVisitorInput} input - The input for the constructor.
	 * @param {GPUCanvasContext} input.context - The GPU canvas context to use for rendering.
	 */
	constructor ( { context }: IDrawVisitorInput )
	{
		// Call this first.
		super();

		// Check the input.
		if ( !context )
		{
			throw new Error ( "Draw visitor context input is invalid" );
		}
		if ( !( context instanceof GPUCanvasContext ) )
		{
			throw new Error ( "Draw visitor context input is not a GPUCanvasContext" );
		}

		// Set the members.
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
		const info = this.#info;
		if ( !info )
		{
			throw new Error ( "Getting invalid render graph info" );
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
	 * Get the GPU canvas context.
	 * @returns {GPUCanvasContext} The GPU canvas context.
	 */
	protected get context () : GPUCanvasContext
	{
		// Shortcut.
		const context = this.#context;

		// We should always have a valid context.
		if ( !context )
		{
			throw new Error ( "Attempting to get invalid context in draw visitor" );
		}

		// Return the context.
		return context;
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
		return preMultiplyColor ( this.#clearColor );
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
		if ( !dt || ( ( dt.width !== width ) || ( dt.height !== height ) ) )
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
	 */
	public draw ( root: Root ) : void
	{
		// Shortcut.
		const device = Device.instance.device;

		// Make a command encoder.
		const encoder = device.createCommandEncoder ( {
			label: `Command encoder for ${this.type}`
		} );
		this.#commandEncoder = encoder;

		// Shortcuts.
		const canvasTexture = this.context.getCurrentTexture();
		const depthTexture = this.getDepthTexture ( canvasTexture );

		// For debugging.
		canvasTexture.label = `Texture for ${this.type} ${this.id}`;

		// Make the render pass encoder.
		const pass = this.commandEncoder.beginRenderPass ( {
			label: `Render pass for ${this.type} ${this.id}`,
			colorAttachments: [ {
				view: canvasTexture.createView(),
				clearValue: this.preMultipliedClearColor,
				loadOp: "clear",
				storeOp: "store"
			} ],
			depthStencilAttachment: {
				view: depthTexture.createView(),
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: 'store',
			},
		} );
		this.#renderPassEncoder = pass;

		// console.log ( `Render tree root ${root.id} has ${root.numLayers} layers` );

		// Iterate over the layers in order.
		root.forEachLayer ( ( layer: Layer ) =>
		{
			// Draw the layer.
			this.drawLayer ( layer );
		} );

		// End this render pass.
		pass.end();

		// Submit the commands to the GPU.
		device.queue.submit ( [ encoder.finish() ] );

		// Reset these.
		this.#renderPassEncoder = null;
		this.#commandEncoder = null;
		this.#geometry = null;
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
		const { shader, topology } = pipeline;

		// Set the render pass' pipeline.
		pass.setPipeline ( shader.getPipeline ( topology ) );

		// console.log ( `Pipeline ${pipeline.id} has ${pipeline.numProjMatrices} projection matrices` );

		// Draw the projection matrix groups.
		pipeline.forEachProjMatrixGroup ( ( pmg: ProjMatrixGroup ) =>
		{
			this.drawProjMatrixGroup ( pipeline, pmg );
		} );
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

		// console.log ( `ProjMatrix ${pmg.id} has ${pmg.numModelMatrices} model matrices` );

		// Draw the model matrix groups.
		pmg.forEachModelMatrixGroup ( ( mmg: ModelMatrixGroup ) =>
		{
			this.drawModelMatrix ( pipeline, pmg, mmg );
		} );
	}

	/**
	 * Draw the model matrix group.
	 * @param {Pipeline} pipeline - The pipeline to use.
	 * @param {ProjMatrix} pmg - The projection matrix group.
	 * @param {ModelMatrix} mmg - The model matrix group to draw.
	 */
	protected drawModelMatrix ( pipeline: Pipeline, pmg: ProjMatrixGroup, mmg: ModelMatrixGroup ) : void
	{
		// Set the pipeline's model matrix.
		pipeline.modelMatrix = mmg.matrix;

		// console.log ( `ModelMatrix ${mmg.id} has ${mmg.numStateGroups} state groups` );

		// Draw the state groups.
		mmg.forEachStateGroup ( ( sg: StateGroup ) =>
		{
			this.drawStateGroup ( pipeline, pmg, mmg, sg );
		} );
	}

	/**
	 * Draw the state group.
	 * @param {Pipeline} pipeline - The pipeline to use.
	 * @param {ProjMatrixGroup} pmg - The projection matrix group.
	 * @param {ModelMatrixGroup} mmg - The model matrix group.
	 * @param {StateGroup} sg - The state group to draw.
	 */
	protected drawStateGroup ( pipeline: Pipeline, pmg: ProjMatrixGroup, mmg: ModelMatrixGroup, sg: StateGroup ) : void
	{
		// Shortcuts.
		const { state } = sg;

		// console.log ( `State group ${sg.id} has state ${state.id} and ${sg.numShapes} shapes` );

		// Input for applying and resetting the state.
		const input: IStateApplyInput = {
			state,
			shader: pipeline.shader,
			projMatrix: pmg.matrix,
			modelMatrix: mmg.matrix,
		};

		// Apply the state.
		state.doApply ( input );

		// Configure the render pass now that the state has been applied.
		const shader = requireShader ( state );
		shader.configureRenderPass ( this.renderPassEncoder, pipeline.topology );

		// Draw the shapes.
		sg.forEachShape ( ( shape: Shape ) =>
		{
			// The shape decides which function to call in order to draw itself.
			shape.accept ( this );
		} );

		// Reset the state.
		state.doReset ( input );
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

		// Handle no geometry.
		const geom = this.#geometry;
		if ( !geom )
		{
			return; // This is not an error.
		}

		// We need points to continue.
		const points = geom.points?.buffer;
		if ( !points )
		{
			return; // This is not an error.
		}

		// We also need indices to continue.
		const indices = prims.indices?.buffer;
		if ( !indices )
		{
			return; // This is not an error.
		}

		// Get the render pass encoder.
		const pass = this.renderPassEncoder;

		// Set the points and index buffer.
		pass.setVertexBuffer ( 0, points );
		pass.setIndexBuffer ( indices, prims.indexType );

		// Set the buffer of normals if we can.
		const normals = geom.normals?.buffer;
		if ( normals )
		{
			pass.setVertexBuffer ( 1, normals );
		}

		// Set the buffer of colors if we can.
		const colors = geom.colors?.buffer;
		if ( colors )
		{
			pass.setVertexBuffer ( 2, colors );
		}

		// Set the buffer of texture coordinates if we can.
		const texCoords = geom.texCoords?.buffer;
		if ( texCoords )
		{
			pass.setVertexBuffer ( 3, texCoords );
		}

		// Draw the indexed primitives.
		pass.drawIndexed (
			numIndices, // The number of indices to draw.
			1, // Number of instances to draw.
			0, // Offset into the index buffer, in indices, to begin drawing from.
			0, // Added to each index value before indexing into the vertex buffers.
			0  // First instance to draw.
		);

		// Performance info.
		if ( DEVELOPER_BUILD )
		{
			const info = this.renderGraphInfo;
			switch ( prims.mode )
			{
				case "triangle-list":
				{
					if ( 0 === ( numIndices % 3 ) )
					{
						info.numTriangles += ( numIndices / 3 );
					}
				}
			}
		}
	}

	/**
	 * Draw the arrays of primitives.
	 * @param {Arrays} arrays - The arrays of primitives to draw.
	 */
	public visitArrays ( arrays: Arrays ): void
	{
		console.log ( `Drawing '${arrays.type}' ${arrays.id}` );

		// Shortcuts.
		// const pass = this.pass;

		// Draw the arrays of primitives.
		// pass.setVertexBuffer ( 0, arrays.vertexBuffer );
		// pass.drawArrays ( arrays.vertexCount, 1, 0, 0 );
	}

	/**
	 * Reset to the initial state.
	 */
	public reset() : void
	{
		// Nothing to do.
	}
}
