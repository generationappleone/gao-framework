/**
 * @gao/ui — GaoDisplay Font
 *
 * Wide display sans-serif for hero headings and marketing pages.
 * Extra letter-spacing, flat terminals, bold impact.
 *
 * Weights: 700 (Bold), 900 (Black)
 * Use case: Hero headings, landing pages, marketing
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoDisplay';
const FALLBACK = "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 100%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 110%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: local('${FAMILY} Black');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 100%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 110%;
}`.trim();

const cssProperties = `  --gao-display-letter-spacing: 0.02em;
  --gao-display-line-height: 1.1;
  --gao-display-text-transform: uppercase;`;

registerFont('GaoDisplay', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-display',
    weights: [700, 900],
    category: 'display',
    cssProperties,
});

export { FAMILY as gaoDisplayFamily, FALLBACK as gaoDisplayFallback };
