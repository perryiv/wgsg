///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Records the times of every frame in a measurement and summarizes them.
//
///////////////////////////////////////////////////////////////////////////////

import type { IFrameCpuTimes } from "./FrameTimes";
import type { IGpuTimeMethod } from "../Tools/GpuTimer";


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * The statistics of some times, in milliseconds.
 */
export interface ITimeStatistics
{
	average: number;
	median: number;
	min: number;
	max: number;
	count: number;
}

/**
 * What to measure.
 */
export interface IMeasureOptions
{
	// How many frames to measure.
	frames?: number;

	// How many frames to render first without measuring them. The first
	// frames make pipelines and buffers.
	warmUp?: number;

	// The longest to measure, in milliseconds. It stops early when the frames
	// are slow.
	maxTime?: number;
}

/**
 * The result of measuring some frames. Each statistic is null when there
 * are no times.
 */
export interface IFrameMeasurement
{
	// The frames measured, and the ones rendered first without measuring.
	frames: number;
	warmUp: number;

	// From the start of the first frame measured to the start of the last.
	duration: number;

	// The time between the starts of the frames, and the frames per second
	// from its average.
	interval: ( ITimeStatistics | null );
	rate: ( number | null );

	// The CPU times.
	update: ( ITimeStatistics | null );
	cull: ( ITimeStatistics | null );
	draw: ( ITimeStatistics | null );
	cpu: ( ITimeStatistics | null );

	// The GPU times, and how they were measured.
	gpu: ( ITimeStatistics | null );
	gpuMethod: ( IGpuTimeMethod | null );
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Get the statistics of some times.
 * @param {number[]} values - The times.
 * @returns {ITimeStatistics | null} The statistics, or null if there are none.
 */
///////////////////////////////////////////////////////////////////////////////

export const getTimeStatistics = ( values: readonly number[] ) : ( ITimeStatistics | null ) =>
{
	const count = values.length;
	if ( 0 === count )
	{
		return null;
	}

	const sorted = [ ...values ].sort ( ( a, b ) => ( a - b ) );
	const middle = Math.floor ( count / 2 );
	const median = ( ( 0 === ( count % 2 ) ) ?
		( ( sorted[middle - 1] + sorted[middle] ) / 2 ) :
		sorted[middle] );

	let sum = 0;
	for ( const value of sorted )
	{
		sum += value;
	}

	return {
		average: ( sum / count ),
		median,
		min: sorted[0],
		max: sorted[count - 1],
		count,
	};
};


///////////////////////////////////////////////////////////////////////////////
/**
 * Records the times of every frame in a measurement and summarizes them.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class FrameRecorder
{
	#firstStart: ( number | null ) = null;
	#lastStart: ( number | null ) = null;
	#interval: number[] = [];
	#update: number[] = [];
	#cull: number[] = [];
	#draw: number[] = [];
	#cpu: number[] = [];
	#gpu: number[] = [];
	#gpuMethod: ( IGpuTimeMethod | null ) = null;

	/**
	 * Add the CPU times of a frame.
	 * @param {IFrameCpuTimes} times - The times.
	 */
	public addFrame ( { start, update, cull, draw }: Readonly<IFrameCpuTimes> ) : void
	{
		if ( null !== this.#lastStart )
		{
			this.#interval.push ( start - this.#lastStart );
		}
		this.#firstStart ??= start;
		this.#lastStart = start;

		this.#update.push ( update );
		this.#cull.push ( cull );
		this.#draw.push ( draw );
		this.#cpu.push ( update + cull + draw );
	}

	/**
	 * Add the GPU time of a frame. It arrives later than the CPU times.
	 * @param {number} value - How long the GPU took, in milliseconds.
	 * @param {IGpuTimeMethod} method - How the time was measured.
	 */
	public addGpu ( value: number, method: IGpuTimeMethod ) : void
	{
		// Don't mix times measured in different ways.
		if ( method !== this.#gpuMethod )
		{
			this.#gpu = [];
			this.#gpuMethod = method;
		}
		this.#gpu.push ( value );
	}

	/**
	 * Get how many frames were added.
	 * @returns {number} The number of frames.
	 */
	public get frames () : number
	{
		return this.#cpu.length;
	}

	/**
	 * Get how many GPU times were added.
	 * @returns {number} The number of GPU times.
	 */
	public get gpuTimes () : number
	{
		return this.#gpu.length;
	}

	/**
	 * Get the time from the start of the first frame to the start of the last.
	 * @returns {number} The time, in milliseconds.
	 */
	public get duration () : number
	{
		return ( ( this.#lastStart ?? 0 ) - ( this.#firstStart ?? 0 ) );
	}

	/**
	 * Get the measurement.
	 * @param {number} warmUp - How many frames were rendered first without
	 * being measured.
	 * @returns {IFrameMeasurement} The measurement.
	 */
	public getMeasurement ( warmUp: number ) : IFrameMeasurement
	{
		const interval = getTimeStatistics ( this.#interval );
		return {
			frames: this.frames,
			warmUp,
			duration: this.duration,
			interval,
			rate: ( ( interval && ( interval.average > 0 ) ) ? ( 1000 / interval.average ) : null ),
			update: getTimeStatistics ( this.#update ),
			cull: getTimeStatistics ( this.#cull ),
			draw: getTimeStatistics ( this.#draw ),
			cpu: getTimeStatistics ( this.#cpu ),
			gpu: getTimeStatistics ( this.#gpu ),
			gpuMethod: this.#gpuMethod,
		};
	}
}
