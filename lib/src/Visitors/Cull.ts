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

import { Frustum, ViewFrustum } from "../Math";
import { makeRenderGraphInfo, Root } from "../Render";
import { Multiply as BaseClass } from "./Multiply";
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

export class Cull extends BaseClass
{
	#root: Root;
	#defaultState: State;
	#currentState: ( State | null ) = null;
	#info: ( IRenderGraphInfo | null ) = null;
	#matrix = -1; // The index of the current matrix in the render graph, or -1.
	#frustum: ( Frustum | null ) = null; // In the current node's coordinates.
	#topFrustum: ( Frustum | null ) = null; // The one that was set.
	#frustums: Frustum[] = []; // Reused for each depth of transforms.
	#depth = 0; // How many transforms deep we are.
	#allInside = false; // True when the current node is all inside the frustum.

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
	 * Get the frustum that nodes are culled with.
	 * @returns {Frustum | null} The frustum, or null if nothing is culled.
	 */
	public get frustum () : ( Readonly<Frustum> | null )
	{
		return this.#frustum;
	}

	/**
	 * Set the frustum that nodes are culled with, in the coordinates of the
	 * top of the scene. When the camera is a transform in the scene, like the
	 * viewer's, that's eye coordinates: make it with ViewFrustum from the
	 * projection matrix. Nodes outside it are not put in the render graph.
	 * It's copied. Set it before each traversal; null turns culling off.
	 * @param {Frustum | null} frustum - The frustum, or null.
	 */
	public set frustum ( frustum: ( Readonly<Frustum> | null ) )
	{
		this.#topFrustum = ( frustum ? frustum.clone() : null );
		this.#frustum = this.#topFrustum;
	}

	/**
	 * See if the node is outside the frustum, so that it and everything under
	 * it can be skipped. It also notes when the node is all inside, so that
	 * the nodes under it don't need to be tested. Spheres are tested first,
	 * and for a shape whose sphere crosses the frustum, its box is too, since
	 * a shape's sphere is the one around its box. Nodes that don't add to the
	 * bounds are never culled, and neither are nodes that have them under
	 * them, since their bounds may not hold everything under them. Nodes
	 * with invalid bounds are not culled either.
	 * @param {Node} node - The node.
	 * @returns {boolean} True if the node is outside and should be skipped.
	 */
	protected isOutside ( node: Node ) : boolean
	{
		// Is there anything to test?
		const frustum = this.#frustum;
		if ( !frustum || this.#allInside || ( false === node.addsToBounds ) )
		{
			return false;
		}

		// Nodes without bounds have nothing to draw, or don't say where it is.
		const sphere = node.bounds;
		if ( false === sphere.valid )
		{
			return false;
		}

		// Test the sphere, and then the box of a shape if we need to.
		let where = frustum.classifySphere ( sphere );
		if ( ( "intersects" === where ) && ( node instanceof Shape ) )
		{
			where = frustum.classifyBox ( node.box );
		}

		// Skip it if it's outside, unless something under it may not be.
		if ( "outside" === where )
		{
			if ( node.hasNodesOutsideBounds )
			{
				return false;
			}
			this.renderGraphInfo.numCulled++;
			return true;
		}

		// The nodes under one that is all inside are too.
		if ( "inside" === where )
		{
			this.#allInside = true;
		}

		return false;
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
		// Skip invisible nodes.
		if ( false === group.visible )
		{
			return;
		}

		// Skip it if it's out of view.
		const allInside = this.#allInside;
		if ( this.isOutside ( group ) )
		{
			return;
		}

		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( group.state );

		// Call the base class's function.
		super.visitGroup ( group );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
		this.#allInside = allInside;
	}

	/**
	 * Visit the transform.
	 * @param {Transform} tr - The transform node.
	 */
	public override visitTransform ( tr: Transform ) : void
	{
		// Skip invisible nodes.
		if ( false === tr.visible )
		{
			return;
		}

		// Skip it if it's out of view. Its bounds are in our coordinates, the
		// ones its matrix takes its children's to.
		const allInside = this.#allInside;
		if ( this.isOutside ( tr ) )
		{
			return;
		}

		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( tr.state );

		// The shapes below have a new matrix. It's added to the render graph
		// when the first of them is.
		const matrix = this.#matrix;
		this.#matrix = -1;

		// Put the frustum in the coordinates of the children, unless they don't
		// need testing. The copy is reused for this depth in later transforms.
		const frustum = this.#frustum;
		if ( frustum && !this.#allInside )
		{
			const depth = this.#depth;
			let local = this.#frustums[depth];
			if ( !local )
			{
				local = frustum.clone();
				this.#frustums[depth] = local;
			}
			else
			{
				local.copy ( frustum );
			}
			local.toLocal ( tr.matrix );
			this.#frustum = local;
		}

		// Call the base class's function.
		++this.#depth;
		super.visitTransform ( tr );
		--this.#depth;

		// Restore the original frustum, matrix, and state.
		this.#frustum = frustum;
		this.#matrix = matrix;
		this.alwaysSetCurrentState ( original );
		this.#allInside = allInside;
	}

	/**
	 * Visit the projection.
	 * @param {Projection} proj - The projection node.
	 */
	public override visitProjection ( proj: Projection ) : void
	{
		// Skip invisible nodes.
		if ( false === proj.visible )
		{
			return;
		}

		// The nodes under it are seen with its projection, so they are culled
		// with its frustum, not ours. That frustum is in eye coordinates, and
		// the model-view matrix takes our coordinates there.
		const frustum = this.#frustum;
		const allInside = this.#allInside;
		if ( frustum )
		{
			const local = new ViewFrustum ( proj.matrix );
			local.toLocal ( this.viewMatrix );
			this.#frustum = local;
			this.#allInside = false;
		}

		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( proj.state );

		// Call the base class's function.
		super.visitProjection ( proj );

		// Restore the original frustum and state.
		this.#frustum = frustum;
		this.#allInside = allInside;
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Visit the geometry.
	 * @param {Geometry} geom - The geometry node.
	 */
	public override visitGeometry ( geom: Geometry ) : void
	{
		// Skip invisible nodes.
		if ( false === geom.visible )
		{
			return;
		}

		// Treat it like a shape.
		this.visitShape ( geom );
	}

	/**
	 * Visit the shape.
	 * @param {Shape} shape - The shape node.
	 */
	public override visitShape ( shape: Shape ) : void
	{
		// Skip invisible nodes.
		if ( false === shape.visible )
		{
			return;
		}

		// Skip it if it's out of view.
		const allInside = this.#allInside;
		if ( this.isOutside ( shape ) )
		{
			return;
		}
		this.#allInside = allInside;

		// Save the current state and set the new one.
		const original = this.currentState;
		this.maybeSetCurrentState ( shape.state );

		// Shortcuts.
		const root = this.root;
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
		const bin = layer.getBin ( info, state.bin, state.binSort );
		const vertexColors = ( ( shape instanceof Geometry ) && shape.hasVertexColors );
		const texCoords = ( ( shape instanceof Geometry ) && shape.hasTexCoords );
		const pipeline = bin.getPipeline ( info, state, vertexColors, texCoords );
		const pmg = pipeline.getProjMatrixGroup ( info, this.projMatrix, this.projMatrixKey );
		const sg = pmg.getStateGroup ( info, state );

		// Add the current matrix, if this is the first shape that uses it.
		if ( this.#matrix < 0 )
		{
			this.#matrix = root.addMatrix ( info, this.viewMatrix );
		}

		// Add our shape, with its depth if the bin is sorted by it.
		const depth = ( bin.sorted ? this.getDepth ( shape ) : 0 );
		bin.addShape ( info, { pipeline, pmg, sg, shape, matrix: this.#matrix, depth } );

		// Do this last.
		super.visitShape ( shape );

		// Restore the original state.
		this.alwaysSetCurrentState ( original );
	}

	/**
	 * Get the depth of the center of the shape's bounds, as the depth test
	 * sees it: its projected z over w, which is larger when it's farther.
	 * @param {Shape} shape - The shape.
	 * @returns {number} The depth, or zero if the shape has no bounds. A
	 * center behind the eye is the nearest of all.
	 */
	protected getDepth ( shape: Shape ) : number
	{
		const sphere = shape.bounds;
		if ( false === sphere.valid )
		{
			return 0;
		}

		// The center in view space.
		const [ x, y, z ] = sphere.center;
		const m = this.viewMatrix;
		const vx = ( m[0] * x ) + ( m[4] * y ) + ( m[8] * z ) + m[12];
		const vy = ( m[1] * x ) + ( m[5] * y ) + ( m[9] * z ) + m[13];
		const vz = ( m[2] * x ) + ( m[6] * y ) + ( m[10] * z ) + m[14];

		// Its projected z and w.
		const p = this.projMatrix;
		const pz = ( p[2] * vx ) + ( p[6] * vy ) + ( p[10] * vz ) + p[14];
		const pw = ( p[3] * vx ) + ( p[7] * vy ) + ( p[11] * vz ) + p[15];
		return ( ( pw > 0 ) ? ( pz / pw ) : -Infinity );
	}

	/**
	 * Visit the node.
	 * @param {Node} node - The scene node.
	 */
	public override visitNode ( node: Node ) : void
	{
		// Skip invisible nodes.
		if ( false === node.visible )
		{
			return;
		}

		super.visitNode ( node );
	}

	/**
	 * Reset to the initial state.
	 */
	public override reset() : void
	{
		this.root.clear();
		this.#currentState = null;
		this.#matrix = -1;
		this.#depth = 0;
		this.#allInside = false;
		this.#frustum = this.#topFrustum;
	}
}
