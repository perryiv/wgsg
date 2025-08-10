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

struct VertexOut
{
	@builtin ( position ) position : vec4f,
};

@vertex fn vs ( @location ( 0 ) position: vec4f ) -> VertexOut
{
	var output : VertexOut;
	output.position = position;
	return output;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	return vec4f ( 0.8, 0.2, 0.2, 1.0 );
}
