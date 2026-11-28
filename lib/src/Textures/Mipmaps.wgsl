///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code that makes one mipmap level from the one before it. One
//	triangle covers the whole level, and each pixel samples the level before
//	it at its center, where a linear sampler averages the four pixels it
//	covers. With an sRGB texture, the GPU turns the pixels into linear values
//	before averaging them, and back into sRGB after.
//
///////////////////////////////////////////////////////////////////////////////

@group ( 0 ) @binding ( 0 ) var source : texture_2d<f32>;
@group ( 0 ) @binding ( 1 ) var linearSampler : sampler;

struct VertexOut
{
	@builtin ( position ) position : vec4f,
	@location ( 0 ) texCoord : vec2f,
};

// The three corners of a triangle that covers the whole level.
@vertex fn vs ( @builtin ( vertex_index ) index: u32 ) -> VertexOut
{
	let corners = array ( vec2f ( -1.0, -1.0 ), vec2f ( 3.0, -1.0 ), vec2f ( -1.0, 3.0 ) );
	let corner = corners[index];
	var answer : VertexOut;
	answer.position = vec4f ( corner, 0.0, 1.0 );

	// The top of the texture is v = 0, and the top of the level is y = 1.
	answer.texCoord = vec2f ( ( ( corner.x + 1.0 ) * 0.5 ), ( ( 1.0 - corner.y ) * 0.5 ) );
	return answer;
}

@fragment fn fs ( fragData: VertexOut ) -> @location ( 0 ) vec4f
{
	return textureSample ( source, linearSampler, fragData.texCoord );
}
