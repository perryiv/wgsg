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

import { Device, IDENTITY_MATRIX } from "../Tools";
import { IMatrix44, IVector4 } from "../Types";
import { mat4, vec4 } from "gl-matrix";
import { Visitor as BaseClass } from "./Visitor";
import {
	Arrays,
	Geometry,
	Indexed,
	Shape,
} from "../Scene";
import {
	Bin,
	Layer,
	ModelMatrix,
	Pipeline,
	ProjMatrix,
	Root,
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
 * Draw visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Draw extends BaseClass
{
	#context: GPUCanvasContext;
	#clearColor: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ]; // Grey.
	#renderPassEncoder: ( GPURenderPassEncoder | null ) = null;
	#commandEncoder: ( GPUCommandEncoder | null ) = null;
	#projMatrix:	IMatrix44 = [ ...IDENTITY_MATRIX ]; // Has to be a copy.
	#modelMatrix: IMatrix44 = [ ...IDENTITY_MATRIX ]; // Has to be a copy.
	#geometry: ( Geometry | null ) = null;

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
	public set clearColor ( color: IVector4 )
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
		const c = this.#clearColor;
		const a = c[3];
		return [
			c[0] * a, // Red
			c[1] * a, // Green
			c[2] * a, // Blue
			a         // Alpha
		];
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
		const context = this.context;
		const texture = context.getCurrentTexture();
		const view = texture.createView();
		const clearValue = this.preMultipliedClearColor;
		const loadOp: GPULoadOp = "clear";
		const storeOp: GPUStoreOp = "store";

		// For debugging.
		texture.label = `Texture for ${this.type} ${this.id}`;

		// Make the render pass encoder.
		const pass = this.commandEncoder.beginRenderPass ( {
			label: `Render pass for ${this.type} ${this.id}`,
			colorAttachments: [ { view, clearValue, loadOp, storeOp } ]
		} );
		this.#renderPassEncoder = pass;

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
		mat4.copy ( this.#projMatrix,  IDENTITY_MATRIX );
		mat4.copy ( this.#modelMatrix, IDENTITY_MATRIX );
		this.#geometry = null;
	}

	/**
	 * Draw the layer.
	 * @param {Layer} layer - The layer to draw.
	 */
	protected drawLayer ( layer: Layer ) : void
	{
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
		const pass = this.#renderPassEncoder;

		// Make sure there is a render pass.
		if ( !pass )
		{
			throw new Error ( `Invalid render pass in ${this.type} ${this.id}` );
		}

		// Shortcuts.
		const { state } = pipeline;
		const { shader } = state;

		// Make sure there is a shader.
		if ( !shader )
		{
			throw new Error ( "Pipeline has invalid shader" );
		}

		// Configure the render pass.
		shader.configureRenderPass ( pass );

		// Draw the projection matrix groups.
		pipeline.forEachProjMatrix ( ( projMatrix: ProjMatrix ) =>
		{
			this.drawProjMatrix ( projMatrix );
		} );
	}

	/**
	 * Draw the projection matrix group.
	 * @param {ProjMatrix} projMatrix - The projection matrix group to draw.
	 */
	protected drawProjMatrix ( projMatrix: ProjMatrix ) : void
	{
		// This is now the current projection matrix.
		mat4.copy ( this.#projMatrix, projMatrix.matrix );

		// Draw the model matrix groups.
		projMatrix.forEachModelMatrix ( ( modelMatrix: ModelMatrix ) =>
		{
			this.drawModelMatrix ( modelMatrix );
		} );
	}

	/**
	 * Draw the model matrix group.
	 * @param {ModelMatrix} modelMatrix - The model matrix group to draw.
	 */
	protected drawModelMatrix ( modelMatrix: ModelMatrix ) : void
	{
		// This is now the current model matrix.
		mat4.copy ( this.#modelMatrix, modelMatrix.matrix );

		// Draw the shapes.
		modelMatrix.forEachShape ( ( shape: Shape ) =>
		{
			// The shape decides which function to call in order to draw itself.
			shape.accept ( this );
		} );
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
		const pass = this.#renderPassEncoder;
		if ( !pass )
		{
			throw new Error ( "Attempting to draw indexed primitives without a render pass" );
		}

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
