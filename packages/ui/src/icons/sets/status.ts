/**
 * @gao/ui — Status Icon Set (20 icons)
 */
import type { GaoIconData } from '../icon-types.js';
import { registerIconSet } from '../icon-registry.js';

const set: Record<string, GaoIconData> = {
    'check-circle': { path: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3', accentPath: 'M12 22a10 10 0 100-20 10 10 0 000 20z' },
    'x-circle': { path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6' },
    'alert-triangle': { path: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
    'alert-circle': { path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01' },
    'info': { path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01' },
    'help-circle': { path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01' },
    'clock': { path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2' },
    'timer': { path: 'M12 22a9 9 0 100-18 9 9 0 000 18zM12 8v4l3 3M10 2h4M21 6l-2 2' },
    'shield': { path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    'shield-check': { path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', accentPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    'lock': { path: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4' },
    'unlock': { path: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1' },
    'eye': { path: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z' },
    'eye-off': { path: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22' },
    'loader': { path: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
    'loading-dots': { path: 'M12 6V2M12 22v-4M6 12H2M22 12h-4', strokeWidth: 3 },
    'zap': { path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', accentPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    'activity': { path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    'bar-chart-alt': { path: 'M4 20h16M4 20V10M8 20V4M12 20v-8M16 20V8M20 20v-6' },
    'trending-up': { path: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
};

registerIconSet('status', set);
export default set;
