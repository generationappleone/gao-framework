/**
 * @gao/ui — GaoSans Font
 *
 * Primary body font — geometric sans-serif with tall x-height
 * and open counters. Designed for readability at all sizes.
 *
 * Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
 * Use case: Body text, UI labels, paragraphs
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoSans';
const FALLBACK = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: local('${FAMILY} Light');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: local('${FAMILY} Medium');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('${FAMILY} SemiBold');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+2190-21FF, U+2200-22FF;
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
  size-adjust: 100%;
}`.trim();

const cssProperties = `  --gao-sans-letter-spacing: -0.011em;
  --gao-sans-line-height: 1.5;
  --gao-sans-word-spacing: 0.01em;`;

registerFont('GaoSans', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-sans',
    weights: [300, 400, 500, 600, 700],
    category: 'sans',
    cssProperties,
});

export { FAMILY as gaoSansFamily, FALLBACK as gaoSansFallback };
