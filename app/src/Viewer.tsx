
///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

import { useEffect, useRef, useState } from "react";
import {
	Device,
	Geometry,
	Group,
	Indexed,
	Viewer as InternalViewer,
	Node,
	Sphere,
	State,
	Transform,
	TriangleSolidColor,
} from "wgsg-lib";


///////////////////////////////////////////////////////////////////////////////
//
//	Make a scene used for testing below.
//
///////////////////////////////////////////////////////////////////////////////

// const root: Node = ( () =>
// {
// 	const root = new Group();

// 	{
// 		const tr = new Transform();
// 		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 10, 0, 0 ] );
// 		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
// 		root.addChild ( tr );
// 	}

// 	{
// 		const tr = new Transform();
// 		mat4.translate ( tr.matrix, IDENTITY_MATRIX, [ 0, 10, 0 ] );
// 		tr.addChild ( new Sphere ( { center: [ 0, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 2, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 4, 0, 0 ] } ) );
// 		tr.addChild ( new Sphere ( { center: [ 6, 0, 0 ] } ) );
// 		root.addChild ( tr );
// 	}

// 	return root;
// } ) ();

const root: Node = ( () =>
{
	const group = new Group();

	{
		const geom = new Geometry();

		geom.points = [
			0.0, 0.0, 0.0,
			0.5, 0.0, 0.0,
			0.0, 0.5, 0.0,
			0.5, 0.5, 0.0,
		];

		geom.primitives = new Indexed ( {
			mode: "triangle-list",
			indices: [
				0, 1, 2,
				1, 2, 3,
			]
		} );

		const shader = new TriangleSolidColor();
		shader.color = [ 0.2, 0.8, 0.2, 1.0 ];

		const state = new State();
		state.shader = shader;

		geom.state = state;

		const tr = new Transform ( [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0.5,
			0, 0, 0, 1
		] );

		tr.addChild ( geom );
		group.addChild ( tr );
	}

	{
		const geom = new Geometry();

		geom.points = [
			-0.5, -0.5,  0.0,
			 0.0, -0.5,  0.0,
			-0.5,  0.0,  0.0,
			 0.0,  0.0,  0.0,
		];

		geom.primitives = new Indexed ( {
			mode: "triangle-list",
			indices: [
				0, 1, 2,
				1, 2, 3,
			]
		} );

		const shader = new TriangleSolidColor();
		shader.color = [ 0.2, 0.2, 0.8, 1.0 ];

		const state = new State();
		state.shader = shader;

		geom.state = state;

		const tr = new Transform ( [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0.5,
			0, 0, 0, 1
		] );

		tr.addChild ( geom );
		group.addChild ( tr );
	}

	return group;
} ) ();


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer props.
//
///////////////////////////////////////////////////////////////////////////////

export interface IViewerProps
{
	style?: React.CSSProperties;
}


///////////////////////////////////////////////////////////////////////////////
//
//	Viewer component.
//
///////////////////////////////////////////////////////////////////////////////

export function Viewer ( { style }: IViewerProps )
{
	// Get state.
	const canvas = useRef < HTMLCanvasElement | null > ( null );
	const [ , setViewer ] = useState < InternalViewer | null > ( null );

	//
	// Called when the component mounts.
	//
	useEffect ( () =>
	{
		console.log ( "Viewer component mounted" );

		void ( async () =>
		{
			if ( !canvas.current )
			{
				throw new Error ( "Invalid canvas element" );
			}

			await Device.init();

			if ( !Device.instance )
			{
				throw new Error ( "Invalid device" );
			}

			void Device.instance.device.lost.then ( ( { reason }: GPUDeviceLostInfo ) =>
			{
				console.log ( "Context lost because: ", reason );
			} );

			const viewer = new InternalViewer ( { canvas: canvas.current } );
			viewer.scene = root;
			setViewer ( viewer );

			console.log ( "Internal viewer created and configured" );
		} ) ();

		return ( () =>
		{
			console.log ( "Viewer component unmounted" );
		} );
	},
	[] );

	// console.log ( "Rendering viewer component" );

	//
	// Render the components.
	//
	return (
		<canvas
			style = { style }
			ref = { canvas }
		>
		</canvas>
	);
}
