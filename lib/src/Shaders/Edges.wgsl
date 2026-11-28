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
//	starts with Lighting.wgsl and then this code. See WithEdges.ts for how it
//	works.
//
///////////////////////////////////////////////////////////////////////////////

// The material, in bind group 1: the surface, and then the edge values.
// This has to match makeMaterialUniforms(). The camera, the object, and the
// lighting are in Lighting.wgsl, which comes first.
struct Material
{
	surface: Surface,
	edgeColor: vec4f,
	edgeWidth: f32,
};

@group ( 1 ) @binding ( 0 ) var<uniform> material : Material;

// The buffers that the vertices are pulled from, in bind group 3. Without
// indices, the indices binding holds a buffer that isn't read.
@group ( 3 ) @binding ( 0 ) var<storage, read> indices : array<u32>;
@group ( 3 ) @binding ( 1 ) var<storage, read> points : array<f32>;
@group ( 3 ) @binding ( 3 ) var<storage, read> colors : array<f32>;

// How to read the indices, in the low bits of the mode, and the bit that
// says there are vertex colors. These are the same as in WithEdges.ts.
const PULLED_INDICES_NONE = 0u;
const PULLED_INDICES_UINT16 = 1u;
const PULLED_INDICES_UINT32 = 2u;
const PULLED_INDICES_MASK = 3u;
const PULLED_COLORS = 4u;

// Return the index of the vertex at the given corner. The corners are
// counted from the start of the draw, three for each triangle.
fn getIndex ( corner: u32, mode: u32 ) -> u32
{
	switch ( mode & PULLED_INDICES_MASK )
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

// See if there are vertex colors.
fn hasColors ( mode: u32 ) -> u32
{
	return select ( 0u, 1u, ( 0u != ( mode & PULLED_COLORS ) ) );
}

// Return the color of the vertex, or white if there are no vertex colors.
fn getColor ( index: u32, mode: u32 ) -> vec4f
{
	if ( 0u == hasColors ( mode ) )
	{
		return vec4f ( 1.0 );
	}
	let i = index * 4u;
	return vec4f ( colors[i], colors[i + 1u], colors[i + 2u], colors[i + 3u] );
}

// Return the vertex color for the lighting: the interpolated one if there
// are vertex colors, and otherwise exactly white, since the interpolated
// white can be off by a little.
fn getVertexColor ( color: vec4f, hasColors: u32 ) -> vec4f
{
	return select ( vec4f ( 1.0 ), color, ( 0u != hasColors ) );
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
