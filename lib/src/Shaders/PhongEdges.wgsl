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
//	It is appended to Lighting.wgsl and Edges.wgsl. The lighting is the same
//	as PhongShading.wgsl.
//
///////////////////////////////////////////////////////////////////////////////

@group ( 3 ) @binding ( 2 ) var<storage, read> normals : array<f32>;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) normal : vec3f,
	@location ( 1 ) barycentric : vec3f,
	@location ( 2 ) color : vec4f,
	@location ( 3 ) @interpolate ( flat ) hasColors : u32,
	@location ( 4 ) texCoord : vec2f,
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

	// The vertex color, if there are any.
	answer.color = getColor ( index, mode );
	answer.hasColors = hasColors ( mode );
	answer.texCoord = getTexCoord ( index, mode );

	// Transform the position to clip space.
	answer.position = camera.projMatrix * object.viewMatrix * position;

	// Transform the normal to view space. We ignore the translation.
	answer.normal = normalize ( ( object.viewMatrix * vec4f ( normal, 0.0 ) ).xyz );

	// The fragment shader uses this to find the edges.
	answer.barycentric = getBarycentric ( corner );

	// Return the answer.
	return answer;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	// These have to be called before any branching.
	let change = fwidth ( fragData.barycentric );
	let texel = textureSample ( diffuseTexture, diffuseSampler, fragData.texCoord );

	// Light it. The diffuse texture multiplies the vertex color.
	let vertexColor = getVertexColor ( fragData.color, fragData.hasColors ) * texel;
	let color = light ( normalize ( fragData.normal ), material.surface, vertexColor );

	// Add the edges.
	return addEdges ( color, fragData.barycentric, change );
}
