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

import { Base } from "../Base/Base";
import { IMatrix44, IVector4 } from "../Types";
import { mat4, vec4 } from "gl-matrix";
import { Shape, State } from "../Scene";
import { Device, makeIdentity } from "../Tools";
import type {
	ILayer,
	ILayerMap,
	IModelMatrixData,
	IModelMatrixMap,
	IProjMatrixData,
	IProjMatrixMap,
	IStateData,
	IStateMap,
} from "../Render";


///////////////////////////////////////////////////////////////////////////////
//
//	Interfaces used below.
//
///////////////////////////////////////////////////////////////////////////////

export interface IDrawVisitorInput
{
	context: GPUCanvasContext;
	device: Device;
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Draw visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Draw extends Base // Note: Does not inherit from Visitor.
{
	#device: Device;
	#context: GPUCanvasContext;
	#state: ( State | null ) = null;
	#projMatrix:	IMatrix44 = makeIdentity(); // Has to be a copy.
	#modelMatrix: IMatrix44 = makeIdentity(); // Has to be a copy.
	#clearColor: IVector4 = [ 0.5, 0.5, 0.5, 1.0 ]; // Grey.
	#encoder: ( GPUCommandEncoder | null ) = null;
	#pass: ( GPURenderPassEncoder | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IDrawVisitorInput} input - The input for the constructor.
	 * @param {GPUCanvasContext} input.context - The GPU canvas context to use for rendering.
	 * @param {Device} input.device - The GPU device to use for rendering.
	 */
	constructor ( { context, device }: IDrawVisitorInput )
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
		if ( !device )
		{
			throw new Error ( "Draw visitor device input is invalid" );
		}
		if ( !( device instanceof Device ) )
		{
			throw new Error ( "Draw visitor device input is not a GPUDevice" );
		}

		// Set the members.
		this.#context = context;
		this.#device = device;
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
	 * Get the current state.
	 * @returns {State} The current state.
	 */
	protected get state () : State
	{
		// Shortcut.
		const state = this.#state;

		// We should always have a valid state.
		if ( !state )
		{
			throw new Error ( "Attempting to get invalid state in draw visitor" );
		}

		// Return the state.
		return state;
	}

	/**
	 * Set the current state.
	 * @param {State | null} state - The state to set, or null to reset.
	 */
	protected set state ( state: ( State | null ) )
	{
		this.#state = state;
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
	 * Get the device.
	 * @returns {Device} The GPU device wrapper.
	 */
	protected get device () : Device
	{
		// Shortcut.
		const device = this.#device;

		// We should always have a valid device.
		if ( !device )
		{
			throw new Error ( "Attempting to get invalid device in draw visitor" );
		}

		// Return the device.
		return device;
	}

	/**
	 * Get the pipeline.
	 * @returns {GPURenderPipeline} The current render pipeline.
	 */
	protected get pipeline () : GPURenderPipeline
	{
		// Shortcuts.
		const state = this.state;
		const shader = state.shader;

		// We need a valid shader to proceed.
		if ( !shader )
		{
			throw new Error ( `Shader is not defined in state '${state.name}' when getting pipeline in draw visitor` );
		}

		// Get the pipeline from the shader.
		const pipeline = shader.pipeline;

		// We should always have a valid pipeline.
		if ( !pipeline )
		{
			throw new Error ( "Attempting to get invalid pipeline in draw visitor" );
		}

		// Return the pipeline.
		return pipeline;
	}

	/**
	 * Get the render command encoder.
	 * @returns {GPURenderCommandEncoder} The render command encoder.
	 */
	protected get encoder () : GPUCommandEncoder
	{
		// Shortcut.
		const encoder = this.#encoder;

		// We should always have a valid encoder.
		if ( !encoder )
		{
			throw new Error ( "Attempting to get invalid encoder in draw visitor" );
		}

		// Return the encoder.
		return encoder;
	}

	/**
	 * Set the render command encoder.
	 * @param {GPURenderCommandEncoder} encoder - The render command encoder to use.
	 */
	protected set encoder ( encoder: ( GPUCommandEncoder | null ) )
	{
		this.#encoder = encoder;
	}

	/**
	 * Get the render pass.
	 * @returns {GPURenderPassEncoder} The render pass.
	 */
	protected get pass () : GPURenderPassEncoder
	{
		// Shortcut.
		const pass = this.#pass;

		// We should always have a valid pass.
		if ( !pass )
		{
			throw new Error ( "Attempting to get invalid render pass in draw visitor" );
		}

		// Return the pass.
		return pass;
	}

	/**
	 * Set the render pass.
	 * @param {GPURenderPassEncoder | null} pass - The render pass, or null to reset.
	 */
	protected set pass ( pass: ( GPURenderPassEncoder | null ) )
	{
		this.#pass = pass;
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
		// Make the background color. We have to pre-multiply by the alpha value.
		const color: IVector4 = [ 0, 0, 0, 0 ];
		{
			const c = this.clearColor;
			const a = c[3];
			color[0] = c[0] * a; // Red
			color[1] = c[1] * a; // Green
			color[2] = c[2] * a; // Blue
			color[3] = a;        // Alpha
		}

		// Return the pre-multiplied color.
		return color;
	}

	/**
	 * Visit the layers.
	 * @param {ILayerMap} layers - The layers to visit.
	 */
	public visitLayers ( layers: ILayerMap ) : void
	{
		// Make a command encoder.
		this.encoder = this.device.makeEncoder ( "draw_visitor_command_encoder" );

		// Make the background color. We have to pre-multiply by the alpha value.
		const color: IVector4 = [ 0, 0, 0, 0 ];
		{
			const c = this.clearColor;
			const a = c[3];
			color[0] = c[0] * a; // Red
			color[1] = c[1] * a; // Green
			color[2] = c[2] * a; // Blue
			color[3] = a;        // Alpha
		}

		// Iterate over the layers in the map in numerical order using the key.
		const keys: number[] = Array.from ( layers.keys() );
		keys.sort ( ( a, b ) => { return ( a - b ); } );
		for ( const key of keys )
		{
			// Get the layer.
			const layer = layers.get ( key );

			// We should always have a layer.
			if ( !layer )
			{
				throw new Error ( `Layer ${key} not found in the maps of layers` );
			}

			// Visit the layer.
			this.visitLayer ( layer );
		}

		// Submit the commands to the GPU.
		this.device.queue.submit ( [ this.encoder.finish() ] );

		// Reset the encoder.
		this.encoder = null;
	}

	/**
	 * Visit the layer.
	 * @param {ILayer} layer - The layer to visit.
	 */
	public visitLayer ( layer: ILayer ) : void
	{
		// Visit the clipped projection matrices.
		this.visitProjMatrices ( layer.clipped );

		// Visit the unclipped projection matrices.
		this.visitProjMatrices ( layer.unclipped );
	}

	/**
	 * Visit the projection matrices.
	 * @param {IProjMatrixMap} projMatrices - The projection matrices to visit.
	 */
	public visitProjMatrices ( projMatrices: IProjMatrixMap ) : void
	{
		// Iterate over the projection matrices in the map.
		projMatrices.forEach ( ( projMatrixData: IProjMatrixData ) =>
		{
			// Visit the projection matrix data.
			this.visitProjMatrixData ( projMatrixData );
		} );
	}

	/**
	 * Visit the projection matrix data.
	 * @param {IProjMatrixData} projMatrixData - The projection matrix data to visit.
	 */
	public visitProjMatrixData ( projMatrixData: IProjMatrixData ) : void
	{
		// Get the data.
		const { projMatrix, states } = projMatrixData;

		// These should always be valid.
		if ( !projMatrix )
		{
			throw new Error ( "Projection matrix is not defined" );
		}
		if ( !states )
		{
			throw new Error ( "States are not defined for the projection matrix" );
		}

		// Set our current projection matrix.
		mat4.copy ( this.#projMatrix, projMatrix );

		// Visit the states.
		this.visitStates ( states );
	}

	/**
	 * Visit the states.
	 * @param {IStateMap} states - The states to visit.
	 */
	public visitStates ( states: IStateMap ) : void
	{
		// Iterate over the states in the map.
		states.forEach ( ( sd: IStateData ) =>
		{
			this.visitState ( sd );
		} );
	}

	/**
	 * Visit the state.
	 * @param {IStateData} sd - The state-data to visit.
	 */
	public visitState ( { state, modelMatrices }: IStateData ) : void
	{
		// Set the current state.
		this.state = state;

		// Make the render pass descriptor.
		const renderPassDescriptor: GPURenderPassDescriptor = {
			label: "draw_visitor_default_render_pass_descriptor",
			colorAttachments: [
			{
				view: this.context.getCurrentTexture().createView(),
				clearValue: this.preMultipliedClearColor,
				loadOp: "clear",
				storeOp: "store"
			} ]
		};

		// Make and configure a render pass.
		const pass = this.encoder.beginRenderPass ( renderPassDescriptor );
		pass.label = `draw_visitor_render_pass_for_state_${state.name}`;
		pass.setPipeline ( this.pipeline );

		// This is important.
		this.pass = pass;

		// Visit the model matrices.
		this.visitModelMatrices ( modelMatrices );

		// End the render pass.
		pass.end();

		// Reset these.
		this.pass = null;
		this.state = null;
	}

	/**
	 * Visit the model matrices.
	 * @param {IModelMatrixMap} modelMatrices - The model matrices to visit.
	 */
	public visitModelMatrices ( modelMatrices: IModelMatrixMap ) : void
	{
		// Iterate over the model matrices in the map.
		modelMatrices.forEach ( ( modelMatrixData: IModelMatrixData ) =>
		{
			// Visit the model matrix data.
			this.visitModelMatrixData ( modelMatrixData );
		} );
	}

	/**
	 * Visit the model matrix data.
	 * @param {IModelMatrixData} modelMatrixData - The model matrix data to visit.
	 */
	public visitModelMatrixData ( modelMatrixData: IModelMatrixData ) : void
	{
		// Get input.
		const { modelMatrix, shapes } = modelMatrixData;

		// Shortcut.
		const state = this.state;

		// We should always have a valid state.
		if ( !state )
		{
			throw new Error ( "State is not defined when visiting model matrices" );
		}

		// Set our current model matrix.
		mat4.copy ( this.#modelMatrix, modelMatrix );

		// Apply the state.
		state.doApply ( {
			state,
			projMatrix: this.#projMatrix,
			modelMatrix,
		} );


		// Visit the shapes.
		this.visitShapes ( shapes );

		// Reset the state.
		state.doReset();
	}

	/**
	 * Visit the shapes.
	 * @param {Shape[]} shapes - The shapes to visit.
	 */
	public visitShapes ( shapes: Shape[] ) : void
	{
		// Iterate over the shapes.
		for ( const shape of shapes )
		{
			// Draw the shape.
			this.drawShape ( shape );
		}
	}

	/**
	 * Draw the shape.
	 * @param {Shape} shape - The shape to draw.
	 */
	public drawShape ( shape: Shape ) : void
	{
		console.log ( `Drawing ${shape.type} ${shape.id}` );

		// Example: Draw a triangle (3 vertices).
		this.pass.draw ( 3 );
	}

	/**
	 * Reset to the initial state.
	 */
	public reset() : void
	{
		// Nothing to do.
	}
}
