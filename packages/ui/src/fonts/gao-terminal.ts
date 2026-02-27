/**
 * @gao/ui — GaoTerminal Font
 *
 * Terminal/CLI monospace with amber phosphor aesthetic.
 * Designed for hacker terminal and CLI output displays.
 *
 * Weights: 400 (Regular), 700 (Bold)
 * Use case: CLI output, hacker terminal, system monitor
 */

import { registerFont } from './font-registry.js';

const FAMILY = 'GaoTerminal';
const FALLBACK = "'VT323', 'Glass TTY', 'Lucida Console', 'Courier New', monospace";

const fontFace = `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('${FAMILY}');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2500-257F;
  ascent-override: 88%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 100%;
}

@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('${FAMILY} Bold');
  unicode-range: U+0020-007E, U+00A0-00FF, U+2500-257F;
  ascent-override: 88%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 100%;
}`.trim();

const cssProperties = `  --gao-terminal-letter-spacing: 0em;
  --gao-terminal-line-height: 1.3;
  --gao-terminal-color: #33ff33;
  --gao-terminal-bg: #0a0a0a;
  --gao-terminal-cursor: block;`;

registerFont('GaoTerminal', {
    family: FAMILY,
    fontFace,
    fallback: FALLBACK,
    cssVariable: '--gao-font-terminal',
    weights: [400, 700],
    category: 'terminal',
    cssProperties,
});

export { FAMILY as gaoTerminalFamily, FALLBACK as gaoTerminalFallback };
