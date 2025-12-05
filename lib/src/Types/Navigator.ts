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
import { IVector3, IVector4 } from "./Vector";


///////////////////////////////////////////////////////////////////////////////
//
//	Types related to the viewer's navigator.
//
///////////////////////////////////////////////////////////////////////////////

export interface INavigator
{
	mouseRotate: ( ( params: { event: IEvent, scale: number } ) => void );
	mouseTranslate: ( ( params: { event: IEvent, scale: number } ) => void );
	rotateAxisAngle ( axis: IVector3, radians: number ) : void;
	rotateQuaternion: ( ( quaternion: IVector4 ) => void );
	zoom: ( ( scale: number ) => void );

	viewMatrix: Readonly<IMatrix44>;
	invViewMatrix: ( Readonly<IMatrix44> | null );
}
