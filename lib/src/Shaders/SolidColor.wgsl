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

struct Uniforms
{
	modelMatrix: mat4x4f,
	color: vec4f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> uniforms : Uniforms;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
};

@vertex fn vs ( @location ( 0 ) position: vec4f ) -> VertexOut
{
	var output : VertexOut;
	output.position = uniforms.modelMatrix * position;
	return output;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	return uniforms.color;
}
