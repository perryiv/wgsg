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
//	https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html
//
///////////////////////////////////////////////////////////////////////////////

@vertex fn vs(
	@builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
	let pos = array(
		vec2f( 0.0,  0.5),  // top center
		vec2f(-0.5, -0.5),  // bottom left
		vec2f( 0.5, -0.5)   // bottom right
	);

	return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs() -> @location(0) vec4f {
	return vec4f(1.0, 0.0, 0.0, 1.0);
}
