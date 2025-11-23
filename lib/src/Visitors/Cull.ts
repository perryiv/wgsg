///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Cull visitor class makes a render graph when visiting the scene.
//
///////////////////////////////////////////////////////////////////////////////

import { Multiply } from "./Multiply";
import { Root } from "../Render";
import { SolidColor } from "../Shaders";
import type { IRenderGraphInfo } from "../Types";
import {
	Geometry,
	Group,
	Node,
	ProjectionNode as Projection,
	Shape,
	State,
	Transform,
} from "../Scene";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below.
//
///////////////////////////////////////////////////////////////////////////////

interface ICullVisitorInput
{
	root?: Root,
	defaultState?: State
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Make the default state.
 * @returns {State} The default state.
 */
///////////////////////////////////////////////////////////////////////////////

const makeDefaultState = () : State =>
{
	return ( new State ( {
		name: "Cull visitor default state",
		shader: SolidColor.instance
	} ) );
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Cull visitor class.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class Cull extends Multiply
{
	#root: Root;
	#defaultState: State;
	#currentState: ( State | null ) = null;
	#info: ( IRenderGraphInfo | null ) = null;

	/**
	 * Construct the class.
	 * @class
	 * @param {ICullVisitorInput} input - The constructor input.
	 */
	constructor ( input?: ICullVisitorInput )
	{
		// Call this first.
		super();

		// Get the input or defaults.
		const root = ( input?.root ?? new Root() );
		const state = ( input?.defaultState ?? makeDefaultState() );

		// Set our members.
		this.#root = root;
		this.#defaultState = state;
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Visitors.Cull";
	}

	/**
	 * Get the root or throw an exception.
	 * @returns {Root} The root.
	 */
	public get root () : Root
	{
		const root = this.#root;
		if ( !root )
		{
			throw new Error ( "Getting invalid render graph root" );
		}
		return root;
	}

	/**
	 * Set the root.
	 * @param {Root} root - The root.
	 */
	public set root ( root: Root )
	{
		if ( !root )
		{
			throw new Error ( "Setting invalid render graph root" );
		}
		this.#root = root;
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
	 * Get the default state or throw an exception.
	 * @returns {State} The default state.
	 */
	public get defaultState () : State
	{
		const state = this.#defaultState;
		if ( !state )
		{
			throw new Error ( "Getting invalid default state" );
		}
		return state;
	}

	/**
	 * Set the default state.
	 * @param {State | null} state - The default state.
	 */
	public set defaultState ( state: ( State | null ) )
	{
		// This way supports setting a breakpoint.
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if ( !state )
		{
			state = makeDefaultState();
		}

		this.#defaultState = state;
	}

	/**
	 * Get the current state which might be the default.
	 * @returns {State} The current state.
	 */
	protected get currentState () : State
	{
		let state = this.#currentState;

		// This way supports setting a breakpoint.
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if ( !state )
		{
			state = this.defaultState;
		}

		return state;
	}

	/**
	 * Set the current state if given a valid one.
	 * @param {State | null} state - The current state.
	 */
	protected maybeSetCurrentState ( state: ( State | null ) )
	{
		if ( state )
		{
			this.#currentState = state;
		}
	}

	/**
	 * Set the current state every time.
	 * @param {State | null} state - The current state.
	 */
	protected alwaysSetCurrentState ( state: ( State | null ) )
	{
		this.#currentState = state;
	}

	/**
	 * Visit the group.
	 * @param {Group} group - The group node.
	 */
	public override visitGroup ( group: Group ) : void
	{
		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( group.state );

		// Call the base class's function.
		super.visitGroup ( group );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform node.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( tr.state );

		// Call the base class's function.
		super.visitTransform ( tr );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection node.
	 */
	public override visitProjection ( proj: Projection ) : void
	{
		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( proj.state );

		// Call the base class's function.
		super.visitProjection ( proj );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// Treat it like a shape.
		this.visitShape ( geom );
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape node.
	 */
	public override visitShape ( shape: Shape ) : void
	{
		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( shape.state );

		// Shortcuts.
		const root = this.root;
		const vm = this.viewMatrix;
		const pm = this.projMatrix;
		const state = this.currentState;
		const { shader } = state;
		const info = this.renderGraphInfo;

		// We need a shader.
		if ( !shader )
		{
			throw new Error ( `Shape ${shape.id} has no shader` );
		}

		// Get or make the containers we need.
		const layer = root.getLayer ( info, state.layer );
		const bin = layer.getBin ( info, state.bin );
		const pipeline = bin.getPipeline ( info, state );
		const pmg = pipeline.getProjMatrixGroup ( info, pm );
		const vmg = pmg.getViewMatrixGroup ( info, vm );
		const sg = vmg.getStateGroup ( info, state );

		// Add our shape.
		sg.addShape ( info, shape );

		// Do this last.
		super.visitShape ( shape );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The scene node.
	 */
	public override visitNode ( node: Node ) : void
	{
		super.visitNode ( node );
	}

	/**
	 * Reset to the initial state.
	 */
	public override reset() : void
	{
		this.root.clear();
		this.#currentState = null;
	}
}
