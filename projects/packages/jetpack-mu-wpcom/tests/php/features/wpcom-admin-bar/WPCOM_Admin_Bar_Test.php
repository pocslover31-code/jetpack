<?php
/**
 * Test class for admin bar changes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-bar/wpcom-admin-bar.php';
require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
require_once __DIR__ . '/get-user-attribute-stub.php';

/**
 * Class WPCOM_Admin_Bar_Test
 */
class WPCOM_Admin_Bar_Test extends \WorDBless\BaseTestCase {
	private static function make_test_admin_bar() {
			$admin_bar = new \WP_Admin_Bar();

			$admin_bar->add_node(
				array(
					'id'    => 'wp-logo',
					'title' => 'WordPress Logo',
					'href'  => 'https://wordpress.org/',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'about',
					'parent' => 'wp-logo',
					'title'  => 'About WordPress',
					'href'   => 'https://wordpress.org/about/',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'contribute',
					'parent' => 'wp-logo',
					'title'  => 'Get Involved',
					'href'   => 'https://wordpress.org/contribute/',
				)
			);
			$admin_bar->add_group(
				array(
					'id'    => 'top-secondary',
					'title' => '',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'my-account',
					'title'  => 'Account',
					'href'   => 'https://example.com/wp-admin/profile.php',
					'parent' => 'top-secondary',
				)
			);

			do_action( 'admin_bar_menu', $admin_bar );

			return $admin_bar;
	}

	private static function get_all_admin_bar_nodes( WP_Admin_Bar $bar, $parent = null ) {
		$result = array();

		foreach ( $bar->get_nodes() as $id => $node ) {
			if ( ( $parent === null && $node->parent === false ) || ( $node->parent === $parent ) ) {
				$result[ $id ] = $node;

				// recurse into children
				$children = self::get_all_admin_bar_nodes( $bar, $id );
				$result   = array_merge( $result, $children );
			}
		}

		return $result;
	}

	public function test_origin_admin_bar_param_in_menu_links() {
		$admin_bar = self::make_test_admin_bar();

		$all_nodes = $admin_bar->get_nodes();

		$links_with_origin_param = array(
			'https://wordpress.com/sites',
			'https://wordpress.com/domains/manage',
			'https://wordpress.com/me',
			'https://wordpress.com/me/account',
		);

		foreach ( $all_nodes as $node ) {
			$should_have_param = false;
			foreach ( $links_with_origin_param as $link ) {
				if ( str_starts_with( $node->href, $link ) ) {
					$should_have_param = true;
					break;
				}
			}

			if ( $should_have_param ) {
				$this->assertStringContainsString( 'origin_admin_bar=wpcom', $node->href );
			} else {
				$this->assertStringNotContainsString( 'origin_admin_bar=wpcom', $node->href );
			}
		}
	}

	/**
	 * The Themes sub-item opens classic Calypso in a new tab and carries the
	 * external-link class that renders the trailing arrow, matching the Calypso masterbar.
	 */
	public function test_themes_node_is_an_external_link() {
		$admin_bar = self::make_test_admin_bar();
		$themes    = $admin_bar->get_node( 'wpcom-themes' );

		$this->assertNotNull( $themes, 'The wpcom-themes node should exist.' );
		$this->assertSame( '_blank', $themes->meta['target'] ?? null );
		$this->assertStringContainsString( 'wpcom-admin-bar-external-link', $themes->meta['class'] ?? '' );
	}

	/**
	 * With no stored preference (a non-Simple, unconnected site) enrollment
	 * resolves to false, the result is cached so the admin bar avoids a remote
	 * lookup on every render, and a cached value short-circuits the resolution.
	 */
	public function test_hosting_dashboard_enrollment_resolves_and_caches() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'dashboard_user',
				'user_pass'  => 'pass',
				'user_email' => 'dashboard@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		$cache_key = 'wpcom-hosting-dashboard-enrolled-' . $user_id;

		$this->assertFalse( wpcom_admin_bar_is_hosting_dashboard_enrolled() );
		$this->assertSame( 0, (int) get_transient( $cache_key ) );

		set_transient( $cache_key, 1, HOUR_IN_SECONDS );
		$this->assertTrue( wpcom_admin_bar_is_hosting_dashboard_enrolled() );
	}

	/**
	 * On a Simple site the opt-in preference is read locally from the user's
	 * calypso_preferences attribute.
	 */
	public function test_hosting_dashboard_enrollment_reads_simple_preference() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'simple_user',
				'user_pass'  => 'pass',
				'user_email' => 'simple@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		Constants::set_constant( 'IS_WPCOM', true );
		$GLOBALS['_test_user_attributes']['calypso_preferences'] = array(
			'hosting-dashboard-opt-in' => array( 'value' => 'opt-in' ),
		);

		$this->assertTrue( wpcom_admin_bar_is_hosting_dashboard_enrolled() );

		unset( $GLOBALS['_test_user_attributes'] );
		Constants::clear_single_constant( 'IS_WPCOM' );
	}

	/**
	 * When the user's default experience is the hosting dashboard, the Emails
	 * node is surfaced and Plugins points at the my.wordpress.com dashboard.
	 */
	public function test_management_links_when_dashboard_enrolled() {
		add_filter( 'wpcom_admin_bar_hosting_dashboard_enrolled', '__return_true' );
		$admin_bar = self::make_test_admin_bar();
		remove_filter( 'wpcom_admin_bar_hosting_dashboard_enrolled', '__return_true' );

		$emails  = $admin_bar->get_node( 'wpcom-emails' );
		$plugins = $admin_bar->get_node( 'wpcom-plugins' );

		$this->assertNotNull( $emails, 'The wpcom-emails node should exist when enrolled.' );
		$this->assertSame( 'https://my.wordpress.com/emails', $emails->href );
		$this->assertNotNull( $plugins );
		$this->assertSame( 'https://my.wordpress.com/plugins/manage', $plugins->href );
	}

	/**
	 * When the user is not enrolled in the hosting dashboard, the Emails node is
	 * omitted and Plugins points at classic Calypso.
	 */
	public function test_management_links_when_not_dashboard_enrolled() {
		add_filter( 'wpcom_admin_bar_hosting_dashboard_enrolled', '__return_false' );
		$admin_bar = self::make_test_admin_bar();
		remove_filter( 'wpcom_admin_bar_hosting_dashboard_enrolled', '__return_false' );

		$plugins = $admin_bar->get_node( 'wpcom-plugins' );

		$this->assertNull( $admin_bar->get_node( 'wpcom-emails' ), 'The wpcom-emails node should be absent when not enrolled.' );
		$this->assertNotNull( $plugins );
		$this->assertSame( 'https://wordpress.com/plugins/manage/sites', $plugins->href );
	}

	/**
	 * The plan badge must always render a clickable anchor, including on Atomic
	 * sites where \WPCOM_Masterbar is absent and the slug falls back to the site
	 * suffix. It must never render the old non-clickable <div>.
	 */
	public function test_plan_badge_is_a_clickable_link() {
		// Drive a known plan name through Current_Plan::get() and reset its
		// per-request static cache so the option below is actually read.
		update_option( Current_Plan::PLAN_OPTION, array( 'product_name_short' => 'Business' ) );
		self::reset_active_plan_cache();

		$admin_bar = self::make_test_admin_bar();
		$badge     = $admin_bar->get_node( 'site-plan-badge' );

		$this->assertNotNull( $badge, 'The site-plan-badge node should exist when a plan name is set.' );
		$this->assertStringContainsString( '<a class="wp-admin-bar__site-info"', $badge->title );
		$this->assertStringContainsString( 'href="https://wordpress.com/plans/', $badge->title );
		$this->assertStringContainsString( 'Business', $badge->title );
		$this->assertStringNotContainsString( '<div class="wp-admin-bar__site-info"', $badge->title );

		delete_option( Current_Plan::PLAN_OPTION );
		self::reset_active_plan_cache();
	}

	/**
	 * Reset Current_Plan's per-request static cache so option writes in tests
	 * are actually read back by Current_Plan::get().
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}
}
