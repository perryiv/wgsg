///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2025, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Types related to the viewer's navigator.
//
///////////////////////////////////////////////////////////////////////////////

import { IEvent } from "./Event";
import { IMatrix44 } from "./Matrix";
import { IVector2, IVector3, IVector4 } from "./Vector";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to the viewer's navigator.
//
///////////////////////////////////////////////////////////////////////////////

export interface IRotationStep
{
	axis: IVector3;
	angle: number;
}

export interface ITranslateScreenStep
{
	current: IVector2;
	previous: IVector2;
}

export interface INavigator
{
	mouseRotate: ( ( params: { event: IEvent, scale: number } ) => ( IRotationStep | null ) );
	mouseTranslate: ( ( params: { event: IEvent, scale: number } ) => ( ITranslateScreenStep | null ) );
	rotateAxisAngle ( axis: IVector3, radians: number ) : void;
	rotateQuaternion: ( ( quaternion: IVector4 ) => void );
	translateScreenXY ( input: { current: IVector2, previous: IVector2, scale: number } ) : void;
	zoom: ( ( scale: number ) => void );

	viewMatrix: Readonly<IMatrix44>;
	invViewMatrix: ( Readonly<IMatrix44> | null );
}
