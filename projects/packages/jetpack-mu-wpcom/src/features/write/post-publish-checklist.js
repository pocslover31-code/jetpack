/**
 * Write — post-publish next-steps checklist (front-end wiring).
 *
 * Renders on the published post for the author right after a Write-editor publish
 * on a Coming Soon site (gated server-side; see post-publish-checklist.php). Wires
 * the overlay: launch routes to the launchpad, dismiss hides it and cleans the
 * marker from the URL so a refresh or Back doesn't bring it back. Manages focus as
 * an aria-modal dialog should — moves focus in on show, traps Tab, restores it on
 * dismiss.
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
	 * Find the overlay, reveal it, manage focus, and wire its controls.
	 */
	function init() {
		const overlay = document.querySelector( '.wpcom-write-ppc' );
		if ( ! overlay ) {
			return;
		}

		const card = overlay.querySelector( '.wpcom-write-ppc__card' );
		const previouslyFocused = overlay.ownerDocument.activeElement;

		overlay.removeAttribute( 'hidden' );
		recordEvent( 'wpcom_write_post_publish_checklist_shown' );

		// Move focus into the dialog so keyboard/screen-reader users are taken to
		// it. Focus the card (not an action button) so Enter doesn't arm a CTA.
		if ( card ) {
			card.setAttribute( 'tabindex', '-1' );
			card.focus();
		}

		/**
		 * The dialog's focusable controls, in DOM order.
		 *
		 * @return {HTMLElement[]} Enabled buttons within the overlay.
		 */
		function focusable() {
			return Array.prototype.slice.call( overlay.querySelectorAll( 'button:not([disabled])' ) );
		}

		/**
		 * Remove the overlay, tidy the URL, drop listeners, and restore focus.
		 */
		function dismiss() {
			document.removeEventListener( 'keydown', onKeydown );
			if ( overlay.parentNode ) {
				overlay.parentNode.removeChild( overlay );
			}
			cleanMarkerFromUrl();
			if (
				previouslyFocused &&
				typeof previouslyFocused.focus === 'function' &&
				document.contains( previouslyFocused )
			) {
				previouslyFocused.focus();
			}
		}

		/**
		 * Close on Escape and keep Tab focus trapped within the dialog.
		 *
		 * @param {KeyboardEvent} event - The keydown event.
		 */
		function onKeydown( event ) {
			if ( event.key === 'Escape' ) {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
				return;
			}
			if ( event.key !== 'Tab' ) {
				return;
			}
			const items = focusable();
			if ( ! items.length ) {
				return;
			}
			const first = items[ 0 ];
			const last = items[ items.length - 1 ];
			const active = overlay.ownerDocument.activeElement;
			if ( event.shiftKey ) {
				if ( active === first || ! overlay.contains( active ) ) {
					last.focus();
					event.preventDefault();
				}
			} else if ( active === last || ! overlay.contains( active ) ) {
				first.focus();
				event.preventDefault();
			}
		}

		const strings = config.strings || {};

		/**
		 * Same-origin REST call carrying the localized nonce.
		 *
		 * @param {string} url    - Absolute REST URL.
		 * @param {string} method - HTTP method.
		 * @return {Promise<Response>} The fetch promise.
		 */
		function restFetch( url, method ) {
			return fetch( url, {
				method,
				credentials: 'same-origin',
				headers: { 'X-WP-Nonce': config.restNonce || '' },
			} );
		}

		/**
		 * Resolve to whether launch is blocked pending email verification.
		 *
		 * Fails open: on any error (or no endpoint) it resolves false so the user
		 * proceeds to the launch flow, where the back end is the real gate.
		 *
		 * @return {Promise<boolean>} Whether launch is blocked.
		 */
		function isLaunchBlocked() {
			if ( ! config.verifyStateUrl ) {
				return Promise.resolve( false );
			}
			return restFetch( config.verifyStateUrl, 'GET' )
				.then( function ( res ) {
					return res.ok ? res.json() : null;
				} )
				.then( function ( data ) {
					return !! data && data.blocked === true;
				} )
				.catch( function () {
					return false;
				} );
		}

		/**
		 * Navigate to the canonical launch flow.
		 */
		function goToLaunch() {
			if ( config.launchUrl ) {
				window.location.href = config.launchUrl;
			}
		}

		/**
		 * Swap the card's body into the inline "confirm your email" step.
		 *
		 * Replaces the checklist and the launch CTA with a resend control and an
		 * "I've confirmed — launch" button that re-checks before proceeding.
		 */
		function showVerifyStep() {
			const launchBtn = card.querySelector( '.wpcom-write-ppc__launch' );
			if ( ! launchBtn ) {
				return;
			}
			const title = card.querySelector( '.wpcom-write-ppc__title' );
			const desc = card.querySelector( '.wpcom-write-ppc__desc' );
			const list = card.querySelector( '.wpcom-write-ppc__list' );
			if ( title ) {
				title.textContent = strings.verifyTitle || title.textContent;
			}
			if ( desc ) {
				desc.textContent = strings.verifyDesc || desc.textContent;
			}
			if ( list ) {
				list.remove();
			}

			const status = document.createElement( 'p' );
			status.className = 'wpcom-write-ppc__verify-status';
			status.setAttribute( 'role', 'status' );
			status.setAttribute( 'aria-live', 'polite' );

			const confirm = document.createElement( 'button' );
			confirm.type = 'button';
			confirm.className = 'wpcom-write-ppc__launch';
			confirm.textContent = strings.confirmCta || '';
			confirm.addEventListener( 'click', function () {
				const label = confirm.textContent;
				confirm.disabled = true;
				confirm.textContent = strings.verifyCheck || label;
				status.textContent = '';
				isLaunchBlocked().then( function ( blocked ) {
					if ( ! blocked ) {
						goToLaunch();
						return;
					}
					confirm.disabled = false;
					confirm.textContent = label;
					status.textContent = strings.stillUnver || '';
				} );
			} );

			const resend = document.createElement( 'button' );
			resend.type = 'button';
			resend.className = 'wpcom-write-ppc__resend';
			resend.textContent = strings.resendCta || '';
			resend.addEventListener( 'click', function () {
				resend.disabled = true;
				restFetch( config.verifyResendUrl, 'POST' )
					.then( function ( res ) {
						status.textContent = res.ok ? strings.resendDone || '' : strings.resendFail || '';
					} )
					.catch( function () {
						status.textContent = strings.resendFail || '';
					} )
					.finally( function () {
						resend.disabled = false;
					} );
			} );

			launchBtn.parentNode.insertBefore( status, launchBtn );
			launchBtn.parentNode.insertBefore( confirm, launchBtn );
			launchBtn.parentNode.insertBefore( resend, launchBtn );
			launchBtn.remove();
			confirm.focus();
		}

		const launch = overlay.querySelector( '[data-wpcom-write-ppc-launch]' );
		if ( launch ) {
			launch.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_launch_click' );
				const label = launch.textContent;
				launch.disabled = true;
				launch.textContent = strings.verifyCheck || label;
				isLaunchBlocked().then( function ( blocked ) {
					if ( ! blocked ) {
						goToLaunch();
						return;
					}
					launch.disabled = false;
					launch.textContent = label;
					recordEvent( 'wpcom_write_post_publish_checklist_verify_shown' );
					showVerifyStep();
				} );
			} );
		}

		overlay.querySelectorAll( '[data-wpcom-write-ppc-dismiss]' ).forEach( function ( el ) {
			el.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
			} );
		} );

		document.addEventListener( 'keydown', onKeydown );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
