/**
 * @gao/ui — GaoHandwriting Font
 *
 * Casual handwriting font with variable stroke width
 * and slightly irregular baseline for natural feel.
 *
 * Weights: 400 (Regular)
 * Use case: Annotations, notes, sketches, casual accents
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoHandwriting';
const FALLBACK = "'Comic Sans MS', 'Comic Neue', 'Segoe Print', cursive";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 100%;
  descent-override: 30%;
  line-gap-override: 0%;
  size-adjust: 108%;
}`.trim();

const cssProperties = `  --gao-handwriting-letter-spacing: 0.01em;
  --gao-handwriting-line-height: 1.8;
  --gao-handwriting-baseline-shift: 1px;`;

registerFont('GaoHandwriting', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-handwriting',
    weights: [400],
    category: 'handwriting',
    cssProperties,
});

export { FAMILY as gaoHandwritingFamily, FALLBACK as gaoHandwritingFallback };
