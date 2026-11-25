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

// The camera, in bind group 0. This has to match makeCameraUniforms().
struct Camera
{
	projMatrix: mat4x4f,
	lightDir: vec3f,
};

// The material, in bind group 1. This has to match makeMaterialUniforms().
struct Material
{
	color: vec4f,
	twoSided: u32,
};

// The object, in bind group 2, from ObjectMatrices.
struct Object
{
	viewMatrix: mat4x4f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> camera : Camera;
@group ( 1 ) @binding ( 0 ) var<uniform> material : Material;
@group ( 2 ) @binding ( 0 ) var<uniform> object : Object;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) normal : vec3f,
};

@vertex fn vs ( @location ( 0 ) position: vec4f, @location ( 1 ) normal: vec3f ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// Transform the position to view space.
	answer.position = camera.projMatrix * object.viewMatrix * position;

	// Transform the normal to view space. We ignore the translation.
	answer.normal = normalize ( ( object.viewMatrix * vec4f ( normal, 0.0 ) ).xyz );

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	// Make sure the normal vector is unit length.
	let normal = normalize ( fragData.normal );

	// Calculate the diffuse lighting factor.
	let dotProduct = dot ( normal, -camera.lightDir );
	let diffuse = select ( max ( dotProduct, 0.0 ), abs ( dotProduct ), ( material.twoSided != 0u ) );

	// Calculate the color, assuming that the canvas is configured
	// for pre-multiplied alpha.
	return vec4 ( material.color.rgb * diffuse * material.color.a, material.color.a );
}
