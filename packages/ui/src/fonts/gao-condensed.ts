/**
 * @gao/ui — GaoCondensed Font
 *
 * Space-efficient condensed sans-serif at 75% normal width.
 * Tight metrics ideal for dense data interfaces.
 *
 * Weights: 400 (Regular), 600 (SemiBold)
 * Use case: Data tables, dashboards, numbers
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoCondensed';
const FALLBACK = "'Arial Narrow', 'Roboto Condensed', sans-serif";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 94%;
  descent-override: 23%;
  line-gap-override: 0%;
  size-adjust: 85%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('${FAMILY} SemiBold');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 94%;
  descent-override: 23%;
  line-gap-override: 0%;
  size-adjust: 85%;
}`.trim();

const cssProperties = `  --gao-condensed-letter-spacing: 0em;
  --gao-condensed-line-height: 1.4;
  --gao-condensed-font-stretch: condensed;`;

registerFont('GaoCondensed', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-condensed',
    weights: [400, 600],
    category: 'condensed',
    cssProperties,
});

export { FAMILY as gaoCondensedFamily, FALLBACK as gaoCondensedFallback };
