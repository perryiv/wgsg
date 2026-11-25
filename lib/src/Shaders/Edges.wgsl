///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code shared by the shaders that draw triangle edges. Each of them
//	starts with this code. See WithEdges.ts for how it works.
//
///////////////////////////////////////////////////////////////////////////////

// The camera, in bind group 0. This has to match makeCameraUniforms().
struct Camera
{
	projMatrix: mat4x4f,
	lightDir: vec3f,
};

// The material, in bind group 1, with the edge values after the ones in the
// other shaders that use the Lighting class. This has to match
// makeMaterialUniforms().
struct Material
{
	color: vec4f,
	twoSided: u32,
	edgeColor: vec4f,
	edgeWidth: f32,
};

// The object, in bind group 2, from ObjectMatrices.
struct Object
{
	viewMatrix: mat4x4f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> camera : Camera;
@group ( 1 ) @binding ( 0 ) var<uniform> material : Material;
@group ( 2 ) @binding ( 0 ) var<uniform> object : Object;

// The buffers that the vertices are pulled from, in bind group 3. Without
// indices, the indices binding holds a buffer that isn't read.
@group ( 3 ) @binding ( 0 ) var<storage, read> indices : array<u32>;
@group ( 3 ) @binding ( 1 ) var<storage, read> points : array<f32>;

// How to read the indices. These are the same as in WithEdges.ts.
const PULLED_INDICES_NONE = 0u;
const PULLED_INDICES_UINT16 = 1u;
const PULLED_INDICES_UINT32 = 2u;

// Return the index of the vertex at the given corner. The corners are
// counted from the start of the draw, three for each triangle.
fn getIndex ( corner: u32, mode: u32 ) -> u32
{
	switch ( mode )
	{
		case PULLED_INDICES_UINT16:
		{
			// Two 16-bit indices are packed in each 32-bit value, the first
			// one in the low half.
			let both = indices[corner / 2u];
			return select ( both & 0xFFFFu, both >> 16u, ( 1u == ( corner & 1u ) ) );
		}
		case PULLED_INDICES_UINT32:
		{
			return indices[corner];
		}
		default:
		{
			return corner;
		}
	}
}

// Return the point at the given index.
fn getPoint ( index: u32 ) -> vec4f
{
	let i = index * 3u;
	return vec4f ( points[i], points[i + 1u], points[i + 2u], 1.0 );
}

// Return the barycentric coordinate of the given corner. This assumes that
// the draw starts on the first corner of a triangle.
fn getBarycentric ( corner: u32 ) -> vec3f
{
	let which = corner % 3u;
	return vec3f ( f32 ( 0u == which ), f32 ( 1u == which ), f32 ( 2u == which ) );
}

// Return the color with the edge color added near the edges. The color is
// pre-multiplied by its alpha. The change is how much the barycentric
// coordinate changes from one pixel to the next, which is "fwidth" of it.
// That has to be called before any branching in the fragment shader.
fn addEdges ( color: vec4f, barycentric: vec3f, change: vec3f ) -> vec4f
{
	// The distance to each edge in pixels, and to the nearest one.
	let pixels = barycentric / max ( change, vec3f ( 1e-7 ) );
	let distance = min ( min ( pixels.x, pixels.y ), pixels.z );

	// The triangles on both sides of an edge each draw half of its width.
	// The half pixel more gives smooth sides.
	let coverage = clamp ( ( 0.5 * material.edgeWidth ) + 0.5 - distance, 0.0, 1.0 ) * material.edgeColor.a;

	// Blend in the edge color, keeping the alpha of the triangle.
	return mix ( color, vec4f ( material.edgeColor.rgb * color.a, color.a ), coverage );
}
