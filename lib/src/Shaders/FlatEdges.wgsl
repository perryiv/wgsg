///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders with flat shading and draws the triangle edges.
//	It is appended to Edges.wgsl. The lighting is the same as FlatShading.wgsl.
//
///////////////////////////////////////////////////////////////////////////////

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) viewPosition : vec3f,
	@location ( 1 ) barycentric : vec3f,
};

@vertex fn vs ( @builtin ( vertex_index ) corner: u32, @builtin ( instance_index ) mode: u32 ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// Get the point.
	let position = getPoint ( getIndex ( corner, mode ) );

	// Transform the position to view space, and pass it to the fragment
	// shader so that it can calculate the normal vector.
	let viewPosition = object.viewMatrix * position;
	answer.viewPosition = viewPosition.xyz;

	// Transform the position to clip space.
	answer.position = camera.projMatrix * viewPosition;

	// The fragment shader uses this to find the edges.
	answer.barycentric = getBarycentric ( corner );

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut, @builtin ( front_facing ) frontFacing: bool ) -> @location ( 0 ) vec4f
{
	// These have to be called before any branching.
	let dx = dpdx ( fragData.viewPosition );
	let dy = dpdy ( fragData.viewPosition );
	let change = fwidth ( fragData.barycentric );

	// The normal of the triangle. See FlatShading.wgsl.
	var normal = normalize ( cross ( dy, dx ) );
	if ( !frontFacing )
	{
		normal = -normal;
	}

	// Calculate the diffuse lighting factor.
	let dotProduct = dot ( normal, -camera.lightDir );
	let diffuse = select ( max ( dotProduct, 0.0 ), abs ( dotProduct ), ( material.twoSided != 0u ) );

	// Calculate the color, assuming that the canvas is configured
	// for pre-multiplied alpha.
	let color = vec4 ( material.color.rgb * diffuse * material.color.a, material.color.a );

	// Add the edges.
	return addEdges ( color, fragData.barycentric, change );
}
