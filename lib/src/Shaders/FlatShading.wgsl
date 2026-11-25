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
//	from how the position changes between neighboring pixels.
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
	@location ( 0 ) viewPosition : vec3f,
};

@vertex fn vs ( @location ( 0 ) position: vec4f ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// Transform the position to view space, and pass it to the fragment
	// shader so that it can calculate the normal vector.
	let viewPosition = object.viewMatrix * position;
	answer.viewPosition = viewPosition.xyz;

	// Transform the position to clip space.
	answer.position = camera.projMatrix * viewPosition;

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut, @builtin ( front_facing ) frontFacing: bool ) -> @location ( 0 ) vec4f
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

	// Calculate the diffuse lighting factor.
	let dotProduct = dot ( normal, -camera.lightDir );
	let diffuse = select ( max ( dotProduct, 0.0 ), abs ( dotProduct ), ( material.twoSided != 0u ) );

	// Calculate the color, assuming that the canvas is configured
	// for pre-multiplied alpha.
	return vec4 ( material.color.rgb * diffuse * material.color.a, material.color.a );
}
