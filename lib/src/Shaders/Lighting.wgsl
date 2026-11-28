///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Shader code shared by the shaders that use the Lighting class. Each of
//	them starts with this code. It has the camera and the object, and the
//	lighting, which is OpenGL's with one light:
//
//	color = emission
//	      + ambientLight * ambient
//	      + diffuse * max ( N.L, 0 )
//	      + specular * max ( N.H, 0 ) ^ shininess, where N.L > 0
//	alpha = the diffuse alpha
//
//	The viewer is infinitely far away, as in OpenGL by default, so H is
//	halfway between the light and the view direction, (0, 0, 1).
//
//	Each shader declares its material in bind group 1. It starts with the
//	surface below, and the shaders that draw edges add their values after it.
//
///////////////////////////////////////////////////////////////////////////////

// The camera, in bind group 0. This has to match makeCameraUniforms().
struct Camera
{
	projMatrix: mat4x4f,
	lightDir: vec3f,
	ambientLight: vec4f,
};

// The surface's colors, at the start of the material in bind group 1. This
// has to match makeMaterialUniforms().
struct Surface
{
	ambient: vec4f,
	diffuse: vec4f,
	specular: vec4f,
	emission: vec4f,
	shininess: f32,
	twoSided: u32,
};

// The object, in bind group 2, from ObjectMatrices.
struct Object
{
	viewMatrix: mat4x4f,
};

@group ( 0 ) @binding ( 0 ) var<uniform> camera : Camera;
@group ( 2 ) @binding ( 0 ) var<uniform> object : Object;

// The diffuse texture and its sampler, after the material in bind group 1.
// Without a texture, it's a white one that gives exactly 1.
@group ( 1 ) @binding ( 1 ) var diffuseTexture : texture_2d<f32>;
@group ( 1 ) @binding ( 2 ) var diffuseSampler : sampler;

// Return the lit color, pre-multiplied by its alpha, as the canvas is
// configured. The normal is in view space and unit length, and points out
// of the side being drawn when that side faces the light. The vertex color,
// which is white without vertex colors, multiplies the ambient and diffuse
// colors. The shaders multiply it by the diffuse texture's color first.
fn light ( normalIn: vec3f, surface: Surface, vertexColor: vec4f ) -> vec4f
{
	// The colors.
	let ambient = surface.ambient * vertexColor;
	let diffuse = surface.diffuse * vertexColor;

	// With two-sided lighting, the back of the surface is lit like the front.
	let toLight = -camera.lightDir;
	var normal = normalIn;
	var nDotL = dot ( normal, toLight );
	if ( ( surface.twoSided != 0u ) && ( nDotL < 0.0 ) )
	{
		normal = -normal;
		nDotL = -nDotL;
	}
	nDotL = max ( nDotL, 0.0 );

	// The emission, ambient, and diffuse light.
	var rgb = surface.emission.rgb + ( camera.ambientLight.rgb * ambient.rgb ) + ( diffuse.rgb * nDotL );

	// The highlight, only on the lit side. The halfway vector is zero when
	// the light comes from straight behind, which is not lit anyway.
	let halfway = toLight + vec3f ( 0.0, 0.0, 1.0 );
	if ( ( nDotL > 0.0 ) && ( dot ( halfway, halfway ) > 1e-12 ) )
	{
		let nDotH = max ( dot ( normal, normalize ( halfway ) ), 0.0 );

		// A shininess of zero makes the whole lit side the specular color, as
		// in OpenGL. The power is not used then, since pow ( 0, 0 ) is undefined.
		let factor = select ( pow ( nDotH, surface.shininess ), 1.0, ( surface.shininess <= 0.0 ) );
		rgb += surface.specular.rgb * factor;
	}

	// Keep the color in range, and pre-multiply it.
	rgb = clamp ( rgb, vec3f ( 0.0 ), vec3f ( 1.0 ) );
	let alpha = diffuse.a;
	return vec4f ( rgb * alpha, alpha );
}
