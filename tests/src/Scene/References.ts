///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Test the reference counting of nodes, primitives, and arrays. The tests
//	that check GPU buffers need a GPU.
//
///////////////////////////////////////////////////////////////////////////////

import { Array1 } from "../../../lib/src/Arrays";
import { Base } from "../../../lib/src/Base";
import { Device } from "../../../lib/src/Tools/Device";
import { expect } from "chai";
import { Geometry, Group, SphereNode } from "../../../lib/src/Scene/Nodes";
import { Indexed } from "../../../lib/src/Scene/Primitives/Indexed";
import { Viewer } from "../../../lib/src/Viewers/Viewer";


///////////////////////////////////////////////////////////////////////////////
//
//	Helpers.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * A class that counts how often its hooks are called.
 */
class Counted extends Base
{
	public firstRefs = 0;
	public lastUnrefs = 0;
	public override getClassName() : string { return "Tests.Counted"; }
	protected override onFirstRef() : void { ++this.firstRefs; }
	protected override onLastUnref() : void { ++this.lastUnrefs; }
}

/**
 * Make a small array of points.
 * @returns {Array1<Float32Array>} The array.
 */
const makePoints = () : Array1 < Float32Array > =>
{
	return new Array1 ( new Float32Array ( [ 0, 0, 0,   1, 0, 0,   0, 1, 0 ] ) );
};

/**
 * Make a geometry with all of its arrays and an indexed primitive list.
 * @returns {Geometry} The geometry.
 */
const makeGeometry = () : Geometry =>
{
	return new Geometry ( {
		points: makePoints(),
		normals: makePoints(),
		colors: new Array1 ( new Float32Array ( [ 1, 0, 0, 1,   0, 1, 0, 1,   0, 0, 1, 1 ] ) ),
		texCoords: new Array1 ( new Float32Array ( [ 0, 0,   1, 0,   0, 1 ] ) ),
		primitives: new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } ),
	} );
};

/**
 * Get all the arrays of the geometry, including the indices.
 * @param {Geometry} geom - The geometry.
 * @returns {Array1[]} The arrays.
 */
const getArrays = ( geom: Geometry ) : Array1 < Float32Array | Uint32Array | Uint16Array >[] =>
{
	const indexed = geom.primitives![0] as Indexed;
	return [ geom.points!, geom.normals!, geom.colors!, geom.texCoords!, indexed.indices! ];
};

/**
 * See if the GPU buffer was destroyed. Writing to a destroyed buffer is an error.
 * @param {GPUBuffer} buffer - The buffer.
 * @returns {Promise<boolean>} True if the buffer was destroyed.
 */
const isDestroyed = async ( buffer: GPUBuffer ) : Promise < boolean > =>
{
	const device = Device.instance.device;
	device.pushErrorScope ( "validation" );
	device.queue.writeBuffer ( buffer, 0, new Float32Array ( 1 ) );
	return ( null !== ( await device.popErrorScope() ) );
};


///////////////////////////////////////////////////////////////////////////////
//
//	Test the code.
//
///////////////////////////////////////////////////////////////////////////////

export function test ()
{
	describe ( "Reference counting", function ()
	{
		describe ( "Base", function ()
		{
			it ( "Should start with zero references", function ()
			{
				expect ( new Counted().refCount ).to.equal ( 0 );
			} );

			it ( "Should count references up and down", function ()
			{
				const c = new Counted();
				c.ref();
				c.ref();
				expect ( c.refCount ).to.equal ( 2 );
				c.unref();
				expect ( c.refCount ).to.equal ( 1 );
				c.unref();
				expect ( c.refCount ).to.equal ( 0 );
			} );

			it ( "Should call the hooks only when the count goes between 0 and 1", function ()
			{
				const c = new Counted();
				c.ref();
				c.ref();
				c.unref();
				expect ( c.firstRefs ).to.equal ( 1 );
				expect ( c.lastUnrefs ).to.equal ( 0 );
				c.unref();
				expect ( c.lastUnrefs ).to.equal ( 1 );

				// It can be used again.
				c.ref();
				expect ( c.firstRefs ).to.equal ( 2 );
			} );

			it ( "Should throw when unreferenced too many times", function ()
			{
				const c = new Counted();
				expect ( () => { c.unref(); } ).to.throw();
				expect ( c.refCount ).to.equal ( 0 );
			} );
		} );

		describe ( "Array1", function ()
		{
			it ( "Should destroy its GPU buffer when nothing uses it, but keep its values", async function ()
			{
				const a = makePoints();
				const buffer = a.buffer!;
				a.ref();
				a.unref();
				expect ( await isDestroyed ( buffer ) ).to.be.true;
				expect ( a.values ).to.not.be.null;

				// A new buffer is made when it is used again.
				expect ( a.buffer ).to.not.be.null;
				expect ( a.buffer ).to.not.equal ( buffer );
			} );

			it ( "Should keep its GPU buffer while something still uses it", async function ()
			{
				const a = makePoints();
				const buffer = a.buffer!;
				a.ref();
				a.ref();
				a.unref();
				expect ( await isDestroyed ( buffer ) ).to.be.false;
				expect ( a.buffer ).to.equal ( buffer );
				a.unref();
				expect ( await isDestroyed ( buffer ) ).to.be.true;
			} );
		} );

		describe ( "Group", function ()
		{
			it ( "Should not count children of a group that is not used", function ()
			{
				const group = new Group();
				const child = new Group();
				group.addChild ( child );
				expect ( child.refCount ).to.equal ( 0 );
			} );

			it ( "Should count the children when the group starts being used", function ()
			{
				const group = new Group();
				const child = new Group();
				group.addChild ( child );
				group.ref();
				expect ( child.refCount ).to.equal ( 1 );
				group.unref();
				expect ( child.refCount ).to.equal ( 0 );
			} );

			it ( "Should count a child added to or removed from a group that is used", function ()
			{
				const group = new Group();
				group.ref();
				const child = new Group();
				group.addChild ( child );
				expect ( child.refCount ).to.equal ( 1 );
				group.removeChild ( 0 );
				expect ( child.refCount ).to.equal ( 0 );
			} );

			it ( "Should stop counting all the children when a used group is cleared", function ()
			{
				const group = new Group();
				group.ref();
				const a = new Group();
				const b = new Group();
				group.addChild ( a );
				group.addChild ( b );
				group.clear();
				expect ( a.refCount ).to.equal ( 0 );
				expect ( b.refCount ).to.equal ( 0 );
				expect ( group.size ).to.equal ( 0 );
			} );

			it ( "Should count a child once for each parent that uses it", function ()
			{
				const p1 = new Group();
				const p2 = new Group();
				p1.ref();
				p2.ref();
				const child = new Group();
				p1.addChild ( child );
				p2.addChild ( child );
				expect ( child.refCount ).to.equal ( 2 );
				p1.removeChild ( 0 );
				expect ( child.refCount ).to.equal ( 1 );
			} );

			it ( "Should count grandchildren, and keep the children when no longer used", function ()
			{
				const root = new Group();
				const child = new Group();
				const grandchild = new Group();
				root.addChild ( child );
				child.addChild ( grandchild );

				root.ref();
				expect ( grandchild.refCount ).to.equal ( 1 );
				root.unref();
				expect ( grandchild.refCount ).to.equal ( 0 );

				// The structure is kept, so it can be used again.
				expect ( root.size ).to.equal ( 1 );
				expect ( child.size ).to.equal ( 1 );
				root.ref();
				expect ( grandchild.refCount ).to.equal ( 1 );
			} );

			it ( "Should not change the count when adding a child twice fails", function ()
			{
				const group = new Group();
				group.ref();
				const child = new Group();
				group.addChild ( child );
				expect ( () => { group.addChild ( child ); } ).to.throw();
				expect ( child.refCount ).to.equal ( 1 );
			} );
		} );

		describe ( "Geometry", function ()
		{
			it ( "Should count its arrays and primitives only while it is used", function ()
			{
				const geom = makeGeometry();
				const arrays = getArrays ( geom );
				const primitive = geom.primitives![0];

				for ( const a of arrays ) { expect ( a.refCount ).to.equal ( 0 ); }
				expect ( primitive.refCount ).to.equal ( 0 );

				geom.ref();
				for ( const a of arrays ) { expect ( a.refCount ).to.equal ( 1 ); }
				expect ( primitive.refCount ).to.equal ( 1 );

				geom.unref();
				for ( const a of arrays ) { expect ( a.refCount ).to.equal ( 0 ); }
				expect ( primitive.refCount ).to.equal ( 0 );
			} );

			it ( "Should count a new array instead of the old one when it is used", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const oldColors = geom.colors!;
				const newColors = new Array1 ( new Float32Array ( 12 ) );
				geom.colors = newColors;
				expect ( newColors.refCount ).to.equal ( 1 );
				expect ( oldColors.refCount ).to.equal ( 0 );
			} );

			it ( "Should count an array given as a plain typed array", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				geom.points = new Float32Array ( 9 );
				expect ( geom.points!.refCount ).to.equal ( 1 );
			} );

			it ( "Should not change the count when the same array is set again", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const points = geom.points!;
				geom.points = points;
				expect ( points.refCount ).to.equal ( 1 );
			} );

			it ( "Should not count arrays when it is not used", function ()
			{
				const geom = makeGeometry();
				const colors = new Array1 ( new Float32Array ( 12 ) );
				geom.colors = colors;
				expect ( colors.refCount ).to.equal ( 0 );
			} );

			it ( "Should count an array shared by two geometries twice", function ()
			{
				const points = makePoints();
				const g1 = new Geometry ( { points } );
				const g2 = new Geometry ( { points } );
				g1.ref();
				g2.ref();
				expect ( points.refCount ).to.equal ( 2 );
				g1.unref();
				expect ( points.refCount ).to.equal ( 1 );
			} );

			it ( "Should count new primitives instead of the old ones when it is used", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const kept = geom.primitives![0];
				const removed = new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } );
				geom.primitives = [ kept, removed ];
				expect ( kept.refCount ).to.equal ( 1 );
				expect ( removed.refCount ).to.equal ( 1 );

				const added = new Indexed ( { topology: "triangle-list", indices: [ 2, 1, 0 ] } );
				geom.primitives = [ kept, added ];
				expect ( kept.refCount ).to.equal ( 1 );
				expect ( removed.refCount ).to.equal ( 0 );
				expect ( added.refCount ).to.equal ( 1 );
			} );

			it ( "Should destroy the GPU buffers of a geometry that is removed from a used group", async function ()
			{
				const group = new Group();
				group.ref();
				const geom = makeGeometry();
				group.addChild ( geom );
				const buffers = getArrays ( geom ).map ( ( a ) => a.buffer! );

				group.removeChild ( 0 );
				for ( const buffer of buffers )
				{
					expect ( await isDestroyed ( buffer ) ).to.be.true;
				}
			} );

			it ( "Should destroy the GPU buffer of an array that is replaced", async function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const buffer = geom.colors!.buffer!;
				geom.colors = new Float32Array ( 12 );
				expect ( await isDestroyed ( buffer ) ).to.be.true;
			} );

			it ( "Should keep the GPU buffer of an array that another geometry still uses", async function ()
			{
				const points = makePoints();
				const g1 = new Geometry ( { points } );
				const g2 = new Geometry ( { points } );
				g1.ref();
				g2.ref();
				const buffer = points.buffer!;
				g1.unref();
				expect ( await isDestroyed ( buffer ) ).to.be.false;
			} );
		} );

		describe ( "Indexed", function ()
		{
			it ( "Should count a new index array instead of the old one when it is used", function ()
			{
				const prims = new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } );
				prims.ref();
				const oldIndices = prims.indices!;
				expect ( oldIndices.refCount ).to.equal ( 1 );

				prims.indices = [ 2, 1, 0 ];
				expect ( prims.indices!.refCount ).to.equal ( 1 );
				expect ( oldIndices.refCount ).to.equal ( 0 );

				prims.unref();
				expect ( prims.indices!.refCount ).to.equal ( 0 );
			} );
		} );

		describe ( "SphereNode", function ()
		{
			it ( "Should release its old arrays when it makes new ones", function ()
			{
				const group = new Group();
				group.ref();
				const sphere = new SphereNode ( { numSubdivisions: 1 } );
				group.addChild ( sphere );
				const oldPoints = sphere.points!;
				expect ( oldPoints.refCount ).to.equal ( 1 );

				// Changing the subdivisions makes new arrays when it updates.
				sphere.numSubdivisions = 2;
				sphere.update();
				expect ( sphere.points ).to.not.equal ( oldPoints );
				expect ( sphere.points!.refCount ).to.equal ( 1 );
				expect ( oldPoints.refCount ).to.equal ( 0 );
			} );
		} );

		describe ( "More scenarios", function ()
		{
			it ( "Should handle many references to the same object", function ()
			{
				const c = new Counted();
				for ( let i = 0; i < 100; ++i ) { c.ref(); }
				for ( let i = 0; i < 99; ++i ) { c.unref(); }
				expect ( c.refCount ).to.equal ( 1 );
				expect ( c.lastUnrefs ).to.equal ( 0 );
				c.unref();
				expect ( c.lastUnrefs ).to.equal ( 1 );
				expect ( c.firstRefs ).to.equal ( 1 );
			} );

			it ( "Should count a whole subtree when it is added to a used group", function ()
			{
				// Build the subtree first, while nothing uses it.
				const subtree = new Group();
				const child = new Group();
				const geom = makeGeometry();
				subtree.addChild ( child );
				child.addChild ( geom );
				expect ( geom.points!.refCount ).to.equal ( 0 );

				const root = new Group();
				root.ref();
				root.addChild ( subtree );
				expect ( child.refCount ).to.equal ( 1 );
				expect ( geom.refCount ).to.equal ( 1 );
				for ( const a of getArrays ( geom ) ) { expect ( a.refCount ).to.equal ( 1 ); }

				root.removeChild ( 0 );
				expect ( geom.refCount ).to.equal ( 0 );
				for ( const a of getArrays ( geom ) ) { expect ( a.refCount ).to.equal ( 0 ); }
			} );

			it ( "Should count a node in a long chain of groups", function ()
			{
				const groups = [ new Group() ];
				for ( let i = 1; i < 10; ++i )
				{
					const group = new Group();
					groups[i - 1].addChild ( group );
					groups.push ( group );
				}
				const geom = makeGeometry();
				groups[9].addChild ( geom );

				groups[0].ref();
				expect ( geom.points!.refCount ).to.equal ( 1 );

				// Cut the chain in the middle.
				groups[4].removeChild ( 0 );
				expect ( groups[5].refCount ).to.equal ( 0 );
				expect ( geom.points!.refCount ).to.equal ( 0 );

				// Put it back.
				groups[4].addChild ( groups[5] );
				expect ( geom.points!.refCount ).to.equal ( 1 );
			} );

			it ( "Should count a node shared by a used group and a group that is not used", function ()
			{
				const used = new Group();
				used.ref();
				const unused = new Group();
				const child = new Group();
				used.addChild ( child );
				unused.addChild ( child );
				expect ( child.refCount ).to.equal ( 1 );

				// The other group starts being used.
				unused.ref();
				expect ( child.refCount ).to.equal ( 2 );

				// Clearing the first group leaves the second.
				used.clear();
				expect ( child.refCount ).to.equal ( 1 );
			} );

			it ( "Should count a node reached two ways in a diamond", function ()
			{
				//      root
				//     /    \
				//    a      b
				//     \    /
				//     shared
				const root = new Group();
				const a = new Group();
				const b = new Group();
				const shared = makeGeometry();
				root.addChild ( a );
				root.addChild ( b );
				a.addChild ( shared );
				b.addChild ( shared );

				root.ref();
				expect ( shared.refCount ).to.equal ( 2 );

				// The arrays are counted once per geometry, not once per path.
				expect ( shared.points!.refCount ).to.equal ( 1 );

				root.removeChild ( 0 ); // Remove "a".
				expect ( shared.refCount ).to.equal ( 1 );
				expect ( shared.points!.refCount ).to.equal ( 1 );

				root.unref();
				expect ( shared.refCount ).to.equal ( 0 );
				expect ( shared.points!.refCount ).to.equal ( 0 );
			} );

			it ( "Should not change counts when removing a child from a group that is not used", function ()
			{
				const used = new Group();
				used.ref();
				const unused = new Group();
				const child = new Group();
				used.addChild ( child );
				unused.addChild ( child );
				unused.removeChild ( 0 );
				expect ( child.refCount ).to.equal ( 1 );
				unused.addChild ( child );
				unused.clear();
				expect ( child.refCount ).to.equal ( 1 );
			} );

			it ( "Should not change counts for an invalid index or a null child", function ()
			{
				const group = new Group();
				group.ref();
				const child = new Group();
				group.addChild ( child );
				expect ( group.removeChild ( 5 ) ).to.be.false;
				expect ( group.removeChild ( -1 ) ).to.be.false;
				group.addChild ( null );
				expect ( child.refCount ).to.equal ( 1 );
				expect ( group.size ).to.equal ( 1 );
			} );

			it ( "Should count when a geometry is used more than once", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				geom.ref();
				expect ( geom.points!.refCount ).to.equal ( 1 );
				geom.unref();
				expect ( geom.points!.refCount ).to.equal ( 1 );
				geom.unref();
				expect ( geom.points!.refCount ).to.equal ( 0 );
			} );

			it ( "Should stop counting an array that is set to null", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const normals = geom.normals!;
				geom.normals = null;
				expect ( normals.refCount ).to.equal ( 0 );
				expect ( geom.normals ).to.be.null;

				// Unreferencing the geometry later does not unreference it again.
				geom.unref();
				expect ( normals.refCount ).to.equal ( 0 );
			} );

			it ( "Should count each array of a used geometry when it is replaced", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const [ points, normals, colors, texCoords ] = getArrays ( geom );
				geom.points = new Float32Array ( 9 );
				geom.normals = new Float32Array ( 9 );
				geom.colors = new Float32Array ( 12 );
				geom.texCoords = new Float32Array ( 6 );
				for ( const a of [ points, normals, colors, texCoords ] ) { expect ( a.refCount ).to.equal ( 0 ); }
				for ( const a of getArrays ( geom ) ) { expect ( a.refCount ).to.equal ( 1 ); }
			} );

			it ( "Should count an array used in two slots of the same geometry twice", function ()
			{
				const same = makePoints();
				const geom = new Geometry ( { points: same, normals: same } );
				geom.ref();
				expect ( same.refCount ).to.equal ( 2 );
				geom.normals = makePoints();
				expect ( same.refCount ).to.equal ( 1 );
				geom.unref();
				expect ( same.refCount ).to.equal ( 0 );
			} );

			it ( "Should handle primitives given as one item, the same list again, or null", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				const first = geom.primitives![0];

				// One item instead of a list.
				const single = new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } );
				geom.primitives = single;
				expect ( single.refCount ).to.equal ( 1 );
				expect ( first.refCount ).to.equal ( 0 );

				// The same list again.
				const list = geom.primitives;
				geom.primitives = list;
				expect ( single.refCount ).to.equal ( 1 );

				// Null.
				geom.primitives = null;
				expect ( single.refCount ).to.equal ( 0 );
				expect ( single.indices!.refCount ).to.equal ( 0 );
			} );

			it ( "Should count a primitive list shared by two geometries", function ()
			{
				const prims = new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } );
				const g1 = new Geometry ( { points: makePoints(), primitives: prims } );
				const g2 = new Geometry ( { points: makePoints(), primitives: prims } );
				g1.ref();
				g2.ref();
				expect ( prims.refCount ).to.equal ( 2 );
				expect ( prims.indices!.refCount ).to.equal ( 1 );
				g1.unref();
				expect ( prims.indices!.refCount ).to.equal ( 1 );
				g2.unref();
				expect ( prims.indices!.refCount ).to.equal ( 0 );
			} );

			it ( "Should stop counting the indices when they are set to null", function ()
			{
				const prims = new Indexed ( { topology: "triangle-list", indices: [ 0, 1, 2 ] } );
				prims.ref();
				const indices = prims.indices!;
				prims.indices = null;
				expect ( indices.refCount ).to.equal ( 0 );
				prims.unref();
				expect ( indices.refCount ).to.equal ( 0 );
			} );

			it ( "Should not change the count when an array's values change", function ()
			{
				const geom = makeGeometry();
				geom.ref();
				geom.points!.values = new Float32Array ( 9 );
				expect ( geom.points!.refCount ).to.equal ( 1 );
			} );
		} );

		describe ( "Random operations", function ()
		{
			// Do many random operations on a small scene, and after each one
			// check every count against what it should be. The random numbers
			// always start from the same seed, so a failure can be repeated.
			it ( "Should have the right counts after every operation", function ()
			{
				// A simple random number generator with a seed (mulberry32).
				let seed = 12345;
				const random = () : number =>
				{
					seed = ( seed + 0x6D2B79F5 ) | 0;
					let t = seed;
					t = Math.imul ( t ^ ( t >>> 15 ), t | 1 );
					t ^= t + Math.imul ( t ^ ( t >>> 7 ), t | 61 );
					return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
				};
				const pick = < T > ( items: T[] ) : T => items[Math.floor ( random() * items.length )];

				// The scene.
				const groups = [ 0, 1, 2, 3, 4 ].map ( () => new Group() );
				const geoms = [ 0, 1, 2, 3 ].map ( () => new Geometry() );
				const arrays = [ 0, 1, 2, 3, 4 ].map ( () => makePoints() );
				const nodes = [ ...groups, ...geoms ];
				const rootRefs = new Map < Group, number > ( groups.map ( ( g ) => [ g, 0 ] ) );

				// Can we get from the node down to the target? Used to avoid cycles.
				const reaches = ( node: Group | Geometry, target: Group ) : boolean =>
				{
					if ( node === target ) { return true; }
					let answer = false;
					if ( node instanceof Group )
					{
						node.forEachChild ( ( child ) => { answer ||= reaches ( child as Group | Geometry, target ); } );
					}
					return answer;
				};

				// What the counts should be. A node is used if the test references
				// it directly, or if any group that has it as a child is used.
				const parentsOf = ( node: Group | Geometry ) : Group[] =>
				{
					return groups.filter ( ( g ) => ( g.indexOf ( node ) >= 0 ) );
				};
				const isUsed = ( node: Group | Geometry ) : boolean =>
				{
					if ( ( node instanceof Group ) && ( rootRefs.get ( node )! > 0 ) ) { return true; }
					return parentsOf ( node ).some ( ( p ) => isUsed ( p ) );
				};
				const expectedNodeCount = ( node: Group | Geometry ) : number =>
				{
					const direct = ( ( node instanceof Group ) ? rootRefs.get ( node )! : 0 );
					return direct + parentsOf ( node ).filter ( ( p ) => isUsed ( p ) ).length;
				};
				const expectedArrayCount = ( array: Array1 < Float32Array > ) : number =>
				{
					let count = 0;
					for ( const g of geoms )
					{
						if ( isUsed ( g ) )
						{
							count += [ g.points, g.normals, g.colors ].filter ( ( a ) => ( a === array ) ).length;
						}
					}
					return count;
				};

				for ( let step = 0; step < 2000; ++step )
				{
					const op = random();
					let what = "";

					if ( op < 0.3 )
					{
						const group = pick ( groups );
						const node = pick ( nodes );
						if ( ( group.indexOf ( node ) < 0 ) && ( false === reaches ( node, group ) ) )
						{
							group.addChild ( node );
							what = `add ${node.id} to ${group.id}`;
						}
					}
					else if ( op < 0.5 )
					{
						const group = pick ( groups );
						if ( group.size > 0 )
						{
							group.removeChild ( Math.floor ( random() * group.size ) );
							what = `remove from ${group.id}`;
						}
					}
					else if ( op < 0.55 )
					{
						const group = pick ( groups );
						group.clear();
						what = `clear ${group.id}`;
					}
					else if ( op < 0.8 )
					{
						const geom = pick ( geoms );
						const array = ( ( random() < 0.2 ) ? null : pick ( arrays ) );
						const slot = pick ( [ "points", "normals", "colors" ] as const );
						geom[slot] = array;
						what = `set ${slot} of ${geom.id}`;
					}
					else if ( op < 0.9 )
					{
						const group = pick ( groups );
						group.ref();
						rootRefs.set ( group, rootRefs.get ( group )! + 1 );
						what = `ref ${group.id}`;
					}
					else
					{
						const group = pick ( groups );
						if ( rootRefs.get ( group )! > 0 )
						{
							group.unref();
							rootRefs.set ( group, rootRefs.get ( group )! - 1 );
							what = `unref ${group.id}`;
						}
					}

					// Check everything.
					for ( const node of nodes )
					{
						expect ( node.refCount, `node ${node.id} after step ${step}: ${what}` ).to.equal ( expectedNodeCount ( node ) );
					}
					arrays.forEach ( ( array, i ) =>
					{
						expect ( array.refCount, `array ${i} after step ${step}: ${what}` ).to.equal ( expectedArrayCount ( array ) );
					} );
				}
			} );
		} );

		describe ( "Viewer", function ()
		{
			it ( "Should count the new model scene instead of the old one", function ()
			{
				const viewer = new Viewer ( { canvas: document.createElement ( "canvas" ) } );
				const first = makeGeometry();
				const second = makeGeometry();
				viewer.modelScene = first;
				viewer.modelScene = second;
				expect ( first.refCount ).to.equal ( 0 );
				expect ( second.refCount ).to.equal ( 1 );
				viewer.destroy();
				expect ( second.refCount ).to.equal ( 0 );
			} );

			it ( "Should leave a scene used somewhere else counted after the viewer is done", function ()
			{
				const other = new Group();
				other.ref();
				const scene = makeGeometry();
				other.addChild ( scene );

				const viewer = new Viewer ( { canvas: document.createElement ( "canvas" ) } );
				viewer.modelScene = scene;
				expect ( scene.refCount ).to.equal ( 2 );
				viewer.destroy();
				expect ( scene.refCount ).to.equal ( 1 );
				expect ( scene.points!.refCount ).to.equal ( 1 );
			} );

			it ( "Should use the model scene while it is shown", function ()
			{
				const viewer = new Viewer ( { canvas: document.createElement ( "canvas" ) } );
				const scene = makeGeometry();
				viewer.modelScene = scene;
				expect ( scene.refCount ).to.equal ( 1 );

				viewer.modelScene = null;
				expect ( scene.refCount ).to.equal ( 0 );
				viewer.destroy();
			} );

			it ( "Should keep the GPU buffers when the same model scene is set again", async function ()
			{
				const viewer = new Viewer ( { canvas: document.createElement ( "canvas" ) } );
				const scene = makeGeometry();
				viewer.modelScene = scene;
				const buffer = scene.points!.buffer!;

				viewer.modelScene = scene;
				expect ( scene.refCount ).to.equal ( 1 );
				expect ( await isDestroyed ( buffer ) ).to.be.false;
				viewer.destroy();
			} );

			it ( "Should release the scene when the viewer is destroyed", async function ()
			{
				const viewer = new Viewer ( { canvas: document.createElement ( "canvas" ) } );
				const scene = makeGeometry();
				viewer.modelScene = scene;
				const buffer = scene.points!.buffer!;

				viewer.destroy();
				expect ( scene.refCount ).to.equal ( 0 );
				expect ( await isDestroyed ( buffer ) ).to.be.true;
			} );
		} );
	} );
};
