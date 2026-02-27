/**
 * @gao/ui — Navigation Icon Set (20 icons)
 *
 * Icons: home, menu, arrows, chevrons, layout controls
 */

import type { GaoIconData } from '../icon-types.js';
import { registerIconSet } from '../icon-registry.js';

const set: Record<string, GaoIconData> = {
    'home': { path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z', accentPath: 'M10 21v-4a2 2 0 012-2h0a2 2 0 012 2v4' },
    'menu': { path: 'M4 6h16M4 12h16M4 18h16' },
    'arrow-up': { path: 'M12 19V5m0 0l-7 7m7-7l7 7' },
    'arrow-down': { path: 'M12 5v14m0 0l7-7m-7 7l-7-7' },
    'arrow-left': { path: 'M19 12H5m0 0l7 7m-7-7l7-7' },
    'arrow-right': { path: 'M5 12h14m0 0l-7-7m7 7l-7 7' },
    'chevron-up': { path: 'M18 15l-6-6-6 6' },
    'chevron-down': { path: 'M6 9l6 6 6-6' },
    'chevron-left': { path: 'M15 18l-6-6 6-6' },
    'chevron-right': { path: 'M9 18l6-6-6-6' },
    'external-link': { path: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-8h6m0 0v6m0-6L10 14' },
    'corner-up-right': { path: 'M15 14l5-5-5-5M4 20v-7a4 4 0 014-4h12' },
    'maximize': { path: 'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3' },
    'minimize': { path: 'M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3' },
    'move': { path: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20' },
    'more-horizontal': { path: 'M12 12h.01M8 12h.01M16 12h.01', strokeWidth: 3 },
    'more-vertical': { path: 'M12 12h.01M12 8h.01M12 16h.01', strokeWidth: 3 },
    'sidebar': { path: 'M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zM9 3v18', accentPath: 'M2 4a2 2 0 012-2h5v20H4a2 2 0 01-2-2V4z' },
    'layout': { path: 'M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zM2 9h20M9 9v12' },
    'grid-layout': { path: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
};

registerIconSet('navigation', set);

export default set;
