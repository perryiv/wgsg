///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that renders with Phong shading and draws the triangle edges.
//	It is appended to Edges.wgsl. The lighting is the same as PhongShading.wgsl.
//
///////////////////////////////////////////////////////////////////////////////

@group ( 1 ) @binding ( 2 ) var<storage, read> normals : array<f32>;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) normal : vec3f,
	@location ( 1 ) barycentric : vec3f,
};

@vertex fn vs ( @builtin ( vertex_index ) corner: u32, @builtin ( instance_index ) mode: u32 ) -> VertexOut
{
	// The answer.
	var answer : VertexOut;

	// Get the point and normal vector.
	let index = getIndex ( corner, mode );
	let position = getPoint ( index );
	let i = index * 3u;
	let normal = vec3f ( normals[i], normals[i + 1u], normals[i + 2u] );

	// Transform the position to clip space.
	answer.position = uniforms.projMatrix * uniforms.viewMatrix * position;

	// Transform the normal to view space. We ignore the translation.
	answer.normal = normalize ( ( uniforms.viewMatrix * vec4f ( normal, 0.0 ) ).xyz );

	// The fragment shader uses this to find the edges.
	answer.barycentric = getBarycentric ( corner );

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	// This has to be called before any branching.
	let change = fwidth ( fragData.barycentric );

	// Make sure the normal vector is unit length.
	let normal = normalize ( fragData.normal );

	// Calculate the diffuse lighting factor.
	let dotProduct = dot ( normal, -uniforms.lightDir );
	let diffuse = select ( max ( dotProduct, 0.0 ), abs ( dotProduct ), ( uniforms.twoSided != 0u ) );

	// Calculate the color, assuming that the canvas is configured
	// for pre-multiplied alpha.
	let color = vec4 ( uniforms.color.rgb * diffuse * uniforms.color.a, uniforms.color.a );

	// Add the edges.
	return addEdges ( color, fragData.barycentric, change );
}
