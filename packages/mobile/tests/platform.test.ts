import { describe, it, expect, afterEach } from 'vitest';
import { Platform } from '../src/platform.js';

describe('Platform Detection', () => {
    afterEach(() => {
        Platform.__reset();
    });

    it('should detect web by default in Node.js', () => {
        expect(Platform.current).toBe('web');
        expect(Platform.is('web')).toBe(true);
        expect(Platform.is('desktop')).toBe(false);
        expect(Platform.is('mobile')).toBe(false);
    });

    it('should allow overriding for tests', () => {
        Platform.__setForTesting('desktop');
        expect(Platform.is('desktop')).toBe(true);
        expect(Platform.is('web')).toBe(false);

        Platform.__setForTesting('mobile');
        expect(Platform.is('mobile')).toBe(true);
    });
});
