# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) is a plugin-agnostic package intended to provide a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging.

It renders a fixed-position consent banner and a preferences modal on `wp_footer` (driven by the WordPress Interactivity API), auto-creates a CCPA "Your Privacy Choices" opt-out page, injects the required legal links into a footer `core/navigation` block on block themes (via Block Hooks), and provides a floating fallback control for those links on classic themes.

## Usage

`\Automattic\Jetpack\CookieConsent\Cookie_Consent::init();`

Build the frontend module before use:

`pnpm --filter @automattic/jetpack-cookie-consent build`

## Configuration

Filter `jetpack_cookie_consent_config` to override defaults (geo API URL, GDPR/CCPA region lists, cookie policy URL, and the Tracks `event_prefix`). The Tracks event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep continuity with the WooCommerce/Unified Analytics Tracks stream.

## Theming and customization

The banner, modal, category toggles, and footer-links fallback control are styled from namespaced CSS custom properties (design tokens) with self-contained defaults, so they render consistently regardless of the active theme. The tokens are deliberately **not** derived from theme presets (`--wp--preset--*`): a theme that defines those presets for its own layout (a small spacing scale, an inverted palette, etc.) cannot break or recolor the consent UI.

Override the tokens to customize the look — via the Customizer/Site Editor **Additional CSS**, a child theme stylesheet, or inline styles. Define them on `.jetpack-cookie-consent` (banner/modal) and/or `.jetpack-cookie-consent-footer-links` (the classic-theme fallback control):

```css
.jetpack-cookie-consent,
.jetpack-cookie-consent-footer-links {
	--jp-cookie-consent--color-background: #102a43;
	--jp-cookie-consent--color-text: #f0f4f8;
	--jp-cookie-consent--color-text-muted: #9fb3c8;
	--jp-cookie-consent--color-border: #334e68;
	--jp-cookie-consent--spacing: 20px;
	--jp-cookie-consent--font-size: 16px;
	--jp-cookie-consent--z-index: 50000; /* the modal sits at this value + 1 */
}
```

The token-defining rule uses `:where()` (zero specificity), so any of these mechanisms overrides it without needing `!important`. The banner is rendered on `wp_footer` and is not a block, so it cannot be customized through the block editor or Global Styles — Additional CSS / the tokens are the supported customization path.

## Theme support

| Required legal links                                                                                  | Banner + modal | Consistent styling |
| ----------------------------------------------------------------------------------------------------- | -------------- | ------------------ |
| **Block theme with a footer `core/navigation`** — injected into the footer navigation via Block Hooks | ✓              | ✓                  |
| **Block theme without a footer nav** — floating fallback control                                      | ✓              | ✓                  |
| **Classic theme** — floating fallback control                                                         | ✓              | ✓                  |

Rendering assumes the theme calls `wp_footer()`, which is effectively universal. A theme that omits `wp_footer()` will simply not render the banner/controls — a graceful no-op, not an error.

Manual test matrix: verify on a representative classic theme (Twenty Twenty-One) and a block theme (Twenty Twenty-Four), with and without a footer `core/navigation` block.

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
