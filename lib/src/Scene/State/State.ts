///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Class that contains the state of a shape.
//
///////////////////////////////////////////////////////////////////////////////

import { Attribute } from "./Attribute";
import { Color } from "./Attributes/Color";
import { DEVELOPER_BUILD } from "../../Tools/Environment";
import { Material } from "./Attributes/Material";
import { Base as BaseClass, replaceReference } from "../../Base";
import { IMatrix44 } from "../../Types";
import { ShaderBase, type IPipelineOptions } from "../../Shaders";


///////////////////////////////////////////////////////////////////////////////
//
//	Types used below and elsewhere.
//
///////////////////////////////////////////////////////////////////////////////

export interface IStateApplyInput
{
	state: State;
	shader: ShaderBase;
	projMatrix: IMatrix44;
}

export type IStateResetInput = IStateApplyInput;
export type IStateApplyFunction = ( ( input: IStateApplyInput ) => void );
export type IStateResetFunction = ( ( input: IStateResetInput ) => void );

export interface IStateConstructorInput
{
	name?: string;
	layer?: number;
	bin?: number;
	shader?: ShaderBase;
	topology?: GPUPrimitiveTopology;
	apply?: IStateApplyFunction;
	reset?: IStateResetFunction;
}

export type IStateAttributes = Map < string, Attribute >;


///////////////////////////////////////////////////////////////////////////////
/**
 * The function that applies the state.
 * @param {IStateApplyInput} input - The input for applying the state.
 * @returns {void}
 */
///////////////////////////////////////////////////////////////////////////////

export const defaultApplyFunction: IStateApplyFunction = ( input: IStateApplyInput ): void =>
{
	const { state, shader } = input;
	const { attributes } = state;
	for ( const [ , attribute ] of attributes )
	{
		attribute.apply ( { shader, state } );
	}
};


///////////////////////////////////////////////////////////////////////////////
/**
 * The default reset function. It puts the shader's values back to their
 * defaults, so that the next state drawn does not get this state's values.
 * A custom reset function can do something else on purpose, or call this
 * one to do the same.
 * @param {IStateResetInput} input - The input for resetting the state.
 * @returns {void}
 */
///////////////////////////////////////////////////////////////////////////////

export const defaultResetFunction: IStateResetFunction = ( input: IStateResetInput ): void =>
{
	input.shader.reset();
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Class that contains the state of a shape.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class State extends BaseClass
{
	#name: ( string | null ) = null;
	#layer = 0;
	#bin = 0;
	#shader: ( ShaderBase | null ) = null;
	#topology: GPUPrimitiveTopology = "triangle-list";
	#apply: IStateApplyFunction = defaultApplyFunction;
	#reset: IStateResetFunction = defaultResetFunction;
	#attributes: IStateAttributes = new Map();

	/**
	 * Construct the class.
	 * @class
	 * @param {IStateConstructorInput | null | undefined} input - The constructor input object.
	 */
	constructor ( input?: IStateConstructorInput )
	{
		super();

		const { name, layer, bin, shader, topology, apply, reset } = ( input ?? {} );

		if ( name )
		{
			this.#name = name;
		}

		// This is false when the value is zero, but it's already that.
		if ( layer )
		{
			this.#layer = layer;
		}

		// This is false when the value is zero, but it's already that.
		if ( bin )
		{
			this.#bin = bin;
		}

		if ( shader )
		{
			this.#shader = shader;
		}

		if ( topology )
		{
			this.#topology = topology;
		}

		if ( apply )
		{
			this.#apply = apply;
		}

		if ( reset )
		{
			this.#reset = reset;
		}
	}

	/**
	 * Return the class name.
	 * @returns {string} The class name.
	 */
	public override getClassName() : string
	{
		return "Scene.State.State";
	}

	/**
	 * Get the state attributes. Use addAttribute() to change them, so that
	 * the ones in use are counted.
	 * @returns {ReadonlyMap<string, Attribute>} The state attributes.
	 */
	public get attributes() : ReadonlyMap < string, Attribute >
	{
		return this.#attributes;
	}

	/**
	 * Called when this state starts being used. Its attributes are now used
	 * too, which matters for those that hold GPU resources.
	 */
	protected override onFirstRef() : void
	{
		this.#attributes.forEach ( ( attribute ) => { attribute.ref(); } );
	}

	/**
	 * Called when this state is no longer used. Neither are its attributes,
	 * but they stay in the state so that it can be used again later.
	 */
	protected override onLastUnref() : void
	{
		this.#attributes.forEach ( ( attribute ) => { attribute.unref(); } );
	}

	/**
	 * Add an attribute to this state.
	 * @param {Attribute} attribute - The attribute to add.
	 */
	public addAttribute ( attribute: Attribute ) : void
	{
		// If this state is in use then count the new attribute instead of the
		// one of the same type that it replaces, if any.
		const old = this.#attributes.get ( attribute.type );
		replaceReference ( ( this.refCount > 0 ), old, attribute );
		this.#attributes.set ( attribute.type, attribute );

		// In developer builds, say when the state has both a color and a
		// material, because the color is not used.
		if ( DEVELOPER_BUILD )
		{
			const color = Color.getClassName();
			const material = Material.getClassName();
			const added = attribute.type;
			const both = ( this.#attributes.has ( color ) && this.#attributes.has ( material ) );
			if ( both && ( ( color === added ) || ( material === added ) ) )
			{
				console.warn ( `State '${this.name}' has both a color and a material, so the color is not used` );
			}
		}
	}

	/**
	 * Get the attribute of the given type.
	 * @param {string} type - The type of the attribute to get.
	 * @returns {Attribute | null} The attribute of the given type, or null if not found.
	 */
	public getAttribute ( type: string ) : ( Attribute | null )
	{
		const attribute = this.#attributes.get ( type );
		return ( attribute ?? null );
	}

	/**
	 * Set the apply function.
	 * @param {IStateApplyFunction} apply - The function that applies the state.
	 */
	public set apply ( apply: IStateApplyFunction )
	{
		this.#apply = apply;
	}

	/**
	 * Get the apply function.
	 * @returns {IStateApplyFunction} The function that applies the state.
	 */
	public get apply() : IStateApplyFunction
	{
		return this.#apply;
	}

	/**
	 * Call the apply function.
	 * @param {IStateApplyInput} input - The input for applying the state.
	 */
	public doApply ( input: IStateApplyInput ) : void
	{
		this.#apply ( input );
	}

	/**
	 * Set the reset function.
	 * @param {IStateResetFunction} reset - The function that resets the state.
	 */
	public set reset ( reset: IStateResetFunction )
	{
		this.#reset = reset;
	}

	/**
	 * Get the reset function.
	 * @returns {IStateResetFunction} The function that resets the state.
	 */
	public get reset() : IStateResetFunction
	{
		return this.#reset;
	}

	/**
	 * Call the reset function.
	 * @param {IStateResetInput} input - The input for resetting the state.
	 */
	public doReset ( input: IStateResetInput ) : void
	{
		this.#reset ( input );
	}

	/**
	 * Get the shader.
	 * @returns {ShaderBase | null} The shader object, or null if not set.
	 */
	public get shader() : ( ShaderBase | null )
	{
		return this.#shader;
	}

	/**
	 * Set the shader.
	 * @param {ShaderBase | null} shader - The shader object, or null.
	 */
	public set shader ( shader: ( ShaderBase | null ) )
	{
		this.#shader = shader;
	}

	/**
	 * Get the state name.
	 * @returns {string} The name of this state object.
	 */
	public get name() : string
	{
		// If the user chooses to set the name then we use it. Otherwise we make
		// it, every time, from the shader type and its properties. That way when
		// those properties change, this name will automatically change, and the
		// state-sorting will work as expected. If you cache the name then the user
		// has to remember to invalidate the name whenever, for example, the
		// shader's color property changes. Or, you'll need the shaders to somehow
		// inform the state about any changes. All things considered, this is most
		// likely the best way.

		// Get the name.
		let name = this.#name;

		// If it is valid then return it.
		if ( name )
		{
			return name;
		}

		// If we get to here then make the name.
		const shader = this.shader;
		name = ( shader ? shader.type : "invalid_shader" );
		name = `${this.type} with shader '${name}'`;

		const { attributes } = this;
		for ( const [ , attribute ] of attributes )
		{
			name += `, ${attribute.toString()}`;
		}

		// Do not set this! See note above.
		// this.#name = name;

		// Return the name.
		return name;
	}

	/**
	 * Set the state name.
	 * @param {string | null} name - The name of this state object, or null.
	 */
	public set name ( name: ( string | null ) )
	{
		this.#name = name;
	}

	/**
	 * Get the layer.
	 * @returns {number} The layer for this node.
	 */
	public get layer() : number
	{
		return this.#layer;
	}

	/**
	 * Set the layer.
	 * @param {number} layer - The new layer for this node.
	 */
	public set layer ( layer: number )
	{
		this.#layer = layer;
	}

	/**
	 * Get the bin.
	 * @returns {number} The bin for this node.
	 */
	public get bin() : number
	{
		return this.#bin;
	}

	/**
	 * Set the bin.
	 * @param {number} bin - The new bin for this node.
	 */
	public set bin ( bin: number )
	{
		this.#bin = bin;
	}

	/**
	 * Get the topology.
	 * @returns {GPUPrimitiveTopology} The topology.
	 */
	public get topology () : GPUPrimitiveTopology
	{
		return this.#topology;
	}

	/**
	 * Set the topology.
	 * @param {GPUPrimitiveTopology} topology - The new topology.
	 */
	public set topology ( topology: GPUPrimitiveTopology )
	{
		this.#topology = topology;
	}

	/**
	 * Get the options that the GPU pipeline is made with. They start with
	 * the topology and no face culling, and then each attribute can change
	 * them. States with the same shader and options share a pipeline.
	 * @returns {IPipelineOptions} The pipeline options.
	 */
	public get pipelineOptions () : IPipelineOptions
	{
		const options: IPipelineOptions = {
			topology: this.topology,
			cullMode: "none",
			depthWrite: true,
		};
		for ( const [ , attribute ] of this.#attributes )
		{
			attribute.configurePipeline ( options );
		}
		return options;
	}

	/**
	 * Configure the render pass.
	 * @param {GPURenderPassEncoder} pass - The render pass encoder.
	 * @param {number} frame - The number of the frame being drawn.
	 */
	public configureRenderPass ( pass: GPURenderPassEncoder, frame: number ) : void
	{
		const { shader } = this;

		if ( !shader )
		{
			throw new Error ( `State ${this.type} ${this.id} has invalid shader when configuring render pass` );
		}

		// Configure the render pass.
		shader.configureRenderPass ( pass, frame );
	}

	/**
	 * Return an object used when converting to JSON.
	 * @returns {object} An object used when converting to JSON.
	 */
	public override toJSON() : object
	{
		// Shortcuts.
		const shader = this.shader;

		// Convert the attributes to JSON.
		const attributes: Record<string, object> = {};
		this.attributes.forEach ( ( attribute, key ) =>
		{
			attributes[key] = attribute.toJSON();
		} );

		// Return the object that represents this class.
		return {
			name: this.name,
			layer: this.layer,
			bin: this.bin,
			shader: ( shader ? shader.type : null ),
			topology: this.topology,
			attributes
		};
	}
}
