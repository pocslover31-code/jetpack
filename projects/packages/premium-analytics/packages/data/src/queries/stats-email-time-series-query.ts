/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsNormalizedDataPoint, StatsNormalizedSummary } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsEmailTimeSeriesDataPoint = StatsNormalizedDataPoint & {
	label: string;
	value: number;
	opens_count?: number;
	unique_opens_count?: number;
	clicks_count?: number;
};

export type StatsEmailTimeSeriesSummary = StatsNormalizedSummary & {
	opens_count?: number;
	unique_opens_count?: number;
	clicks_count?: number;
	opens_rate?: number;
	clicks_rate?: number;
	total_sends?: number;
	total_opens?: number;
	unique_opens?: number;
	total_clicks?: number;
};

export type StatsEmailTimeSeries = {
	summary: StatsEmailTimeSeriesSummary;
	data: StatsEmailTimeSeriesDataPoint[];
};

export const statsEmailOpensTimeSeriesQuery = (
	postId: number,
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'timeSeries' > =>
	statsProxyQuery( {
		name: 'email-opens-time-series',
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }`,
		params,
		sanitizer: 'timeSeries',
		enabled: postId > 0,
	} );

export const statsEmailClicksTimeSeriesQuery = (
	postId: number,
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'timeSeries' > =>
	statsProxyQuery( {
		name: 'email-clicks-time-series',
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }`,
		params,
		sanitizer: 'timeSeries',
		enabled: postId > 0,
	} );
