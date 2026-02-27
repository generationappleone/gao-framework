/**
 * @gao/ui — GaoRounded Font
 *
 * Friendly rounded sans-serif with fully rounded terminals.
 * Perfect for buttons, chips, badges, and approachable UI elements.
 *
 * Weights: 400 (Regular), 500 (Medium), 700 (Bold)
 * Use case: Buttons, chips, badges, friendly UI
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoRounded';
const FALLBACK = "'Nunito', 'Varela Round', system-ui, sans-serif";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 96%;
  descent-override: 24%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: local('${FAMILY} Medium');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 96%;
  descent-override: 24%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF;
  ascent-override: 96%;
  descent-override: 24%;
  line-gap-override: 0%;
  size-adjust: 100%;
}`.trim();

const cssProperties = `  --gao-rounded-letter-spacing: 0.01em;
  --gao-rounded-line-height: 1.5;
  --gao-rounded-border-radius: 9999px;`;

registerFont('GaoRounded', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-rounded',
    weights: [400, 500, 700],
    category: 'rounded',
    cssProperties,
});

export { FAMILY as gaoRoundedFamily, FALLBACK as gaoRoundedFallback };
