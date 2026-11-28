///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders with flat shading. The geometry does not need
//	normal vectors. The fragment shader calculates the normal of the triangle
//	from how the position changes between neighboring pixels. It is appended
//	to Lighting.wgsl.
//
///////////////////////////////////////////////////////////////////////////////

// The material, in bind group 1. This has to match makeMaterialUniforms().
// The camera, the object, and the lighting are in Lighting.wgsl, which comes
// first.
struct Material
{
	surface: Surface,
};

@group ( 1 ) @binding ( 0 ) var<uniform> material : Material;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) viewPosition : vec3f,
	@location ( 1 ) color : vec4f,
	@location ( 2 ) texCoord : vec2f,
};

// The vertex shader for geometry without vertex colors.
@vertex fn vs ( @location ( 0 ) position: vec4f, @location ( 3 ) texCoord: vec2f ) -> VertexOut
{
	return makeVertex ( position, vec4f ( 1.0 ), texCoord );
}

// The vertex shader for geometry with vertex colors.
@vertex fn vsColors ( @location ( 0 ) position: vec4f, @location ( 2 ) color: vec4f, @location ( 3 ) texCoord: vec2f ) -> VertexOut
{
	return makeVertex ( position, color, texCoord );
}

fn makeVertex ( position: vec4f, color: vec4f, texCoord: vec2f ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// The vertex color, for the fragment shader.
	answer.color = color;
	answer.texCoord = texCoord;

	// Transform the position to view space, and pass it to the fragment
	// shader so that it can calculate the normal vector.
	let viewPosition = object.viewMatrix * position;
	answer.viewPosition = viewPosition.xyz;

	// Transform the position to clip space.
	answer.position = camera.projMatrix * viewPosition;

	// Return the answer.
	return answer;
}

// The fragment shader for geometry without vertex colors. It doesn't use the
// interpolated white, which can be off by a little.
@fragment fn fs ( fragData: VertexOut, @builtin ( front_facing ) frontFacing: bool ) -> @location ( 0 ) vec4f
{
	let normal = getNormal ( fragData, frontFacing );
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	let glow = textureSample ( emissiveTexture, emissiveSampler, fragData.texCoord );
	return light ( normal, material.surface, texel, glow );
}

// The fragment shader for geometry with vertex colors, which multiply the
// material's ambient and diffuse colors.
@fragment fn fsColors ( fragData: VertexOut, @builtin ( front_facing ) frontFacing: bool ) -> @location ( 0 ) vec4f
{
	let normal = getNormal ( fragData, frontFacing );
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	let glow = textureSample ( emissiveTexture, emissiveSampler, fragData.texCoord );
	return light ( normal, material.surface, ( fragData.color * texel ), glow );
}

// Return the normal of the triangle, in view space.
fn getNormal ( fragData: VertexOut, frontFacing: bool ) -> vec3f
{
	// How the view-space position changes from one pixel to the next, to the
	// right (x) and down (y). Both vectors are in the plane of the triangle,
	// so their cross product is the triangle's normal vector. In this order
	// it points towards the camera, because the screen's y axis points down.
	// These have to be called before any branching.
	let dx = dpdx ( fragData.viewPosition );
	let dy = dpdy ( fragData.viewPosition );
	var normal = normalize ( cross ( dy, dx ) );

	// The normal above always points towards the camera, no matter which way
	// the triangle is wound. Flip it for the back of the triangle so that
	// one-sided lighting works like it does with normal vectors.
	if ( !frontFacing )
	{
		normal = -normal;
	}
	return normal;
}
