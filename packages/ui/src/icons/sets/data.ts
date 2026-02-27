/**
 * @gao/ui — Data Icon Set (20 icons)
 */
import type { GaoIconData } from '../icon-types.js';
import { registerIconSet } from '../icon-registry.js';

const set: Record<string, GaoIconData> = {
    'chart-bar': { path: 'M12 20V10M18 20V4M6 20v-4' },
    'chart-line': { path: 'M3 3v18h18M7 16l4-8 4 4 6-10' },
    'chart-pie': { path: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10h10z', accentPath: 'M22 12A10 10 0 0012 2v10h10z' },
    'chart-area': { path: 'M3 3v18h18M7 16l4-8 4 4 6-10v14H7z', accentPath: 'M7 16l4-8 4 4 6-10v14H7z' },
    'database': { path: 'M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zM2 6c0 2.21 4.48 4 10 4s10-1.79 10-4M2 12c0 2.21 4.48 4 10 4s10-1.79 10-4' },
    'filter': { path: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z' },
    'sort-asc': { path: 'M3 8l4-4 4 4M7 4v16M11 12h4M11 16h7M11 20h10' },
    'sort-desc': { path: 'M3 16l4 4 4-4M7 20V4M11 12h4M11 8h7M11 4h10' },
    'layers': { path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', accentPath: 'M2 12l10 5 10-5' },
    'list': { path: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    'table': { path: 'M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zM2 9h20M2 15h20M9 3v18M15 3v18' },
    'columns': { path: 'M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h7M12 3v18' },
    'rows': { path: 'M3 12h18M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z' },
    'inbox': { path: 'M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z' },
    'archive': { path: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4' },
    'folder': { path: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z' },
    'folder-open': { path: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v.5M2 10h20l-2.5 9H4.5L2 10z' },
    'file': { path: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z M13 2v7h7' },
    'file-text': { path: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7zM13 2v7h7M16 13H8M16 17H8M10 9H8' },
    'clipboard': { path: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z' },
};

registerIconSet('data', set);
export default set;
