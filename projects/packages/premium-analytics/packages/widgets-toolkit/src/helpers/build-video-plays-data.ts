/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { calculateDelta } from './calculate-delta';
import type { LeaderboardChartData } from '../components/chart-leaderboard';
import type { SanitizedStatsVideoPlaysResponse } from '@jetpack-premium-analytics/data';

/**
 * Builds leaderboard chart data for the Videos widget.
 *
 * Transforms Jetpack Stats video-plays data into the format required by
 * LeaderboardChart, with comparison values aligned by video post ID (videos
 * missing from the comparison period count as zero).
 *
 * @param primary    - Primary period video-plays data
 * @param comparison - Comparison period video-plays data
 * @param maxEntries - Maximum number of entries to include in the leaderboard
 * @return Processed data ready for LeaderboardChart component
 */
export function buildVideoPlaysData(
	primary: SanitizedStatsVideoPlaysResponse | undefined,
	comparison: SanitizedStatsVideoPlaysResponse | undefined,
	maxEntries = 7
): LeaderboardChartData {
	if ( ! primary?.data || primary.data.length === 0 ) {
		return [];
	}

	const comparisonPlays = new Map(
		( comparison?.data ?? [] ).map( video => [ video.postId, video.plays ] )
	);

	const data = primary.data.slice( 0, maxEntries );

	// Find the max value for share calculation
	const maxValue = Math.max(
		...data.map( video => Math.max( video.plays || 0, comparisonPlays.get( video.postId ) || 0 ) ),
		1 // Prevent division by zero
	);

	return data.map( ( video, idx ) => {
		const currentValue = video.plays || 0;
		const previousValue = comparisonPlays.get( video.postId ) ?? 0;
		const delta = calculateDelta( currentValue, previousValue );

		return {
			id: video.postId ? String( video.postId ) : String( idx ),
			label: video.title || __( 'Untitled video', 'jetpack-premium-analytics' ),
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta,
		};
	} );
}
