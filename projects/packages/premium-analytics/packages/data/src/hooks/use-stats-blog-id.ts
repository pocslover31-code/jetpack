/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsBlogIdQuery } from '../queries/stats-query';

/**
 * Resolve the site's WordPress.com blog ID (cached for the page lifetime).
 *
 * Stats hooks resolve it internally, but calling this early — near the app
 * or widget root — warms the cache so the first stats request doesn't have
 * to wait on it.
 *
 * @return Query result whose `data` is the blog ID, or null when unavailable.
 */
export function useStatsBlogId() {
	return useQuery( statsBlogIdQuery() );
}
