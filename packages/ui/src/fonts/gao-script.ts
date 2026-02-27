/**
 * @gao/ui — GaoScript Font
 *
 * Decorative script font with connected flowing strokes.
 * Use sparingly for testimonials and accent text.
 *
 * Weights: 400 (Regular)
 * Use case: Decorative accents, testimonials, signatures
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoScript';
const FALLBACK = "'Brush Script MT', 'Segoe Script', 'Apple Chancery', cursive";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 105%;
  descent-override: 35%;
  line-gap-override: 0%;
  size-adjust: 115%;
}`.trim();

const cssProperties = `  --gao-script-letter-spacing: 0.02em;
  --gao-script-line-height: 1.8;
  --gao-script-slant: 12deg;`;

registerFont('GaoScript', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-script',
    weights: [400],
    category: 'script',
    cssProperties,
});

export { FAMILY as gaoScriptFamily, FALLBACK as gaoScriptFallback };
