///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders a solid color.
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
	color: vec4f,
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
};

@vertex fn vs ( @location ( 0 ) position: vec4f ) -> VertexOut
{
	var output : VertexOut;
	output.position = camera.projMatrix * object.viewMatrix * position;
	return output;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	// We assume that the canvas is configured for pre-multiplied alpha.
	return vec4 ( material.color.rgb * material.color.a, material.color.a );
}
