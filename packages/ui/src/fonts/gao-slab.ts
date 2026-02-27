/**
 * @gao/ui — GaoSlab Font
 *
 * Editorial slab-serif with bracketed serifs and newspaper feel.
 * Designed for blog posts and long-form reading.
 *
 * Weights: 400 (Regular), 700 (Bold)
 * Use case: Blog posts, editorial content, articles
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoSlab';
const FALLBACK = "'Rockwell', 'Courier Bold', 'Courier', Georgia, Times, 'Times New Roman', serif";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 92%;
  descent-override: 26%;
  line-gap-override: 0%;
  size-adjust: 102%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 92%;
  descent-override: 26%;
  line-gap-override: 0%;
  size-adjust: 102%;
}`.trim();

const cssProperties = `  --gao-slab-letter-spacing: 0.005em;
  --gao-slab-line-height: 1.7;
  --gao-slab-word-spacing: 0.02em;`;

registerFont('GaoSlab', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-slab',
    weights: [400, 700],
    category: 'slab',
    cssProperties,
});

export { FAMILY as gaoSlabFamily, FALLBACK as gaoSlabFallback };
