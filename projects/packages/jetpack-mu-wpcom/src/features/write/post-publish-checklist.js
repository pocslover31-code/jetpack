/**
 * Write — post-publish next-steps checklist (front-end wiring).
 *
 * Renders on the published post for the author right after a Write-editor publish
 * on a Coming Soon site (gated server-side; see post-publish-checklist.php). Wires
 * the overlay: launch routes to the launchpad, dismiss hides it and cleans the
 * marker from the URL so a refresh or Back doesn't bring it back.
 */
( function () {
	const config = window.wpcomWritePostPublishChecklist || {};

	/**
	 * Record a Tracks event using the same global queue the Write editor uses.
	 *
	 * @param {string} event - Event name.
	 */
	function recordEvent( event ) {
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', event ] );
	}

	/**
	 * Remove the post-publish marker from the current URL without reloading, so
	 * the overlay doesn't reappear on refresh or back-navigation.
	 */
	function cleanMarkerFromUrl() {
		if ( ! config.marker || ! window.history || ! window.history.replaceState ) {
			return;
		}
		try {
			const url = new URL( window.location.href );
			if ( ! url.searchParams.has( config.marker ) ) {
				return;
			}
			url.searchParams.delete( config.marker );
			window.history.replaceState( null, '', url.href );
		} catch {
			// Leave the URL as-is if it can't be parsed.
		}
	}

	/**
	 * Find the overlay, reveal it, and wire its launch/dismiss controls.
	 */
	function init() {
		const overlay = document.querySelector( '.wpcom-write-ppc' );
		if ( ! overlay ) {
			return;
		}

		overlay.removeAttribute( 'hidden' );
		recordEvent( 'wpcom_write_post_publish_checklist_shown' );

		/**
		 * Remove the overlay and tidy the URL.
		 */
		function dismiss() {
			if ( overlay.parentNode ) {
				overlay.parentNode.removeChild( overlay );
			}
			cleanMarkerFromUrl();
		}

		const launch = overlay.querySelector( '[data-wpcom-write-ppc-launch]' );
		if ( launch ) {
			launch.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_launch_click' );
				if ( config.launchpadUrl ) {
					window.location.href = config.launchpadUrl;
				}
			} );
		}

		overlay.querySelectorAll( '[data-wpcom-write-ppc-dismiss]' ).forEach( function ( el ) {
			el.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
			} );
		} );

		document.addEventListener( 'keydown', function ( event ) {
			if ( event.key === 'Escape' && document.body.contains( overlay ) ) {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
