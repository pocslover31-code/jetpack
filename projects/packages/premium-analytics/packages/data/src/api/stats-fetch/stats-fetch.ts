/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { statsAppPath } from '../constants';

/**
 * Query args accepted by the Jetpack Stats API.
 *
 * The exact set varies per resource; common ones are `period`, `date`,
 * `start_date`, `summarize`, and `max`. Undefined values are dropped.
 */
export type StatsQueryArgs = Record< string, string | number | boolean | undefined >;

type ConnectionDataResponse = {
	currentUser?: {
		blogId?: number | string;
	};
};

/**
 * Fetch the site's WordPress.com blog ID from the Jetpack connection data
 * endpoint. The stats-admin proxy embeds the blog ID in its route paths, so
 * stats queries resolve it (once, cached) before fetching.
 *
 * @return The blog ID, or null when unavailable (e.g. site not connected).
 */
export async function fetchStatsBlogId(): Promise< number | null > {
	const response = ( await apiFetch( {
		path: '/jetpack/v4/connection/data',
	} ) ) as ConnectionDataResponse;

	const blogId = Number( response?.currentUser?.blogId );

	return Number.isFinite( blogId ) && blogId > 0 ? blogId : null;
}

/**
 * Common fetcher for Jetpack Stats resources.
 *
 * Requests go through the stats-admin package's proxy
 * (`/jetpack/v4/stats-app/sites/{blog_id}/stats/{resource}`), which calls the
 * Jetpack Stats package server-side — handling the WordPress.com
 * authentication and response caching. The proxy only serves an allowlisted
 * set of resources (see `Stats_Admin\REST_Controller::get_stats_resource`).
 *
 * @param blogId   - The site's WordPress.com blog ID (see `fetchStatsBlogId`).
 * @param resource - Stats resource to fetch (e.g. 'video-plays').
 * @param query    - Query args forwarded to the stats endpoint.
 * @return The raw stats response for the resource.
 */
export async function fetchStats< TResponse >(
	blogId: number,
	resource: string,
	query: StatsQueryArgs = {}
): Promise< TResponse > {
	const path = addQueryArgs( `${ statsAppPath }/sites/${ blogId }/stats/${ resource }`, query );

	return apiFetch( { path } ) as Promise< TResponse >;
}

export type StatsVideoPlay = {
	post_id: number;
	title: string;
	url: string;
	plays: number;
};

type StatsVideoPlaysDay = {
	plays: StatsVideoPlay[];
	other_plays?: number;
	total_plays?: number;
};

/**
 * With `summarize: 1` the aggregated bucket is returned under
 * `days.summary` (not a top-level `summary` field, unlike some other
 * stats resources).
 */
export type StatsVideoPlaysResponse = {
	date: string;
	days?: Record< string, StatsVideoPlaysDay >;
};

export type RequestStatsVideoPlaysParams = {
	period: 'day' | 'week' | 'month' | 'year';
	date: string;
	start_date?: string;
	summarize?: 0 | 1;
	max?: number;
};

/**
 * Fetch the site's most played videos for a period.
 *
 * Mirrors the WordPress.com `/sites/{site}/stats/video-plays` endpoint. With
 * `summarize: 1`, plays are aggregated across the `start_date`–`date` range
 * and returned under `days.summary` instead of per-day buckets.
 *
 * @param blogId - The site's WordPress.com blog ID (see `fetchStatsBlogId`).
 * @param params - Stats query parameters.
 * @return The raw video-plays response.
 */
export async function fetchStatsVideoPlays(
	blogId: number,
	params: RequestStatsVideoPlaysParams
): Promise< StatsVideoPlaysResponse > {
	return fetchStats< StatsVideoPlaysResponse >( blogId, 'video-plays', params );
}
