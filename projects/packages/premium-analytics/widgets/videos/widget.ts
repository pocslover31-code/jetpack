/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/videos',
	title: __( 'Videos', 'jetpack-premium-analytics' ),
	icon: video,
	attributes: [
		{
			id: 'max',
			label: __( 'Maximum videos', 'jetpack-premium-analytics' ),
			type: 'text',
		},
	],
	example: {
		attributes: {
			max: '7',
		},
	},
};
