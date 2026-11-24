///////////////////////////////////////////////////////////////////////////////
//
//	Copyright (c) 2026, Perry L Miller IV
//	All rights reserved.
//	MIT License: https://opensource.org/licenses/mit-license.html
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
//	Keeps the recent frame times and summarizes them.
//
///////////////////////////////////////////////////////////////////////////////

import type { IGpuTimeMethod } from "../Tools/GpuTimer";


///////////////////////////////////////////////////////////////////////////////
//
//	Types.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * The average, smallest, and largest of some times, in milliseconds.
 */
export interface ITimeSummary
{
	average: number;
	min: number;
	max: number;
	count: number;
}

/**
 * The summary of the recent frames. Each is null when there are no times.
 */
export interface IFrameTimes
{
	update: ( ITimeSummary | null );
	cull: ( ITimeSummary | null );
	draw: ( ITimeSummary | null );
	cpu: ( ITimeSummary | null );
	gpu: ( ITimeSummary | null );
	gpuMethod: ( IGpuTimeMethod | null );
	interval: ( ITimeSummary | null );
	rate: ( number | null );
}

/**
 * The CPU times of one frame, in milliseconds.
 */
export interface IFrameCpuTimes
{
	start: number;
	update: number;
	cull: number;
	draw: number;
}

interface ISample
{
	time: number;
	value: number;
}


///////////////////////////////////////////////////////////////////////////////
/**
 * The times measured recently, with the time each was measured.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

class Samples
{
	#samples: ISample[] = [];

	/**
	 * Add a sample.
	 * @param {number} time - When it was measured.
	 * @param {number} value - The measured time.
	 */
	public add ( time: number, value: number ) : void
	{
		this.#samples.push ( { time, value } );
	}

	/**
	 * Remove the samples measured before the given time.
	 * @param {number} oldest - The time of the oldest sample to keep.
	 */
	public removeBefore ( oldest: number ) : void
	{
		const samples = this.#samples;
		let i = 0;
		while ( ( i < samples.length ) && ( samples[i].time < oldest ) )
		{
			++i;
		}
		if ( i > 0 )
		{
			samples.splice ( 0, i );
		}
	}

	/**
	 * Remove all the samples.
	 */
	public clear () : void
	{
		this.#samples = [];
	}

	/**
	 * Summarize the samples.
	 * @returns {ITimeSummary | null} The summary, or null if there are none.
	 */
	public get summary () : ( ITimeSummary | null )
	{
		const samples = this.#samples;
		const count = samples.length;
		if ( 0 === count )
		{
			return null;
		}

		let sum = 0;
		let min = Infinity;
		let max = -Infinity;
		for ( const { value } of samples )
		{
			sum += value;
			min = Math.min ( min, value );
			max = Math.max ( max, value );
		}

		return { average: ( sum / count ), min, max, count };
	}
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Keeps the frame times measured in the recent past (one second by default)
 * and summarizes them. Frames that start long after the one before (more than
 * a quarter of a second by default) do not count toward the frame rate,
 * because the viewer was idle in between.
 * @class
 */
///////////////////////////////////////////////////////////////////////////////

export class FrameTimes
{
	#window: number;
	#maxInterval: number;
	#lastStart: ( number | null ) = null;
	#gpuMethod: ( IGpuTimeMethod | null ) = null;
	#update = new Samples();
	#cull = new Samples();
	#draw = new Samples();
	#cpu = new Samples();
	#gpu = new Samples();
	#interval = new Samples();

	/**
	 * Construct the class.
	 * @param {object} [input] - The input.
	 * @param {number} [input.window] - How long to keep the times, in milliseconds.
	 * @param {number} [input.maxInterval] - The longest time between the starts
	 * of two frames that still counts toward the frame rate, in milliseconds.
	 * @class
	 */
	constructor ( input?: { window?: number, maxInterval?: number } )
	{
		this.#window = ( input?.window ?? 1000 );
		this.#maxInterval = ( input?.maxInterval ?? 250 );
	}

	/**
	 * Add the CPU times of a frame.
	 * @param {IFrameCpuTimes} times - The times.
	 */
	public addFrame ( { start, update, cull, draw }: Readonly<IFrameCpuTimes> ) : void
	{
		// The time between the starts of this frame and the one before.
		const last = this.#lastStart;
		if ( ( null !== last ) && ( ( start - last ) <= this.#maxInterval ) )
		{
			this.#interval.add ( start, ( start - last ) );
		}
		this.#lastStart = start;

		this.#update.add ( start, update );
		this.#cull.add ( start, cull );
		this.#draw.add ( start, draw );
		this.#cpu.add ( start, ( update + cull + draw ) );

		this.removeOld ( start );
	}

	/**
	 * Add the GPU time of a frame. It arrives later than the CPU times.
	 * @param {number} start - When the frame started.
	 * @param {number} value - How long the GPU took, in milliseconds.
	 * @param {IGpuTimeMethod} method - How the time was measured.
	 */
	public addGpu ( start: number, value: number, method: IGpuTimeMethod ) : void
	{
		// Don't mix times measured in different ways.
		if ( method !== this.#gpuMethod )
		{
			this.#gpu.clear();
			this.#gpuMethod = method;
		}

		this.#gpu.add ( start, value );
		this.removeOld ( this.#lastStart ?? start );
	}

	/**
	 * Remove the times that are too old to keep.
	 * @param {number} now - The current time.
	 */
	protected removeOld ( now: number ) : void
	{
		const oldest = ( now - this.#window );
		this.#update.removeBefore ( oldest );
		this.#cull.removeBefore ( oldest );
		this.#draw.removeBefore ( oldest );
		this.#cpu.removeBefore ( oldest );
		this.#gpu.removeBefore ( oldest );
		this.#interval.removeBefore ( oldest );
	}

	/**
	 * Get the summary of the recent frames.
	 * @returns {IFrameTimes} The summary.
	 */
	public get summary () : IFrameTimes
	{
		const interval = this.#interval.summary;
		return {
			update: this.#update.summary,
			cull: this.#cull.summary,
			draw: this.#draw.summary,
			cpu: this.#cpu.summary,
			gpu: this.#gpu.summary,
			gpuMethod: this.#gpuMethod,
			interval,
			rate: ( ( interval && ( interval.average > 0 ) ) ? ( 1000 / interval.average ) : null ),
		};
	}
}
