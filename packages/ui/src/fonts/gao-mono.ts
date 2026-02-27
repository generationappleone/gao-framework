/**
 * @gao/ui — GaoMono Font
 *
 * Code/terminal monospace font with distinct character shapes.
 * Features: dotted zero, slashed l, clear 1/I/l distinction.
 *
 * Weights: 400 (Regular), 700 (Bold)
 * Use case: Code blocks, IDE, terminal output
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoMono';
const FALLBACK = "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, 'Liberation Mono', Menlo, monospace";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 105%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 105%;
}`.trim();

const cssProperties = `  --gao-mono-letter-spacing: 0em;
  --gao-mono-line-height: 1.6;
  --gao-mono-tab-size: 4;`;

registerFont('GaoMono', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-mono',
    weights: [400, 700],
    category: 'mono',
    cssProperties,
});

export { FAMILY as gaoMonoFamily, FALLBACK as gaoMonoFallback };
