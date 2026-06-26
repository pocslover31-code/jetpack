<?php
/**
 * Tests for the Write feature's email-verification REST routes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/email-verification.php';

use WpOrg\Requests\Requests;

/**
 * Exercises GET/POST /wpcom/v2/write/email-verification.
 */
class Write_Email_Verification_REST_Test extends \WorDBless\BaseTestCase {
	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'ppc_admin',
				'user_pass'  => 'ppc_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );
		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_option( 'site_creation_flow' );
		\Brain\Monkey\tearDown();
	}

	/**
	 * On a Write On site, a verified email leaves the launch unblocked.
	 */
	public function test_launch_not_blocked_when_email_verified() {
		wp_set_current_user( $this->admin_id );
		update_option( 'site_creation_flow', 'write-on' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( false );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/write/email-verification' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( $result->get_data()['blocked'] );
	}

	/**
	 * On a Write On site, an unverified email blocks the launch.
	 */
	public function test_launch_blocked_when_email_unverified_on_write_on_site() {
		wp_set_current_user( $this->admin_id );
		update_option( 'site_creation_flow', 'write-on' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( true );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/write/email-verification' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['blocked'] );
	}

	/**
	 * A site not created via the Write On flow is never gated, even if the
	 * email is unverified — this mirrors the back-end launch gate's scoping.
	 */
	public function test_launch_not_blocked_on_non_write_on_site() {
		wp_set_current_user( $this->admin_id );
		update_option( 'site_creation_flow', 'onboarding' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( true );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/write/email-verification' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( $result->get_data()['blocked'] );
	}

	/**
	 * The status route rejects logged-out requests.
	 */
	public function test_status_requires_authentication() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/write/email-verification' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * The resend route dispatches a fresh verification email and reports success.
	 */
	public function test_resend_sends_verification_email() {
		wp_set_current_user( $this->admin_id );
		\Mockery::mock( 'alias:Email_Verification' )
			->shouldReceive( 'resend_verification_email' )
			->once();

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/write/email-verification/resend' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['sent'] );
	}

	/**
	 * The resend route rejects logged-out requests.
	 */
	public function test_resend_requires_authentication() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/write/email-verification/resend' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}
}
