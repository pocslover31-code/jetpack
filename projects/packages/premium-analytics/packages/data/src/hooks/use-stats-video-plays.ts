/**
 * Internal dependencies
 */
import { statsVideoPlaysQuery } from '../queries/stats-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';
import { useStatsBlogId } from './use-stats-blog-id';

type UseStatsVideoPlaysOptions = {
	enabled?: boolean;
	/** Maximum number of videos to return. */
	max?: number;
};

/**
 * Convert a report ISO datetime (e.g. '2025-07-01T00:00:00') to the
 * 'YYYY-MM-DD' format the stats API expects.
 */
const toStatsDate = ( value?: string ) => ( value ? value.slice( 0, 10 ) : undefined );

/**
 * Fetch the site's most played videos for the selected period through the
 * Jetpack Stats API, with the same comparison semantics as the report hooks.
 *
 * @param params  - Report parameters (from/to drive the stats date range).
 * @param options - Optional `enabled` flag and `max` video count.
 * @return Report query results with primary and comparison data.
 */
export function useStatsVideoPlays( params: ReportParams, options?: UseStatsVideoPlaysOptions ) {
	const { data: blogId } = useStatsBlogId();

	return useReport(
		p =>
			statsVideoPlaysQuery( blogId, {
				period: 'day',
				date: toStatsDate( p.to ),
				start_date: toStatsDate( p.from ),
				summarize: 1,
				max: options?.max,
			} ),
		params,
		{
			enabled: options?.enabled,
			disabledComparisonKey: [ 'stats', 'video-plays', '__comparison__', 'disabled' ],
		}
	);
}
