import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { statsAppQueryKeyPart } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

const noticesPath = '/jetpack-premium-analytics/v1/notices';

export type StatsAppNoticeId =
	| 'opt_in_new_stats'
	| 'traffic_page_highlights_module_settings'
	| 'traffic_page_settings'
	| 'do_you_love_jetpack_stats'
	| 'commercial_site_upgrade'
	| 'tier_upgrade'
	| 'gdpr_cookie_consent'
	| 'able_to_submit_user_feedback'
	| 'show_floating_user_feedback_panel'
	| 'client_paid_plan_purchase_success'
	| 'client_free_plan_purchase_success';

export type StatsAppNotices = Partial< Record< StatsAppNoticeId, boolean > >;

export type StatsAppNoticeStatus = 'dismissed' | 'postponed';

export const statsAppNoticesQuery = < TData = StatsAppNotices >(
	params: StatsQueryParams = {}
): UseQueryOptions< TData > => ( {
	// Notices are served by the local plugin REST route, not the Stats proxy.
	queryKey: [ 'stats-app', 'notices', statsAppQueryKeyPart( params ) ],
	queryFn: () =>
		apiFetch< TData >( {
			path: addQueryArgs( noticesPath, params ),
		} ),
	placeholderData: previousData => previousData,
} );

export type StatsAppNoticeMutationParams = {
	id: StatsAppNoticeId;
	status: StatsAppNoticeStatus;
	postponed_for?: number;
};

export type StatsAppNoticeMutationResponse = void | StatsAppNotices;

export const updateStatsAppNotice = ( data: StatsAppNoticeMutationParams ) =>
	apiFetch< StatsAppNoticeMutationResponse >( {
		path: noticesPath,
		method: 'POST',
		data,
	} );
