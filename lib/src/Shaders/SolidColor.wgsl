///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders a solid color, without lighting: the material's
//	diffuse color, times the vertex colors if there are any.
//	https://gist.github.com/ccincotti3/f5bbfca9acd27c0efb9a2d22509b5aca
//
///////////////////////////////////////////////////////////////////////////////

// The camera, in bind group 0. This has to match makeCameraUniforms().
struct Camera
{
	projMatrix: mat4x4f,
};

// The material, in bind group 1. This has to match makeMaterialUniforms().
struct Material
{
	diffuse: vec4f,
};

// The object, in bind group 2, from ObjectMatrices.
struct Object
{
	viewMatrix: mat4x4f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> camera : Camera;
@group ( 1 ) @binding ( 0 ) var<uniform> material : Material;
@group ( 2 ) @binding ( 0 ) var<uniform> object : Object;

// The diffuse texture and its sampler, after the material in bind group 1.
// Without a texture, it's a white one that gives exactly 1.
@group ( 1 ) @binding ( 1 ) var diffuseTexture : texture_2d<f32>;
@group ( 1 ) @binding ( 2 ) var diffuseSampler : sampler;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) color : vec4f,
	@location ( 1 ) texCoord : vec2f,
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
	var output : VertexOut;
	output.position = camera.projMatrix * object.viewMatrix * position;

	// The vertex color and texture coordinate, for the fragment shader.
	output.color = color;
	output.texCoord = texCoord;
	return output;
}

// The fragment shader for geometry without vertex colors. The diffuse
// texture multiplies the material's diffuse color.
@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	return shade ( material.diffuse * texel );
}

// The fragment shader for geometry with vertex colors. They and the diffuse
// texture multiply the material's diffuse color.
@fragment fn fsColors ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	return shade ( material.diffuse * fragData.color * texel );
}

fn shade ( color: vec4f ) -> vec4f
{
	// We assume that the canvas is configured for pre-multiplied alpha.
	return vec4 ( color.rgb * color.a, color.a );
}
