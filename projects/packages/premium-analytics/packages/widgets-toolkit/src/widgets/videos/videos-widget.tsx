/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import { video } from '@jetpack-premium-analytics/icons';
import { useMemo } from 'react';
import { LeaderboardChart } from '../../components/chart-leaderboard';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildVideoPlaysData, formatLegendLabels } from '../../helpers';
import { useWidgetError } from '../../hooks';

type VideosWidgetProps = {
	/**
	 * Maximum number of videos to display.
	 */
	max?: number;
};

/**
 * Videos Widget Component
 *
 * Displays a leaderboard chart showing the site's most played videos,
 * sourced from the Jetpack Stats API.
 *
 * Features:
 * - Comparison support (current vs previous period)
 * - Configurable video limit
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props     - Component props
 * @param props.max - Maximum number of videos to display
 *
 * @example
 * <WidgetRoot attributes={ attributes }>
 *   <VideosWidget />
 * </WidgetRoot>
 */
export function VideosWidget( { max }: VideosWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useStatsVideoPlays( reportParams, { max } );

	// `primary.isPending` also covers the brief window where the query is
	// disabled while the blog ID resolves (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;

	const chartData = useMemo(
		() => buildVideoPlaysData( primary.data, comparison.data, max ),
		[ primary.data, comparison.data, max ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
				legendLabels={ legendLabels }
				dataFormat={ {
					type: 'number',
					options: { useMultipliers: false, decimals: 0 },
				} }
				emptyStateIcon={ video }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
