///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders with Phong shading.
//	https://gist.github.com/ccincotti3/f5bbfca9acd27c0efb9a2d22509b5aca
//
///////////////////////////////////////////////////////////////////////////////

struct Uniforms
{
	projMatrix: mat4x4f,
	viewMatrix: mat4x4f,
	color: vec4f,
	lightDir: vec3f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> uniforms : Uniforms;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) normal : vec3f,
};

@group ( 0 ) @binding ( 1 ) var<uniform> twoSided : u32;

@vertex fn vs ( @location ( 0 ) position: vec4f, @location ( 1 ) normal: vec3f ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// Transform the position to view space.
	answer.position = uniforms.projMatrix * uniforms.viewMatrix * position;

	// Transform the normal to view space. We ignore the translation.
	answer.normal = normalize ( ( uniforms.viewMatrix * vec4f ( normal, 0.0 ) ).xyz );

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	// Make sure the normal vector is unit length.
	let normal = normalize ( fragData.normal );

	// Calculate the diffuse lighting factor.
	let dotProduct = dot ( normal, -uniforms.lightDir );
	let diffuse = select ( max ( dotProduct, 0.0 ), abs ( dotProduct ), twoSided != 0u );

	// Calculate the color, assuming that the canvas is configured
	// for pre-multiplied alpha.
	return vec4 ( uniforms.color.rgb * diffuse * uniforms.color.a, uniforms.color.a );
}
