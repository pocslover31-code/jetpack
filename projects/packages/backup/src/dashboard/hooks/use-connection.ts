type Result = {
	isLoaded: boolean;
	isFullyConnected: boolean;
	isSecondaryAdminNotConnected: boolean;
	hasConnectionError: boolean;
};

type ConnectionStatus = {
	isRegistered?: boolean;
	isUserConnected?: boolean;
	hasConnectedOwner?: boolean;
};

type ConnectionInitialState = {
	connectionStatus?: ConnectionStatus;
};

declare global {
	interface Window {
		JP_CONNECTION_INITIAL_STATE?: ConnectionInitialState;
	}
}

/**
 * Read Jetpack's connection state from the `JP_CONNECTION_INITIAL_STATE`
 * global emitted by `Connection_Initial_State::render_script()` in PHP.
 *
 * We deliberately avoid `@automattic/jetpack-connection`'s store / hooks
 * because the package's barrel pulls in SCSS that wp-build's bundler
 * can't resolve. The global is set inline on `admin_print_scripts`
 * priority 1, well before any React bundle runs, so reading on every
 * render is a single property lookup — no need to memoize, and not
 * memoizing avoids any chance of capturing a pre-emit empty snapshot
 * if load order ever drifts.
 *
 * @return Connection state.
 */
export function useConnection(): Result {
	const state = typeof window !== 'undefined' ? window.JP_CONNECTION_INITIAL_STATE : undefined;
	const status: ConnectionStatus = state?.connectionStatus ?? {};

	const isLoaded = Object.keys( status ).length > 0;
	const isFullyConnected = Boolean( isLoaded && status.isRegistered && status.hasConnectedOwner );
	const isSecondaryAdminNotConnected = Boolean( isFullyConnected && ! status.isUserConnected );

	return {
		isLoaded,
		isFullyConnected,
		isSecondaryAdminNotConnected,
		hasConnectionError: false,
	};
}
