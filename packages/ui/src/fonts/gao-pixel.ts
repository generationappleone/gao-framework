/**
 * @gao/ui — GaoPixel Font
 *
 * Retro pixel/bitmap-style font aligned to an 8px grid.
 * Perfect for gaming dashboards and retro themes.
 *
 * Weights: 400 (Regular)
 * Use case: Retro themes, gaming UI, pixel art
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoPixel';
const FALLBACK = "'Courier New', 'Lucida Console', monospace";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E;
  ascent-override: 88%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 100%;
}`.trim();

const cssProperties = `  --gao-pixel-letter-spacing: 0.05em;
  --gao-pixel-line-height: 1.2;
  --gao-pixel-grid-size: 8px;
  --gao-pixel-rendering: pixelated;`;

registerFont('GaoPixel', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-pixel',
    weights: [400],
    category: 'pixel',
    cssProperties,
});

export { FAMILY as gaoPixelFamily, FALLBACK as gaoPixelFallback };
