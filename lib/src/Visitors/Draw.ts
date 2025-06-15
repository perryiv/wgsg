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
import { IMatrix44 } from "../Types";
import { mat4 } from "gl-matrix";
import { Shape, State } from "../Scene";
import { Device, makeIdentity } from "../Tools";
import type {
	ILayer,
	ILayerMap,
	IMatrixAsString,
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
	#state: ( State | null ) = null;
	#projMatrix:  IMatrix44 = makeIdentity(); // Has to be a copy.
	#modelMatrix: IMatrix44 = makeIdentity(); // Has to be a copy.
	#pipeline: ( GPURenderPipeline | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {IDrawVisitorInput} input - The input for the constructor.
	 * @param {Device} input.device - The GPU device to use for rendering.
	 */
	constructor ( { device }: IDrawVisitorInput )
	{
		// Call this first.
		super();

		// Check the input.
		if ( !device )
		{
			throw new Error ( "Draw visitor device input is invalid" );
		}
		if ( !( device instanceof Device ) )
		{
			throw new Error ( "Draw visitor device input is not a GPUDevice" );
		}

		// Set the device.
		this.#device = device;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public getClassName() : string
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
		// Shortcut.
		const pipeline = this.#pipeline;

		// We should always have a valid pipeline.
		if ( !pipeline )
		{
			throw new Error ( "Attempting to get invalid pipeline in draw visitor" );
		}

		// Return the pipeline.
		return pipeline;
	}

	/**
	 * Visit the layers.
	 * @param {ILayerMap} layers - The layers to visit.
	 */
	public visitLayers ( layers: ILayerMap ) : void
	{
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
	public visitProjMatrices ( projMatrices: Map < string, IProjMatrixData > ) : void
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
	 * Set the pipeline based on the current state.
	 */
	private setPipeline() : void
	{
		// Shortcuts.
		const device = this.device;
		const state = this.state;
		const shader = state.shader;
		const sm = shader?.module;

		// Make sure we have a shader module.
		if ( !sm )
		{
			throw new Error ( `Shader module is not defined in state ${state.name}` );
		}

		// Make the new pipeline.
		const pipeline = device.device.createRenderPipeline ( {
			label: "Red triangle pipeline",
			layout: "auto",
			vertex: {
				entryPoint: "vs",
				module: shader.module,
			},
			fragment: {
				entryPoint: "fs",
				module: shader.module,
				targets: [ { format: device.preferredFormat } ],
			},
		} );

		// Set our member.
		this.#pipeline = pipeline;
	}

	/**
	 * Visit the state.
	 * @param {IStateData} sd - The state-data to visit.
	 */
	public visitState ( { state, modelMatrices }: IStateData ) : void
	{
		// Set the current state.
		this.#state = state;

		// Set the pipeline.
		this.setPipeline();

		// Visit the model matrices.
		this.visitModelMatrices ( modelMatrices );
	}

	/**
	 * Visit the states.
	 * @param {IStateMap} states - The states to visit.
	 */
	public visitStates ( states: Map < string, IStateData > ) : void
	{
		// Iterate over the states in the map.
		states.forEach ( ( sd: IStateData ) =>
		{
			this.visitState ( sd );
		} );
	}

	/**
	 * Visit the model matrices.
	 * @param {IModelMatrixMap} modelMatrices - The model matrices to visit.
	 */
	public visitModelMatrices ( modelMatrices: Map < IMatrixAsString, IModelMatrixData > ) : void
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
		const state = this.#state;

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
	}

	/**
	 * Reset to the initial state.
	 */
	public reset() : void
	{
		// Nothing to do.
	}
}
