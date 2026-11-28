///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders with Phong shading. It is appended to
//	Lighting.wgsl.
//	https://gist.github.com/ccincotti3/f5bbfca9acd27c0efb9a2d22509b5aca
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
	@location ( 0 ) normal : vec3f,
	@location ( 1 ) color : vec4f,
	@location ( 2 ) texCoord : vec2f,
};

// The vertex shader for geometry without vertex colors.
@vertex fn vs ( @location ( 0 ) position: vec4f, @location ( 1 ) normal: vec3f, @location ( 3 ) texCoord: vec2f ) -> VertexOut
{
	return makeVertex ( position, normal, vec4f ( 1.0 ), texCoord );
}

// The vertex shader for geometry with vertex colors.
@vertex fn vsColors ( @location ( 0 ) position: vec4f, @location ( 1 ) normal: vec3f, @location ( 2 ) color: vec4f, @location ( 3 ) texCoord: vec2f ) -> VertexOut
{
	return makeVertex ( position, normal, color, texCoord );
}

fn makeVertex ( position: vec4f, normal: vec3f, color: vec4f, texCoord: vec2f ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// The vertex color, for the fragment shader.
	answer.color = color;
	answer.texCoord = texCoord;

	// Transform the position to view space.
	answer.position = camera.projMatrix * object.viewMatrix * position;

	// Transform the normal to view space. We ignore the translation.
	answer.normal = normalize ( ( object.viewMatrix * vec4f ( normal, 0.0 ) ).xyz );

	// Return the answer.
	return answer;
}

// The fragment shader for geometry without vertex colors. It doesn't use the
// interpolated white, which can be off by a little.
@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	return light ( normalize ( fragData.normal ), material.surface, texel );
}

// The fragment shader for geometry with vertex colors, which multiply the
// material's ambient and diffuse colors.
@fragment fn fsColors ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );
	return light ( normalize ( fragData.normal ), material.surface, ( fragData.color * texel ) );
}
