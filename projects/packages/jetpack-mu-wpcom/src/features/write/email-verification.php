<?php
/**
 * Write — email-verification REST routes.
 *
 * Backs the post-publish checklist's inline "verify your email to launch" flow.
 * The overlay (post-publish-checklist.js) checks verification status and triggers
 * a resend through these same-origin routes rather than calling the WordPress.com
 * REST API directly, so the browser stays on the published post.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Write email-verification REST routes.
 *
 * @return void
 */
function wpcom_write_register_email_verification_routes() {
	register_rest_route(
		'wpcom/v2',
		'/write/email-verification',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => 'wpcom_write_email_verification_status',
			'permission_callback' => 'is_user_logged_in',
		)
	);

	register_rest_route(
		'wpcom/v2',
		'/write/email-verification/resend',
		array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => 'wpcom_write_email_verification_resend',
			'permission_callback' => 'is_user_logged_in',
		)
	);
}
add_action( 'rest_api_init', 'wpcom_write_register_email_verification_routes' );

/**
 * Whether the current user's site launch must be blocked pending email verification.
 *
 * Mirrors wpcom's launch_blocked_for_unverified_email() so the overlay can't
 * disagree with the back-end launch gate: only Write On sites
 * (`site_creation_flow = 'write-on'`) are gated, and only when the launching
 * user's email is unverified. Email_Verification is a WordPress.com-side class;
 * when it's absent (non-wpcom context) nothing is blocked, so the overlay fails
 * open to the plain launch redirect.
 *
 * @return bool True when launch should be blocked.
 */
function wpcom_write_launch_blocked_for_unverified_email() {
	if ( ! class_exists( 'Email_Verification' ) ) {
		return false;
	}

	// Exact match: `site_creation_flow` is reused by many flows.
	if ( 'write-on' !== get_option( 'site_creation_flow' ) ) {
		return false;
	}

	return Email_Verification::is_email_unverified();
}

/**
 * GET callback: whether launch is blocked pending email verification.
 *
 * @return \WP_REST_Response Response carrying a `blocked` boolean.
 */
function wpcom_write_email_verification_status() {
	return rest_ensure_response( array( 'blocked' => wpcom_write_launch_blocked_for_unverified_email() ) );
}

/**
 * POST callback: resend the current user's verification email.
 *
 * Wraps the same WordPress.com primitive the `/me/send-verification-email` REST
 * endpoint uses, which no-ops for an already-verified address.
 *
 * @return \WP_REST_Response Response carrying a `sent` boolean.
 */
function wpcom_write_email_verification_resend() {
	if ( class_exists( 'Email_Verification' ) ) {
		Email_Verification::resend_verification_email();
	}

	return rest_ensure_response( array( 'sent' => true ) );
}
