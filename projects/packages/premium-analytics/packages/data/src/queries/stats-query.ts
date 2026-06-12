/**
 * External dependencies
 */
import { skipToken, type UseQueryOptions } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import {
	fetchStats,
	fetchStatsBlogId,
	fetchStatsVideoPlays,
	type StatsQueryArgs,
} from '../api/stats-fetch';
import { sanitizeStatsVideoPlaysResponse } from '../processing/stats-video-plays';
import type { SanitizedStatsVideoPlaysResponse } from '../processing/stats-video-plays';

const getStatsQueryKey = (
	blogId: number | null | undefined,
	resource: string,
	query: StatsQueryArgs
) => [ 'stats', blogId ?? null, resource, query ] as const;

/**
 * Query for the site's WordPress.com blog ID, resolved from the Jetpack
 * connection data endpoint. The blog ID never changes for a connected site,
 * so the result is cached for the lifetime of the page.
 *
 * Stats queries depend on it (the stats-admin proxy embeds it in route
 * paths); fetch it early — e.g. via `useStatsBlogId` near the app root — to
 * avoid serializing it before the first stats request.
 *
 * @return Query options for `useQuery`.
 */
export function statsBlogIdQuery(): UseQueryOptions< number | null > {
	return {
		queryKey: [ 'stats', 'blog-id' ],
		queryFn: fetchStatsBlogId,

		staleTime: Infinity,
		gcTime: Infinity,
	};
}

/**
 * Common query factory for Jetpack Stats resources.
 *
 * Builds a react-query options object for any resource allowlisted by the
 * stats-admin proxy, mirroring the per-report query factories used for
 * WooCommerce analytics reports. Resource-specific queries (e.g.
 * `statsVideoPlaysQuery`) follow the same key scheme and add their own
 * response normalization.
 *
 * @param blogId          - The site's WordPress.com blog ID (see `statsBlogIdQuery`).
 * @param resource        - Stats resource to fetch (e.g. 'video-plays').
 * @param query           - Query args forwarded to the stats endpoint.
 * @param options         - Optional query configuration.
 * @param options.enabled - Whether the query should run.
 * @return Query options for `useQuery`.
 */
export function statsQuery< TData >(
	blogId: number | null | undefined,
	resource: string,
	query: StatsQueryArgs,
	options?: { enabled?: boolean }
): UseQueryOptions< TData > {
	return {
		queryKey: getStatsQueryKey( blogId, resource, query ),
		queryFn: blogId ? () => fetchStats< TData >( blogId, resource, query ) : skipToken,

		enabled: options?.enabled ?? true,

		placeholderData: previousData => previousData,
	};
}

type RequestStatsVideoPlaysParams = Parameters< typeof fetchStatsVideoPlays >[ 1 ];

/**
 * `date` is optional here: it may be unresolved while the report range loads,
 * in which case the query is skipped (see `skipToken` below).
 */
type StatsVideoPlaysQueryParams = Omit< RequestStatsVideoPlaysParams, 'date' > & {
	date?: string;
};

export function statsVideoPlaysQuery(
	blogId: number | null | undefined,
	params: StatsVideoPlaysQueryParams
): UseQueryOptions< SanitizedStatsVideoPlaysResponse > {
	const { date } = params;

	return {
		queryKey: getStatsQueryKey( blogId, 'video-plays', { ...params, date } ),
		queryFn:
			blogId && date
				? async () => {
						const response = await fetchStatsVideoPlays( blogId, { ...params, date } );
						return sanitizeStatsVideoPlaysResponse( response );
				  }
				: skipToken,

		placeholderData: previousData => previousData,
	};
}
