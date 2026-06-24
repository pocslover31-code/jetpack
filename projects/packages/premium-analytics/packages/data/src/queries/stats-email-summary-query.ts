/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsEmailSummaryItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsEmailSummary = StatsNormalizedReport< StatsEmailSummaryItem >;

export const statsEmailSummaryQuery = (
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'emailSummary' > =>
	statsProxyQuery( {
		name: 'email-summary',
		version: '1.1',
		endpoint: 'stats/emails/summary',
		params,
		sanitizer: 'emailSummary',
	} );
