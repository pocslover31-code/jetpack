<?php
/**
 * Dashboard test cases.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Unit tests for the Search dashboard menu.
 */
class Dashboard_Test extends TestCase {

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();

		global $submenu;
		$submenu = array();
	}

	/**
	 * The Search submenu should be registered directly under Jetpack on Simple sites.
	 */
	public function test_add_wp_admin_submenu_registers_directly_on_wpcom_simple() {
		global $submenu;

		wp_set_current_user( $this->admin_id );

		$submenu['jetpack'] = array(
			array( 'Old Search', 'manage_options', 'jetpack-search', 'Old Search' ),
		);

		$plan = $this->getMockBuilder( Plan::class )
			->onlyMethods( array( 'init_hooks' ) )
			->getMock();
		$plan->expects( $this->once() )->method( 'init_hooks' );

		$host = $this->getMockBuilder( Host::class )
			->onlyMethods( array( 'is_wpcom_simple' ) )
			->getMock();
		$host->expects( $this->once() )->method( 'is_wpcom_simple' )->willReturn( true );

		$connection_manager = $this->createMock( Connection_Manager::class );
		$module_control     = $this->getMockBuilder( Module_Control::class )
			->disableOriginalConstructor()
			->getMock();

		$dashboard = new Dashboard(
			$plan,
			$connection_manager,
			$module_control,
			$host
		);

		$dashboard->add_wp_admin_submenu();

		$search_items = array_values( wp_list_filter( $submenu['jetpack'], array( 2 => 'jetpack-search' ) ) );

		$this->assertCount( 1, $search_items );
		$this->assertSame( 'Search', $search_items[0][0] );
		$this->assertSame( 'Jetpack Search', $search_items[0][3] );
	}

	/**
	 * The Jetpack compatibility filter should tolerate hosts without Jetpack's offline mode helper.
	 */
	public function test_jetpack_compatibility_filter_allows_missing_active_helper() {
		wp_set_current_user( $this->admin_id );

		require_once Package::get_installed_path() . 'compatibility/jetpack.php';

		$this->assertTrue( apply_filters( 'jetpack_search_should_add_search_submenu', true ) );

		remove_filter(
			'jetpack_search_should_add_search_submenu',
			'Automattic\Jetpack\Search\Compatibility\Jetpack\should_show_jetpack_search_submenu'
		);
	}
}
