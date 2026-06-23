import {
	SalesByDeviceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type SalesByDeviceRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByDeviceWidget fetches
 * the order-attribution report and renders the device revenue breakdown.
 *
 * @param root0            - Render props from the widget dashboard.
 * @param root0.attributes - Widget attributes, including report params.
 * @param root0.setError   - Dashboard error reporter.
 * @return The rendered widget.
 */
export default function SalesByDeviceRender( { attributes, setError }: SalesByDeviceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByDeviceWidget />
		</WidgetRoot>
	);
}
