///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test building the scene from glTF files.
//
///////////////////////////////////////////////////////////////////////////////

import { Cancelled } from "../../../../lib/src/IO";
import { expect } from "chai";
import { FlatShading } from "../../../../lib/src/Shaders/FlatShading";
import { PhongShading } from "../../../../lib/src/Shaders/PhongShading";
import { TRANSPARENT_BIN } from "../../../../lib/src/Tools/Constants";
import { mat4, quat, vec3 } from "gl-matrix";
import {
	GLTF_FLOAT,
	GLTF_LINES,
	GLTF_POINTS,
	GLTF_TRIANGLE_FAN,
	GLTF_TRIANGLE_STRIP,
	GLTF_UNSIGNED_BYTE,
	GLTF_UNSIGNED_INT,
	GLTF_UNSIGNED_SHORT,
	type IGltfPrimitive,
} from "../../../../lib/src/IO/Readers/GLTF/Types";
import {
	Arrays,
	Geometry,
	Group,
	Indexed,
	Material,
	Node as SceneNode,
	State,
	Transform,
	TwoSidedLight,
} from "../../../../lib/src/Scene";
import {
	getError,
	getGeometries,
	GltfMaker,
	read,
	TRIANGLE_INDICES,
	TRIANGLE_POINTS,
} from "./Helpers";


///////////////////////////////////////////////////////////////////////////////
//
//	Helper functions and constants.
//
///////////////////////////////////////////////////////////////////////////////

// The length of each part of a unit vector at 45 degrees.
const S2 = Math.SQRT1_2;

/**
 * Make a maker with one indexed triangle in one mesh in one node.
 * @param {Partial<IGltfPrimitive>} [extra] More of the primitive.
 * @returns {GltfMaker} The maker.
 */
const makeTriangle = ( extra?: Partial<IGltfPrimitive> ) : GltfMaker =>
{
	const maker = new GltfMaker();
	const POSITION = maker.addPoints ( TRIANGLE_POINTS );
	const indices = maker.addAccessor ( TRIANGLE_INDICES, GLTF_UNSIGNED_SHORT, "SCALAR" );
	maker.addMeshNode ( [ { attributes: { POSITION }, indices, ...extra } ] );
	return maker;
};

/**
 * Read the file and return its only geometry.
 * @param {File} file The file.
 * @returns {Promise<Geometry>} The geometry.
 */
const readOne = async ( file: File ) : Promise < Geometry > =>
{
	const geometries = getGeometries ( await read ( file ) );
	expect ( geometries.length ).to.equal ( 1 );
	return geometries[0];
};

/**
 * Get the indices of the geometry's only primitives.
 * @param {Geometry} geom The geometry.
 * @returns {number[]} The indices.
 */
const getIndices = ( geom: Geometry ) : number[] =>
{
	const prims = geom.primitives![0];
	expect ( prims ).to.be.instanceOf ( Indexed );
	return Array.from ( ( prims as Indexed ).indices!.values! );
};

/**
 * Get the material of the state.
 * @param {State} state The state.
 * @returns {Material} The material.
 */
const getMaterial = ( state: State ) : Material =>
{
	const material = state.getAttribute ( Material.getClassName() );
	expect ( material ).to.be.instanceOf ( Material );
	return ( material as Material );
};

/**
 * Get the color of the state, which is its material's diffuse color.
 * @param {State} state The state.
 * @returns {number[]} The color.
 */
const getColor = ( state: State ) : number[] =>
{
	return [ ...getMaterial ( state ).diffuse ];
};

/**
 * Get whether the state has two-sided lighting.
 * @param {State} state The state.
 * @returns {boolean} The value.
 */
const getTwoSided = ( state: State ) : boolean =>
{
	const twoSided = state.getAttribute ( TwoSidedLight.getClassName() ) as TwoSidedLight;
	return twoSided.value;
};

/**
 * Get the states of the groups in the scene, in the order found, without
 * repeats.
 * @param {SceneNode} scene The scene.
 * @returns {State[]} The states.
 */
const getGroupStates = ( scene: SceneNode ) : State[] =>
{
	const answer = new Set < State > ();
	scene.traverse ( ( node ) =>
	{
		if ( ( node instanceof Group ) && node.state )
		{
			answer.add ( node.state );
		}
	} );
	return [ ...answer ];
};

/**
 * Get the points of each geometry in world space, by going down the scene
 * and multiplying the matrices of the transforms. Also check that the
 * transforms only rotate and translate.
 * @param {SceneNode} node The node to start at.
 * @param {mat4} [above] The matrix of the nodes above.
 * @returns {number[][]} The points of each geometry, in the order found.
 */
const getWorldPoints = ( node: SceneNode, above: mat4 = mat4.create() ) : number[][] =>
{
	if ( node instanceof Geometry )
	{
		const points = Array.from ( node.points!.values! );
		const answer: number[] = [];
		for ( let i = 0; i < points.length; i += 3 )
		{
			const p = vec3.transformMat4 ( vec3.create(), [ points[i], points[i + 1], points[i + 2] ], above );
			answer.push ( p[0], p[1], p[2] );
		}
		return [ answer ];
	}

	let matrix = above;
	if ( node instanceof Transform )
	{
		const m = node.matrix;
		for ( const col of [ 0, 4, 8 ] )
		{
			expect ( Math.hypot ( m[col], m[col + 1], m[col + 2] ) ).to.be.closeTo ( 1, 1e-6 );
		}
		expect ( ( m[0] * m[4] ) + ( m[1] * m[5] ) + ( m[2] * m[6] ) ).to.be.closeTo ( 0, 1e-6 );
		expect ( ( m[0] * m[8] ) + ( m[1] * m[9] ) + ( m[2] * m[10] ) ).to.be.closeTo ( 0, 1e-6 );
		expect ( ( m[4] * m[8] ) + ( m[5] * m[9] ) + ( m[6] * m[10] ) ).to.be.closeTo ( 0, 1e-6 );
		matrix = mat4.multiply ( mat4.create(), above, m );
	}

	const answer: number[][] = [];
	( node as Group ).forEachChild ( ( child ) => { answer.push ( ...getWorldPoints ( child, matrix ) ); } );
	return answer;
};

/**
 * Get the matrix of a glTF node's translation, rotation, and scale.
 * @param {number[]} t The translation.
 * @param {number[]} r The rotation.
 * @param {number[]} s The scale.
 * @returns {mat4} The matrix.
 */
const makeMatrix = ( t: number[], r: number[], s: number[] ) : mat4 =>
{
	return mat4.fromRotationTranslationScale ( mat4.create(), quat.normalize ( quat.create(), r ), t, s );
};

/**
 * Get the error message from reading the file.
 * @param {File} file The file.
 * @returns {Promise<string>} The message.
 */
const getMessage = async ( file: File ) : Promise < string > =>
{
	return ( await getError ( read ( file ) ) ).message;
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Builder", function ()
	{
		describe ( "Triangles", function ()
		{
			for ( const kind of [ "glb", "gltf" ] )
			{
				it ( `Should read an indexed triangle from a .${kind} file`, async function ()
				{
					const maker = makeTriangle();
					const geom = await readOne ( ( "glb" === kind ) ? maker.glb() : maker.gltf() );
					expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( TRIANGLE_POINTS );
					expect ( geom.normals ).to.be.null;
					expect ( getIndices ( geom ) ).to.deep.equal ( TRIANGLE_INDICES );
					expect ( ( geom.primitives![0] as Indexed ).indexType ).to.equal ( "uint16" );
					expect ( geom.primitives![0].topology ).to.equal ( "triangle-list" );
				} );
			}

			it ( "Should use flat shading without normals, and Phong shading with them", async function ()
			{
				const flat = await readOne ( makeTriangle().glb() );
				expect ( flat.state!.shader ).to.equal ( FlatShading.instance );

				const maker = makeTriangle();
				const NORMAL = maker.addPoints ( [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] );
				maker.json.meshes![0].primitives[0].attributes.NORMAL = NORMAL;
				const phong = await readOne ( maker.glb() );
				expect ( phong.state!.shader ).to.equal ( PhongShading.instance );
				expect ( Array.from ( phong.normals!.values! ) ).to.deep.equal ( [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] );
			} );

			it ( "Should keep 32-bit indices and make 8-bit indices 16-bit", async function ()
			{
				for ( const [ componentType, indexType ] of [ [ GLTF_UNSIGNED_INT, "uint32" ], [ GLTF_UNSIGNED_BYTE, "uint16" ] ] as const )
				{
					const maker = new GltfMaker();
					const POSITION = maker.addPoints ( TRIANGLE_POINTS );
					const indices = maker.addAccessor ( TRIANGLE_INDICES, componentType, "SCALAR" );
					maker.addMeshNode ( [ { attributes: { POSITION }, indices } ] );
					const geom = await readOne ( maker.glb() );
					expect ( ( geom.primitives![0] as Indexed ).indexType ).to.equal ( indexType );
					expect ( getIndices ( geom ) ).to.deep.equal ( TRIANGLE_INDICES );
				}
			} );

			it ( "Should use arrays without indices, ignoring vertices left over", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( [ ...TRIANGLE_POINTS, 5, 5, 5 ] );
				maker.addMeshNode ( [ { attributes: { POSITION } } ] );
				const geom = await readOne ( maker.glb() );
				const prims = geom.primitives![0] as Arrays;
				expect ( prims ).to.be.instanceOf ( Arrays );
				expect ( prims.first ).to.equal ( 0 );
				expect ( prims.count ).to.equal ( 3 );
			} );

			it ( "Should skip points and lines, with a warning", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				maker.addMeshNode ( [
					{ attributes: { POSITION }, mode: GLTF_LINES },
					{ attributes: { POSITION } },
					{ attributes: { POSITION }, mode: GLTF_POINTS },
					{ attributes: { POSITION }, mode: GLTF_LINES },
				] );
				const warnings: string[] = [];
				const original = console.warn;
				console.warn = ( ...args: unknown[] ) => { warnings.push ( args.join ( " " ) ); };
				let geom: ( Geometry | null ) = null;
				try
				{
					geom = await readOne ( maker.glb() );
				}
				finally
				{
					console.warn = original;
				}
				expect ( geom.primitives![0] ).to.be.instanceOf ( Arrays );
				expect ( warnings ).to.deep.equal ( [ "Skipped glTF primitives that are not supported yet: 2 lines, 1 points" ] );
			} );

			it ( "Should turn triangle strips and fans into lists, with or without indices", async function ()
			{
				// A square, as a strip and as a fan.
				const SQUARE = [ 0, 0, 0,   1, 0, 0,   1, 1, 0,   0, 1, 0 ];
				for ( const [ mode, order, expected ] of [
					[ GLTF_TRIANGLE_STRIP, [ 0, 1, 3, 2 ], [ 0, 1, 3,   1, 2, 3 ] ],
					[ GLTF_TRIANGLE_FAN, [ 0, 1, 2, 3 ], [ 1, 2, 0,   2, 3, 0 ] ],
				] as const )
				{
					// With indices.
					const indexed = new GltfMaker();
					const POSITION = indexed.addPoints ( SQUARE );
					const indices = indexed.addAccessor ( [ ...order ], GLTF_UNSIGNED_SHORT, "SCALAR" );
					indexed.addMeshNode ( [ { attributes: { POSITION }, indices, mode } ] );
					const geom = await readOne ( indexed.glb() );
					expect ( geom.primitives![0].topology ).to.equal ( "triangle-list" );
					expect ( ( geom.primitives![0] as Indexed ).indexType ).to.equal ( "uint16" );
					expect ( getIndices ( geom ), `mode ${mode}` ).to.deep.equal ( expected );

					// Without indices, the points are in the order of the indices.
					const plain = new GltfMaker();
					const points = order.flatMap ( ( i ) => SQUARE.slice ( ( i * 3 ), ( ( i * 3 ) + 3 ) ) );
					plain.addMeshNode ( [ { attributes: { POSITION: plain.addPoints ( points ) }, mode } ] );
					const flat = await readOne ( plain.glb() );
					expect ( flat.primitives![0].topology ).to.equal ( "triangle-list" );
					const corners = getIndices ( flat ).map ( ( i ) => order[i] );
					expect ( corners, `mode ${mode}` ).to.deep.equal ( expected );
				}
			} );

			it ( "Should turn the triangles of a strip or fan around for a mirror", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( [ 0, 0, 0,   1, 0, 0,   0, 1, 0,   1, 1, 0 ] );
				maker.addMeshNode ( [ { attributes: { POSITION }, mode: GLTF_TRIANGLE_STRIP } ] );
				maker.json.nodes![0].scale = [ -1, 1, 1 ];
				expect ( getIndices ( await readOne ( maker.glb() ) ) ).to.deep.equal ( [ 0, 2, 1,   1, 2, 3 ] );
			} );

			it ( "Should share the triangles of a strip whose indices are used more than once", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( [ 0, 0, 0,   1, 0, 0,   0, 1, 0,   1, 1, 0 ] );
				const indices = maker.addAccessor ( [ 0, 1, 2, 3 ], GLTF_UNSIGNED_SHORT, "SCALAR" );
				const a = maker.addMaterial ( {} );
				const b = maker.addMaterial ( {} );
				maker.addMeshNode ( [
					{ attributes: { POSITION }, indices, material: a, mode: GLTF_TRIANGLE_STRIP },
					{ attributes: { POSITION }, indices, material: b, mode: GLTF_TRIANGLE_STRIP },
					{ attributes: { POSITION }, indices, material: b, mode: GLTF_TRIANGLE_FAN },
					{ attributes: { POSITION }, indices, material: b },
				] );
				const [ first, second, fan, list ] = getGeometries ( await read ( maker.glb() ) ).map (
					( geom ) => ( geom.primitives![0] as Indexed ).indices );
				expect ( first ).to.equal ( second );
				expect ( fan ).not.to.equal ( first );
				expect ( list ).not.to.equal ( first );
				expect ( Array.from ( list!.values! ) ).to.deep.equal ( [ 0, 1, 2, 3 ] );
			} );

			it ( "Should check the indices of a strip or fan", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const indices = maker.addAccessor ( [ 0, 1, 2, 3 ], GLTF_UNSIGNED_SHORT, "SCALAR" );
				maker.addMeshNode ( [ { attributes: { POSITION }, indices, mode: GLTF_TRIANGLE_FAN } ] );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "has vertex index 3, but there are 3 vertices" );
			} );

			it ( "Should say when there are no triangles", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				maker.addMeshNode ( [ { attributes: { POSITION }, mode: GLTF_LINES } ] );
				expect ( await getMessage ( maker.glb() ) ).to.equal ( "Error reading glTF file: The glTF file has no triangles to draw" );

				const empty = new GltfMaker();
				expect ( await getMessage ( empty.glb() ) ).to.include ( "no triangles to draw" );
			} );
		} );

		describe ( "Errors in primitives", function ()
		{
			it ( "Should say where there are no points", async function ()
			{
				const maker = new GltfMaker();
				maker.addMeshNode ( [ { attributes: {} } ] );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "There are no points, in primitive 0 of mesh 0" );
			} );

			it ( "Should reject a different number of normals and points", async function ()
			{
				const maker = makeTriangle();
				maker.json.meshes![0].primitives[0].attributes.NORMAL = maker.addPoints ( [ 0, 0, 1 ] );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "There are 1 normals but 3 points" );
			} );

			it ( "Should reject an index past the last vertex", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const indices = maker.addAccessor ( [ 0, 1, 3 ], GLTF_UNSIGNED_SHORT, "SCALAR" );
				maker.addMeshNode ( [ { attributes: { POSITION }, indices } ] );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "has vertex index 3, but there are 3 vertices" );
			} );

			it ( "Should reject shared indices past the last vertex of a primitive", async function ()
			{
				const maker = new GltfMaker();
				const many = maker.addPoints ( [ ...TRIANGLE_POINTS, 1, 1, 0 ] );
				const few = maker.addPoints ( TRIANGLE_POINTS );
				const indices = maker.addAccessor ( [ 1, 2, 3 ], GLTF_UNSIGNED_SHORT, "SCALAR" );
				maker.addMeshNode ( [ { attributes: { POSITION: many }, indices }, { attributes: { POSITION: few }, indices } ] );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "but there are 3 vertices, in primitive 1 of mesh 0" );
			} );
		} );

		describe ( "Nodes", function ()
		{
			it ( "Should use the node's matrix", async function ()
			{
				const maker = makeTriangle();
				const matrix = [ 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   5, 6, 7, 1 ];
				maker.json.nodes![0].matrix = matrix;
				const scene = await read ( maker.glb() ) as Group;
				const transform = scene.getChild ( 0 ) as Transform;
				expect ( transform ).to.be.instanceOf ( Transform );
				expect ( [ ...transform.matrix ] ).to.deep.equal ( matrix );
				expect ( transform.getChild ( 0 ) ).to.be.instanceOf ( Geometry );
			} );

			it ( "Should only make a group for a node that only scales", async function ()
			{
				const maker = makeTriangle();
				maker.json.nodes![0].scale = [ 2, 3, 4 ];
				const scene = await read ( maker.glb() ) as Group;
				const node = scene.getChild ( 0 );
				expect ( node ).to.be.instanceOf ( Group );
				expect ( node ).not.to.be.instanceOf ( Transform );
			} );

			it ( "Should build the children", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const child = maker.addNode ( { mesh, translation: [ 1, 0, 0 ] } );
				const parent = maker.addNode ( { children: [ child ], translation: [ 0, 1, 0 ] } );
				maker.addScene ( [ parent ] );

				const scene = await read ( maker.glb() ) as Group;
				const top = scene.getChild ( 0 ) as Transform;
				const inner = top.getChild ( 0 ) as Transform;
				expect ( top.matrix[13] ).to.equal ( 1 );
				expect ( inner.matrix[12] ).to.equal ( 1 );
				expect ( inner.getChild ( 0 ) ).to.be.instanceOf ( Geometry );

				// The bounds include both translations.
				const { center } = scene.bounds;
				expect ( [ ...center ] ).to.deep.equal ( [ 1.5, 1.5, 0 ] );
			} );

			it ( "Should share a mesh used by more than one node", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const a = maker.addNode ( { mesh, translation: [ 1, 0, 0 ] } );
				const b = maker.addNode ( { mesh, translation: [ 2, 0, 0 ] } );
				maker.addScene ( [ a, b ] );

				const scene = await read ( maker.glb() ) as Group;
				const first = ( scene.getChild ( 0 ) as Transform ).getChild ( 0 );
				const second = ( scene.getChild ( 1 ) as Transform ).getChild ( 0 );
				expect ( first ).to.be.instanceOf ( Geometry );
				expect ( first ).to.equal ( second );
			} );

			it ( "Should put a mesh with more than one primitive in a group", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				maker.addMeshNode ( [ { attributes: { POSITION } }, { attributes: { POSITION } } ] );
				const scene = await read ( maker.glb() ) as Group;
				const mesh = ( scene.getChild ( 0 ) as Group ).getChild ( 0 ) as Group;
				expect ( mesh ).to.be.instanceOf ( Group );
				expect ( mesh.size ).to.equal ( 2 );
			} );

			it ( "Should share the arrays of accessors used more than once", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const indices = maker.addAccessor ( TRIANGLE_INDICES, GLTF_UNSIGNED_SHORT, "SCALAR" );
				const a = maker.addMaterial ( {} );
				const b = maker.addMaterial ( {} );
				maker.addMeshNode ( [ { attributes: { POSITION }, indices, material: a }, { attributes: { POSITION }, indices, material: b } ] );
				const [ first, second ] = getGeometries ( await read ( maker.glb() ) );
				expect ( first ).not.to.equal ( second );
				expect ( first.points ).to.equal ( second.points );
				expect ( ( first.primitives![0] as Indexed ).indices ).to.equal ( ( second.primitives![0] as Indexed ).indices );
			} );

			it ( "Should reject a node inside itself", async function ()
			{
				const maker = makeTriangle();
				const child = maker.addNode ( { children: [] } );
				maker.json.nodes![child].children = [ child ];
				maker.json.scenes![0].nodes = [ child ];
				expect ( await getMessage ( maker.glb() ) ).to.include ( "glTF node 1 is inside itself" );
			} );

			it ( "Should reject a node that isn't there", async function ()
			{
				const maker = makeTriangle();
				maker.json.scenes![0].nodes = [ 5 ];
				expect ( await getMessage ( maker.glb() ) ).to.include ( "There is no node 5, there are 1" );
			} );
		} );

		describe ( "Scale", function ()
		{
			it ( "Should multiply the points by the scale", async function ()
			{
				const maker = makeTriangle();
				maker.json.nodes![0].scale = [ 2, 3, 4 ];
				const geom = await readOne ( maker.glb() );
				expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( [ 0, 0, 0,   2, 0, 0,   0, 3, 0 ] );
				expect ( getIndices ( geom ) ).to.deep.equal ( TRIANGLE_INDICES );
			} );

			it ( "Should put the points where the glTF transforms say, even with an uneven scale above a rotation", async function ()
			{
				// Three levels, each with a translation, a rotation, and an uneven scale.
				const levels = [
					{ translation: [ 1, 2, 3 ], rotation: [ 0.1, 0.2, 0.3, 0.9 ], scale: [ 2, 0.5, 3 ] },
					{ translation: [ -4, 0, 1 ], rotation: [ 0.5, -0.1, 0.2, 0.8 ], scale: [ 1, 4, 0.25 ] },
					{ translation: [ 0, 3, -2 ], rotation: [ -0.3, 0.6, 0, 0.7 ], scale: [ 0.5, 2, 1.5 ] },
				];
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const bottom = maker.addNode ( { mesh, ...levels[2] } );
				const middle = maker.addNode ( { children: [ bottom ], ...levels[1] } );
				const top = maker.addNode ( { children: [ middle ], ...levels[0] } );
				maker.addScene ( [ top ] );

				// The points as glTF would place them.
				const world = levels.reduce ( ( m, { translation, rotation, scale } ) =>
					mat4.multiply ( mat4.create(), m, makeMatrix ( translation, rotation, scale ) ), mat4.create() );
				const expected: number[] = [];
				for ( let i = 0; i < TRIANGLE_POINTS.length; i += 3 )
				{
					expected.push ( ...vec3.transformMat4 ( vec3.create(), TRIANGLE_POINTS.slice ( i, i + 3 ), world ) );
				}

				const actual = getWorldPoints ( await read ( maker.glb() ) );
				expect ( actual.length ).to.equal ( 1 );
				actual[0].forEach ( ( value, i ) => { expect ( value ).to.be.closeTo ( expected[i], 1e-5 ); } );
			} );

			it ( "Should do the same with matrices", async function ()
			{
				const matrices = [
					makeMatrix ( [ 1, 2, 3 ], [ 0.1, 0.2, 0.3, 0.9 ], [ 2, 0.5, 3 ] ),
					makeMatrix ( [ -4, 0, 1 ], [ 0.5, -0.1, 0.2, 0.8 ], [ 1, 4, 0.25 ] ),
				];
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const child = maker.addNode ( { mesh, matrix: Array.from ( matrices[1] ) } );
				const parent = maker.addNode ( { children: [ child ], matrix: Array.from ( matrices[0] ) } );
				maker.addScene ( [ parent ] );

				const world = mat4.multiply ( mat4.create(), matrices[0], matrices[1] );
				const expected: number[] = [];
				for ( let i = 0; i < TRIANGLE_POINTS.length; i += 3 )
				{
					expected.push ( ...vec3.transformMat4 ( vec3.create(), TRIANGLE_POINTS.slice ( i, i + 3 ), world ) );
				}

				const actual = getWorldPoints ( await read ( maker.glb() ) );
				actual[0].forEach ( ( value, i ) => { expect ( value ).to.be.closeTo ( expected[i], 1e-5 ); } );
			} );

			it ( "Should change the normals for an uneven scale", async function ()
			{
				const maker = makeTriangle();
				const NORMAL = maker.addPoints ( [ S2, S2, 0,   S2, S2, 0,   S2, S2, 0 ] );
				maker.json.meshes![0].primitives[0].attributes.NORMAL = NORMAL;
				maker.json.nodes![0].scale = [ 2, 1, 1 ];
				const geom = await readOne ( maker.glb() );

				// Stretching x makes the surface lean more towards x, so the normal
				// leans away from it.
				const length = Math.hypot ( 0.5, 1 );
				const normals = Array.from ( geom.normals!.values! );
				normals.forEach ( ( value, i ) => { expect ( value ).to.be.closeTo ( [ 0.5 / length, 1 / length, 0 ][i % 3], 1e-6 ); } );
			} );

			it ( "Should turn the triangles around for a mirror", async function ()
			{
				// With indices.
				const indexed = makeTriangle();
				indexed.json.nodes![0].scale = [ -1, 1, 1 ];
				const geom = await readOne ( indexed.glb() );
				expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( [ 0, 0, 0,   -1, 0, 0,   0, 1, 0 ] );
				expect ( getIndices ( geom ) ).to.deep.equal ( [ 0, 2, 1 ] );

				// Without indices, it makes them.
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				maker.addMeshNode ( [ { attributes: { POSITION } } ] );
				maker.json.nodes![0].scale = [ 1, 1, -1 ];
				expect ( getIndices ( await readOne ( maker.glb() ) ) ).to.deep.equal ( [ 0, 2, 1 ] );

				// Two mirrors don't make a mirror.
				const twice = makeTriangle();
				twice.json.nodes![0].scale = [ -1, -1, 1 ];
				expect ( getIndices ( await readOne ( twice.glb() ) ) ).to.deep.equal ( TRIANGLE_INDICES );
			} );

			it ( "Should share a mesh only between nodes with the same scale", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const plain = maker.addNode ( { mesh } );
				const moved = maker.addNode ( { mesh, translation: [ 5, 0, 0 ] } );
				const scaled = maker.addNode ( { mesh, scale: [ 2, 2, 2 ] } );
				const alsoScaled = maker.addNode ( { mesh, scale: [ 2, 2, 2 ], translation: [ 0, 5, 0 ] } );
				maker.addScene ( [ plain, moved, scaled, alsoScaled ] );

				const geometries = getGeometries ( await read ( maker.glb() ) );
				expect ( geometries.length ).to.equal ( 2 );
				expect ( Array.from ( geometries[0].points!.values! ) ).to.deep.equal ( TRIANGLE_POINTS );
				expect ( Array.from ( geometries[1].points!.values! ) ).to.deep.equal ( TRIANGLE_POINTS.map ( ( v ) => ( v * 2 ) ) );
			} );

			it ( "Should count each mesh once in the progress", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const plain = maker.addNode ( { mesh } );
				const scaled = maker.addNode ( { mesh, scale: [ 2, 2, 2 ] } );
				maker.addScene ( [ plain, scaled ] );

				const calls: [ number, number ][] = [];
				await read ( maker.glb(), ( done, total ) => { calls.push ( [ done, total ] ); return true; } );
				expect ( calls[calls.length - 1] ).to.deep.equal ( [ 1, 1 ] );
				calls.forEach ( ( [ done, total ] ) => { expect ( done ).to.be.at.most ( total ); } );
			} );

			it ( "Should get the bounds right", async function ()
			{
				const maker = makeTriangle();
				maker.json.nodes![0].scale = [ 10, 10, 10 ];
				maker.json.nodes![0].rotation = [ 0, 0, Math.SQRT1_2, Math.SQRT1_2 ];
				const scene = await read ( maker.glb() );
				const bounds = scene.bounds;
				expect ( bounds.radius ).to.be.closeTo ( 10 * Math.SQRT1_2, 1e-5 );
			} );
		} );

		describe ( "Scenes", function ()
		{
			it ( "Should use the scene the file says to", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const near = maker.addNode ( { mesh } );
				const far = maker.addNode ( { mesh, translation: [ 100, 0, 0 ] } );
				maker.addScene ( [ near ] );
				maker.json.scene = maker.addScene ( [ far ] );
				const scene = await read ( maker.glb() );
				expect ( scene.bounds.center[0] ).to.be.greaterThan ( 99 );
			} );

			it ( "Should use the first scene by default", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				maker.addScene ( [ maker.addNode ( { mesh } ) ] );
				maker.addScene ( [ maker.addNode ( { mesh, translation: [ 100, 0, 0 ] } ) ] );
				const scene = await read ( maker.glb() );
				expect ( scene.bounds.center[0] ).to.be.lessThan ( 1 );
			} );

			it ( "Should use the nodes that are not children when there are no scenes", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const mesh = maker.addMesh ( [ { attributes: { POSITION } } ] );
				const child = maker.addNode ( { mesh } );
				maker.addNode ( { children: [ child ], translation: [ 0, 0, 1 ] } );
				maker.addNode ( { mesh } );
				const scene = await read ( maker.glb() ) as Group;
				expect ( scene.size ).to.equal ( 2 );
				expect ( scene.getChild ( 0 ) ).to.be.instanceOf ( Transform );
			} );
		} );

		describe ( "Materials", function ()
		{
			it ( "Should be white and one-sided without a material", async function ()
			{
				const geom = await readOne ( makeTriangle().glb() );
				expect ( getColor ( geom.state! ) ).to.deep.equal ( [ 1, 1, 1, 1 ] );
				expect ( getTwoSided ( geom.state! ) ).to.be.false;
			} );

			it ( "Should light both sides only when the material is double-sided", async function ()
			{
				const cases: [ boolean | undefined, boolean ][] = [ [ undefined, false ], [ false, false ], [ true, true ] ];
				for ( const [ doubleSided, expected ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( ( undefined === doubleSided ) ? {} : { doubleSided } );
					const geom = await readOne ( maker.glb() );
					expect ( getTwoSided ( geom.state! ) ).to.equal ( expected );
				}
			} );

			it ( "Should cull the back faces unless the material is double-sided", async function ()
			{
				const cases: [ boolean | undefined, GPUCullMode ][] = [ [ undefined, "back" ], [ false, "back" ], [ true, "none" ] ];
				for ( const [ doubleSided, expected ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( ( undefined === doubleSided ) ? {} : { doubleSided } );
					const geom = await readOne ( maker.glb() );
					expect ( geom.state!.pipelineOptions.cullMode ).to.equal ( expected );
				}

				// Without a material, it's one-sided.
				const geom = await readOne ( makeTriangle().glb() );
				expect ( geom.state!.pipelineOptions.cullMode ).to.equal ( "back" );
			} );

			it ( "Should use the base color, and its alpha only when blending or masking", async function ()
			{
				const cases: [ string | undefined, number ][] = [ [ undefined, 1 ], [ "OPAQUE", 1 ], [ "MASK", 0.5 ], [ "BLEND", 0.5 ] ];
				for ( const [ alphaMode, alpha ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 0.25, 0.5, 0.75, 0.5 ] }, ...( alphaMode ? { alphaMode } : {} ) } );
					const geom = await readOne ( maker.glb() );
					expect ( getColor ( geom.state! ) ).to.deep.equal ( [ 0.25, 0.5, 0.75, alpha ] );
				}
			} );

			it ( "Should put a blended material in the transparent bin, without depth writes", async function ()
			{
				const cases: [ string | undefined, number, boolean ][] = [
					[ undefined, 0, true ], [ "OPAQUE", 0, true ], [ "MASK", 0, true ], [ "BLEND", TRANSPARENT_BIN, false ] ];
				for ( const [ alphaMode, bin, depthWrite ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( alphaMode ? { alphaMode } : {} );
					const geom = await readOne ( maker.glb() );
					expect ( geom.state!.bin ).to.equal ( bin );
					expect ( geom.state!.pipelineOptions.depthWrite ).to.equal ( depthWrite );
					expect ( geom.state!.pipelineOptions.cullMode ).to.equal ( "back" );
				}
			} );

			it ( "Should draw a double-sided blended material's back faces and then its front faces", async function ()
			{
				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { alphaMode: "BLEND", doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [ 0.25, 0.5, 0.75, 0.5 ] } } );
				const scene = await read ( maker.glb() );
				const geometries = getGeometries ( scene );
				expect ( geometries.length ).to.equal ( 1 );
				expect ( geometries[0].state ).to.be.null;

				const states = getGroupStates ( scene );
				expect ( states.length ).to.equal ( 2 );
				const [ back, front ] = states;
				expect ( back.bin ).to.equal ( TRANSPARENT_BIN );
				expect ( front.bin ).to.equal ( TRANSPARENT_BIN + 1 );
				expect ( back.pipelineOptions.cullMode ).to.equal ( "front" );
				expect ( front.pipelineOptions.cullMode ).to.equal ( "back" );
				for ( const state of [ back, front ] )
				{
					expect ( state.pipelineOptions.depthWrite ).to.be.false;
					expect ( getColor ( state ) ).to.deep.equal ( [ 0.25, 0.5, 0.75, 0.5 ] );
					expect ( getTwoSided ( state ) ).to.be.true;
				}
			} );

			it ( "Should draw transmission as partial alpha, but not below the smallest", async function ()
			{
				// The alpha mode, the alpha of the base color, the transmission, and the alpha drawn.
				const cases: [ string | undefined, number, number, number ][] = [
					[ undefined, 0.5, 0.5, 0.5 ],
					[ undefined, 0.5, 0.25, 0.75 ],
					[ undefined, 0.5, 1, 0.25 ],
					[ undefined, 0.5, 0.9, 0.25 ],
					[ "BLEND", 0.5, 0.5, 0.25 ],
				];
				for ( const [ alphaMode, baseAlpha, transmissionFactor, alpha ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( {
						pbrMetallicRoughness: { baseColorFactor: [ 0.25, 0.5, 0.75, baseAlpha ] },
						extensions: { KHR_materials_transmission: { transmissionFactor } },
						...( alphaMode ? { alphaMode } : {} ),
					} );
					const geom = await readOne ( maker.glb() );
					const color = getColor ( geom.state! );
					expect ( color.slice ( 0, 3 ) ).to.deep.equal ( [ 0.25, 0.5, 0.75 ] );
					expect ( color[3] ).to.be.closeTo ( alpha, 1e-6 );
					expect ( geom.state!.bin ).to.equal ( TRANSPARENT_BIN );
					expect ( geom.state!.pipelineOptions.depthWrite ).to.be.false;
				}
			} );

			it ( "Should draw a material without transmission opaque", async function ()
			{
				for ( const extensions of [ {}, { KHR_materials_transmission: {} }, { KHR_materials_transmission: { transmissionFactor: 0 } } ] )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( { extensions } );
					const geom = await readOne ( maker.glb() );
					expect ( getColor ( geom.state! ) ).to.deep.equal ( [ 1, 1, 1, 1 ] );
					expect ( geom.state!.bin ).to.equal ( 0 );
					expect ( geom.state!.pipelineOptions.depthWrite ).to.be.true;
				}
			} );

			it ( "Should draw a double-sided material with transmission's back faces and then its front faces", async function ()
			{
				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { doubleSided: true, extensions: { KHR_materials_transmission: { transmissionFactor: 1 } } } );
				const scene = await read ( maker.glb() );
				expect ( getGeometries ( scene )[0].state ).to.be.null;
				const states = getGroupStates ( scene );
				expect ( states.map ( ( state ) => state.bin ) ).to.deep.equal ( [ TRANSPARENT_BIN, ( TRANSPARENT_BIN + 1 ) ] );
				expect ( states.map ( ( state ) => getColor ( state )[3] ) ).to.deep.equal ( [ 0.25, 0.25 ] );
			} );

			it ( "Should reject a transmission factor that is not from 0 to 1", async function ()
			{
				for ( const transmissionFactor of [ -0.5, 1.5 ] )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( { extensions: { KHR_materials_transmission: { transmissionFactor } } } );
					expect ( await getMessage ( maker.glb() ) ).to.include ( `Material 0 has a transmission factor of ${transmissionFactor}, which is not from 0 to 1` );
				}
			} );

			it ( "Should share the back and front states of a double-sided blended material", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const material = maker.addMaterial ( { alphaMode: "BLEND", doubleSided: true } );
				maker.addMeshNode ( [ { attributes: { POSITION }, material }, { attributes: { POSITION }, material } ] );
				const scene = await read ( maker.glb() );
				expect ( getGeometries ( scene ).length ).to.equal ( 2 );
				expect ( getGroupStates ( scene ).length ).to.equal ( 2 );
			} );

			it ( "Should mask the alpha of MASK and OPAQUE materials, but not of semi-transparent ones", async function ()
			{
				// The alpha mode, the transmission, and the mask and cutoff.
				const cases: [ string | undefined, number, boolean, number ][] = [
					[ undefined, 0, true, 0 ],
					[ "OPAQUE", 0, true, 0 ],
					[ "MASK", 0, true, 0.5 ],
					[ "BLEND", 0, false, 0.5 ],
					[ undefined, 0.5, false, 0.5 ],
				];
				for ( const [ alphaMode, transmissionFactor, alphaMask, alphaCutoff ] of cases )
				{
					const maker = makeTriangle ( { material: 0 } );
					maker.addMaterial ( {
						...( alphaMode ? { alphaMode } : {} ),
						...( transmissionFactor ? { extensions: { KHR_materials_transmission: { transmissionFactor } } } : {} ),
					} );
					const material = getMaterial ( ( await readOne ( maker.glb() ) ).state! );
					expect ( material.alphaMask, `${alphaMode} ${transmissionFactor}` ).to.equal ( alphaMask );
					expect ( material.alphaCutoff ).to.equal ( alphaCutoff );
				}

				// A MASK material's own cutoff.
				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { alphaMode: "MASK", alphaCutoff: 0.25 } );
				expect ( getMaterial ( ( await readOne ( maker.glb() ) ).state! ).alphaCutoff ).to.equal ( 0.25 );

				// One that can't be.
				const bad = makeTriangle ( { material: 0 } );
				bad.addMaterial ( { alphaMode: "MASK", alphaCutoff: 2 } );
				expect ( await getMessage ( bad.glb() ) ).to.include ( "Material 0 has an alpha cutoff of 2, which is not from 0 to 1" );
			} );

			it ( "Should share the state of a material", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const material = maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 1, 0, 0, 1 ] } } );
				const other = maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 0, 1, 0, 1 ] } } );
				maker.addMeshNode ( [
					{ attributes: { POSITION }, material },
					{ attributes: { POSITION }, material },
					{ attributes: { POSITION }, material: other },
				] );
				const [ a, b, c ] = getGeometries ( await read ( maker.glb() ) );
				expect ( a.state ).to.equal ( b.state );
				expect ( a.state ).not.to.equal ( c.state );
				expect ( getColor ( c.state! ) ).to.deep.equal ( [ 0, 1, 0, 1 ] );
			} );

			it ( "Should use the base color for the ambient color too, and have no highlights", async function ()
			{
				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 0.25, 0.5, 0.75, 1 ] } } );
				const material = getMaterial ( ( await readOne ( maker.glb() ) ).state! );
				expect ( material.ambient ).to.deep.equal ( [ 0.25, 0.5, 0.75, 1 ] );
				expect ( material.diffuse ).to.deep.equal ( [ 0.25, 0.5, 0.75, 1 ] );
				expect ( material.specular ).to.deep.equal ( [ 0, 0, 0, 1 ] );
				expect ( material.shininess ).to.equal ( 0 );

				// The state has no color attribute, only the material.
				expect ( ( await readOne ( maker.glb() ) ).state!.attributes.size ).to.equal ( 3 );
			} );

			it ( "Should use the emissive color, times the emissive strength, for the emission", async function ()
			{
				// None by default.
				const none = makeTriangle ( { material: 0 } );
				none.addMaterial ( {} );
				expect ( getMaterial ( ( await readOne ( none.glb() ) ).state! ).emission ).to.deep.equal ( [ 0, 0, 0, 1 ] );
				expect ( getMaterial ( ( await readOne ( makeTriangle().glb() ) ).state! ).emission ).to.deep.equal ( [ 0, 0, 0, 1 ] );

				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { emissiveFactor: [ 0.5, 0.25, 0 ] } );
				expect ( getMaterial ( ( await readOne ( maker.glb() ) ).state! ).emission ).to.deep.equal ( [ 0.5, 0.25, 0, 1 ] );

				const strong = makeTriangle ( { material: 0 } );
				strong.addMaterial ( { emissiveFactor: [ 0.5, 0.25, 0 ], extensions: { KHR_materials_emissive_strength: { emissiveStrength: 2 } } } );
				expect ( getMaterial ( ( await readOne ( strong.glb() ) ).state! ).emission ).to.deep.equal ( [ 1, 0.5, 0, 1 ] );
			} );

			it ( "Should reject an emissive color of the wrong size, or a negative emissive strength", async function ()
			{
				const size = makeTriangle ( { material: 0 } );
				size.addMaterial ( { emissiveFactor: [ 1, 0 ] } );
				expect ( await getMessage ( size.glb() ) ).to.include ( "Material 0 has an emissive color with 2 numbers instead of 3" );

				const negative = makeTriangle ( { material: 0 } );
				negative.addMaterial ( { emissiveFactor: [ 1, 0, 0 ], extensions: { KHR_materials_emissive_strength: { emissiveStrength: -1 } } } );
				expect ( await getMessage ( negative.glb() ) ).to.include ( "Material 0 has an emissive strength of -1, which is less than 0" );
			} );

			it ( "Should reject a base color of the wrong size, or a missing material", async function ()
			{
				const maker = makeTriangle ( { material: 0 } );
				maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 1, 0, 0 ] } } );
				expect ( await getMessage ( maker.glb() ) ).to.include ( "Material 0 has a base color with 3 numbers instead of 4" );

				const missing = makeTriangle ( { material: 2 } );
				expect ( await getMessage ( missing.glb() ) ).to.include ( "There is no material 2, there are 0" );
			} );
		} );

		describe ( "Vertex colors", function ()
		{
			/**
			 * Make a triangle with colors.
			 * @param {number[]} colors The colors.
			 * @param {number} componentType The component type of the colors.
			 * @param {string} type The type of the colors' accessor.
			 * @param {object} [options] More of the file.
			 * @param {boolean} [options.normalized] Whether the colors are normalized.
			 * @param {string} [options.alphaMode] The material's alpha mode.
			 * @returns {GltfMaker} The maker.
			 */
			const makeColored = ( colors: number[], componentType: number, type: string,
				options?: { normalized?: boolean, alphaMode?: string, baseColorFactor?: number[] } ) : GltfMaker =>
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const COLOR_0 = maker.addAccessor ( colors, componentType, type, ( options?.normalized ? { normalized: true } : {} ) );
				const material = maker.addMaterial ( {
					...( options?.alphaMode ? { alphaMode: options.alphaMode } : {} ),
					...( options?.baseColorFactor ? { pbrMetallicRoughness: { baseColorFactor: options.baseColorFactor } } : {} ),
				} );
				maker.addMeshNode ( [ { attributes: { POSITION, COLOR_0 }, material } ] );
				return maker;
			};

			it ( "Should have no colors without COLOR_0", async function ()
			{
				const geom = await readOne ( makeTriangle().glb() );
				expect ( geom.colors ).to.be.null;
			} );

			it ( "Should read three numbers for each color, with an alpha of one", async function ()
			{
				const geom = await readOne ( makeColored ( [ 1, 0, 0,   0, 1, 0,   0, 0, 1 ], GLTF_FLOAT, "VEC3" ).glb() );
				expect ( Array.from ( geom.colors!.values! ) ).to.deep.equal ( [ 1, 0, 0, 1,   0, 1, 0, 1,   0, 0, 1, 1 ] );
				expect ( geom.hasVertexColors ).to.be.true;
			} );

			it ( "Should keep the alpha only when blending", async function ()
			{
				const colors = [ 1, 0, 0, 0.5,   0, 1, 0, 0.25,   0, 0, 1, 0 ];
				const opaque = await readOne ( makeColored ( colors, GLTF_FLOAT, "VEC4" ).glb() );
				expect ( Array.from ( opaque.colors!.values! ) ).to.deep.equal ( [ 1, 0, 0, 1,   0, 1, 0, 1,   0, 0, 1, 1 ] );

				const blended = await readOne ( makeColored ( colors, GLTF_FLOAT, "VEC4", { alphaMode: "BLEND" } ).glb() );
				expect ( Array.from ( blended.colors!.values! ) ).to.deep.equal ( colors );
			} );

			it ( "Should scale normalized integers so that the largest is one", async function ()
			{
				const bytes = await readOne ( makeColored ( [ 255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255 ],
					GLTF_UNSIGNED_BYTE, "VEC4", { normalized: true } ).glb() );
				expect ( Array.from ( bytes.colors!.values! ) ).to.deep.equal ( [ 1, 0, 0, 1,   0, 1, 0, 1,   0, 0, 1, 1 ] );

				const shorts = await readOne ( makeColored ( [ 65535, 0, 0,   0, 65535, 0,   0, 0, 65535 ],
					GLTF_UNSIGNED_SHORT, "VEC3", { normalized: true } ).glb() );
				expect ( Array.from ( shorts.colors!.values! ) ).to.deep.equal ( [ 1, 0, 0, 1,   0, 1, 0, 1,   0, 0, 1, 1 ] );
			} );

			it ( "Should leave the colors for the shader to multiply by the material's color", async function ()
			{
				const colors = [ 1, 0.5, 0, 0.5,   0, 1, 0.5, 0.5,   0.5, 0, 1, 0.5 ];
				const baseColorFactor = [ 0.5, 1, 0.5, 0.5 ];
				const geom = await readOne ( makeColored ( colors, GLTF_FLOAT, "VEC4", { baseColorFactor, alphaMode: "BLEND" } ).glb() );
				expect ( Array.from ( geom.colors!.values! ) ).to.deep.equal ( colors );
			} );

			it ( "Should share the colors of an accessor used more than once that keep the alpha the same way", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				const COLOR_0 = maker.addAccessor ( [ 1, 0, 0, 0.5,   0, 1, 0, 0.5,   0, 0, 1, 0.5 ], GLTF_FLOAT, "VEC4" );
				const red = maker.addMaterial ( { pbrMetallicRoughness: { baseColorFactor: [ 1, 0, 0, 1 ] } } );
				const blend = maker.addMaterial ( { alphaMode: "BLEND" } );
				maker.addMeshNode ( [
					{ attributes: { POSITION, COLOR_0 } },
					{ attributes: { POSITION, COLOR_0 }, material: red },
					{ attributes: { POSITION, COLOR_0 }, material: blend },
				] );
				const [ a, b, c ] = getGeometries ( await read ( maker.glb() ) );
				expect ( a.colors ).to.equal ( b.colors );
				expect ( a.colors ).not.to.equal ( c.colors );
				expect ( Array.from ( c.colors!.values! ) ).to.deep.equal ( [ 1, 0, 0, 0.5,   0, 1, 0, 0.5,   0, 0, 1, 0.5 ] );
			} );

			it ( "Should reject colors of the wrong type or number", async function ()
			{
				const scalar = makeColored ( [ 1, 1, 1 ], GLTF_FLOAT, "SCALAR" );
				expect ( await getMessage ( scalar.glb() ) ).to.include ( "Accessor 1 has colors, so it should be a VEC3 or VEC4, not a SCALAR" );

				const fewer = makeColored ( [ 1, 0, 0,   0, 1, 0 ], GLTF_FLOAT, "VEC3" );
				expect ( await getMessage ( fewer.glb() ) ).to.include ( "There are 2 colors but 3 points" );
			} );
		} );

		describe ( "Extensions", function ()
		{
			it ( "Should reject required extensions that are not supported", async function ()
			{
				const maker = makeTriangle();
				maker.json.extensionsRequired = [ "KHR_draco_mesh_compression", "KHR_lights_punctual", "EXT_meshopt_compression" ];
				expect ( await getMessage ( maker.glb() ) ).to.include (
					"requires glTF extensions that are not supported: KHR_draco_mesh_compression, EXT_meshopt_compression" );
			} );

			it ( "Should read files that require extensions it can ignore", async function ()
			{
				const maker = makeTriangle();
				maker.json.extensionsRequired = [ "KHR_lights_punctual", "KHR_materials_variants", "KHR_mesh_quantization", "KHR_texture_transform" ];
				expect ( await readOne ( maker.glb() ) ).to.be.instanceOf ( Geometry );
			} );

			it ( "Should read files that use extensions without requiring them", async function ()
			{
				const maker = makeTriangle();
				maker.json.extensionsUsed = [ "KHR_draco_mesh_compression" ];
				expect ( await readOne ( maker.glb() ) ).to.be.instanceOf ( Geometry );
			} );

			it ( "Should read quantized points", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addAccessor ( [ 0, 0, 0,   32767, 0, 0,   0, 32767, 0 ], 5122, "VEC3", { normalized: true } );
				maker.addMeshNode ( [ { attributes: { POSITION } } ] );
				maker.json.extensionsRequired = [ "KHR_mesh_quantization" ];
				const geom = await readOne ( maker.glb() );
				expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( TRIANGLE_POINTS );
			} );
		} );

		describe ( "Progress", function ()
		{
			it ( "Should end with the number of primitives", async function ()
			{
				const maker = new GltfMaker();
				const POSITION = maker.addPoints ( TRIANGLE_POINTS );
				maker.addMeshNode ( [ { attributes: { POSITION } }, { attributes: { POSITION } } ] );
				const calls: number[][] = [];
				await read ( maker.glb(), ( value, total ) => { calls.push ( [ value, total ] ); return true; } );
				expect ( calls[calls.length - 1] ).to.deep.equal ( [ 2, 2 ] );
			} );

			it ( "Should stop when the callback says to", async function ()
			{
				const error = await getError ( read ( makeTriangle().glb(), () => false ) );
				expect ( error ).to.be.instanceOf ( Cancelled );
			} );
		} );

		describe ( "Other files", function ()
		{
			it ( "Should read points with a stride, like most exporters write", async function ()
			{
				// Each vertex has a point and then a normal, in one buffer view.
				const maker = new GltfMaker();
				const data = [ 0, 0, 0,   0, 0, 1,   1, 0, 0,   0, 0, 1,   0, 1, 0,   0, 0, 1 ];
				const bufferView = maker.addView ( new Uint8Array ( new Float32Array ( data ).buffer ), 24 );
				const POSITION = maker.addRawAccessor ( { bufferView, componentType: GLTF_FLOAT, type: "VEC3", count: 3 } );
				const NORMAL = maker.addRawAccessor ( { bufferView, byteOffset: 12, componentType: GLTF_FLOAT, type: "VEC3", count: 3 } );
				maker.addMeshNode ( [ { attributes: { POSITION, NORMAL } } ] );
				const geom = await readOne ( maker.gltf() );
				expect ( Array.from ( geom.points!.values! ) ).to.deep.equal ( TRIANGLE_POINTS );
				expect ( Array.from ( geom.normals!.values! ) ).to.deep.equal ( [ 0, 0, 1,   0, 0, 1,   0, 0, 1 ] );
			} );
		} );
	} );
};
