/**
 * Internal dependencies
 */
import type { StatsVideoPlay, StatsVideoPlaysResponse } from '../../api/stats-fetch';

export type SanitizedStatsVideoPlay = {
	postId: number;
	title: string;
	url: string;
	plays: number;
};

export type SanitizedStatsVideoPlaysResponse = {
	summary: {
		videos: number;
		plays: number;
	};
	data: SanitizedStatsVideoPlay[];
};

function toCount( value: unknown ): number {
	const count = typeof value === 'string' ? Number.parseInt( value, 10 ) : Number( value );

	return Number.isFinite( count ) ? count : 0;
}

function sanitizeStatsVideoPlay( video: StatsVideoPlay ): SanitizedStatsVideoPlay {
	return {
		postId: toCount( video.post_id ),
		title: video.title ?? '',
		url: video.url ?? '',
		plays: toCount( video.plays ),
	};
}

/**
 * Normalize a raw video-plays stats response into the standard
 * `{ summary, data }` report shape used across the data package.
 *
 * With `summarize: 1` the API aggregates the range into a `summary` bucket
 * under `days`; without it, videos are bucketed per day. We prefer the
 * summary bucket and fall back to the first available day bucket.
 *
 * @param response - Raw response from the stats video-plays endpoint.
 * @return The sanitized video-plays report data.
 */
export const sanitizeStatsVideoPlaysResponse = (
	response: StatsVideoPlaysResponse
): SanitizedStatsVideoPlaysResponse => {
	const days = response?.days ?? {};
	const bucket = days.summary ?? Object.values( days )[ 0 ];
	const videos = ( bucket?.plays ?? [] ).map( sanitizeStatsVideoPlay );

	return {
		summary: {
			videos: videos.length,
			plays: videos.reduce( ( total, video ) => total + video.plays, 0 ),
		},
		data: videos,
	};
};
