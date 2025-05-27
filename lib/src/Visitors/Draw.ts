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
import { IDENTITY_MATRIX } from "../Tools";
import { IMatrix44 } from "../Types";
import { mat4 } from "gl-matrix";
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
import { Shape, State } from "../Scene";


///////////////////////////////////////////////////////////////////////////////
/**
 * Draw visitor class.
 * @abstract
 */
///////////////////////////////////////////////////////////////////////////////

export class Draw extends Base // Note: Does not inherit from Visitor.
{
	#state: ( State | null ) = null;
	#projMatrix: IMatrix44 = IDENTITY_MATRIX;
	#modelMatrix: IMatrix44 = IDENTITY_MATRIX;

	/**
	 * Construct the class.
	 * @class
	 */
	constructor()
	{
		// Call this first.
		super();
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
	 * Visit the states.
	 * @param {IStateMap} states - The states to visit.
	 */
	public visitStates ( states: Map < string, IStateData > ) : void
	{
		// Iterate over the states in the map.
		states.forEach ( ( { state, modelMatrices }: IStateData ) =>
		{
			// Set the current state.
			this.#state = state;

			// Visit the model matrices.
			this.visitModelMatrices ( modelMatrices );
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
		state.apply ( {
			projMatrix: this.#projMatrix,
			modelMatrix,
		} );

		// Visit the shapes.
		this.visitShapes ( shapes );

		// Reset the state.
		state.reset();
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
