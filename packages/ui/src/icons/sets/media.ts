/**
 * @gao/ui — Media Icon Set (20 icons)
 */
import type { GaoIconData } from '../icon-types.js';
import { registerIconSet } from '../icon-registry.js';

const set: Record<string, GaoIconData> = {
    'play': { path: 'M5 3l14 9-14 9V3z', accentPath: 'M5 3l14 9-14 9V3z' },
    'pause': { path: 'M6 4h4v16H6zM14 4h4v16h-4z' },
    'stop': { path: 'M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z' },
    'skip-forward': { path: 'M5 4l10 8-10 8V4zM19 5v14' },
    'skip-back': { path: 'M19 20L9 12l10-8v16zM5 19V5' },
    'volume': { path: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07' },
    'volume-mute': { path: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6' },
    'image': { path: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21' },
    'video': { path: 'M15.6 11.6L22 7v10l-6.4-4.6v-1zM4 5h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z' },
    'music': { path: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z' },
    'camera': { path: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z' },
    'mic': { path: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8' },
    'mic-off': { path: 'M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .73-.11 1.43-.32 2.09M12 19v4M8 23h8' },
    'film': { path: 'M19.82 2H4.18A2.18 2.18 0 002 4.18v15.64A2.18 2.18 0 004.18 22h15.64A2.18 2.18 0 0022 19.82V4.18A2.18 2.18 0 0019.82 2zM7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5' },
    'radio': { path: 'M12 14a2 2 0 100-4 2 2 0 000 4zM16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14' },
    'headphones': { path: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z' },
    'speaker': { path: 'M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM12 18a4 4 0 100-8 4 4 0 000 8zM12 8a1 1 0 100-2 1 1 0 000 2z' },
    'cast': { path: 'M2 16.1A5 5 0 015.9 20M2 12.05A9 9 0 019.95 20M2 8V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-6M2 20h.01' },
    'airplay': { path: 'M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1M12 15l5 6H7l5-6z' },
    'tv': { path: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM17 2l-5 5-5-5' },
};

registerIconSet('media', set);
export default set;
