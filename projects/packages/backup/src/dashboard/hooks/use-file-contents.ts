import { useQuery } from '@tanstack/react-query';
import { fetchFileContents } from '../data/api/file-contents';
import { keys } from '../data/query-client';

type Result = {
	content: string | null;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Base64-encode a manifest path the way WPCOM's file-content endpoint
 * expects. UTF-8 safe: plain `window.btoa` rejects code points > 0xFF
 * (any non-ASCII filename — uploads with accented or CJK characters,
 * for instance), so the browser path encodes to bytes first via
 * `TextEncoder`. The Node `Buffer` fallback handles UTF-8 natively.
 *
 * @param manifestPath - The raw manifest path.
 * @return Base64-encoded path.
 */
function encodeManifestPath( manifestPath: string ): string {
	if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
		const bytes = new TextEncoder().encode( manifestPath );
		let binary = '';
		for ( const byte of bytes ) {
			binary += String.fromCharCode( byte );
		}
		return window.btoa( binary );
	}
	return Buffer.from( manifestPath, 'utf-8' ).toString( 'base64' );
}

/**
 * Hook fetching a text file's contents for the preview pane.
 *
 * `filePeriod` and `manifestPath` both come from the file's `/ls`
 * row — NOT from the parent backup. VaultPress addresses file content
 * by the per-entry snapshot timestamp and the volume-prefixed manifest
 * path, so the parent backup's rewindId is irrelevant here.
 *
 * @param filePeriod   - The file's own snapshot timestamp (from /ls `period`).
 * @param manifestPath - The volume-prefixed manifest path (from /ls `manifest_path`, e.g. `f5:/wp-config.php`). Base64-encoded before sending.
 * @param enabled      - When false, the query is skipped (e.g. binary mime types).
 * @return Content + loading state.
 */
export function useFileContents(
	filePeriod: string | undefined,
	manifestPath: string | undefined,
	enabled: boolean
): Result {
	const safePeriod = filePeriod ?? '';
	const safePath = manifestPath ?? '';
	const query = useQuery( {
		queryKey: keys.fileContents( safePeriod, safePath ),
		queryFn: () => fetchFileContents( safePeriod, encodeManifestPath( safePath ) ),
		enabled: enabled && Boolean( safePeriod ) && Boolean( safePath ),
	} );

	return {
		content: query.data?.content ?? null,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
