import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	statsAppNoticesQuery,
	updateStatsAppNotice,
	type StatsAppNotices,
	type StatsAppNoticeMutationParams,
} from '../queries/stats-app-notices-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type {
	StatsAppNoticeId,
	StatsAppNotices,
	StatsAppNoticeMutationParams,
	StatsAppNoticeMutationResponse,
	StatsAppNoticeStatus,
} from '../queries/stats-app-notices-query';

export function useStatsAppNotices( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useStatsAppQuery< StatsAppNotices >(
		statsAppNoticesQuery< StatsAppNotices >( params ),
		options
	);
}

export function useStatsAppNoticeMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( data: StatsAppNoticeMutationParams ) => updateStatsAppNotice( data ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'notices' ] } );
		},
	} );
}
