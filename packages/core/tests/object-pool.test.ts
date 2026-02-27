import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../src/object-pool.js';

describe('ObjectPool', () => {
    function createPool(maxSize = 4, preWarm = 0) {
        let idCounter = 0;
        return new ObjectPool<{ id: number; value: string }>({
            factory: () => ({ id: ++idCounter, value: 'new' }),
            reset: (obj) => {
                obj.value = '';
            },
            maxSize,
            preWarm,
        });
    }

    it('should create objects via factory when pool is empty', () => {
        const pool = createPool();
        const obj = pool.acquire();
        expect(obj).toBeDefined();
        expect(obj.id).toBe(1);
        expect(obj.value).toBe('new');
    });

    it('should reuse released objects', () => {
        const pool = createPool();
        const obj1 = pool.acquire();
        obj1.value = 'modified';
        pool.release(obj1);

        const obj2 = pool.acquire();
        // Same reference, but reset
        expect(obj2).toBe(obj1);
        expect(obj2.value).toBe(''); // reset was called
    });

    it('should pre-warm pool on construction', () => {
        const pool = createPool(4, 3);
        expect(pool.available).toBe(3);

        // Acquire from pre-warmed pool (no factory call needed)
        const obj = pool.acquire();
        expect(obj).toBeDefined();
        expect(pool.available).toBe(2);
    });

    it('should not exceed maxSize', () => {
        const pool = createPool(2);
        const obj1 = pool.acquire();
        const obj2 = pool.acquire();
        const obj3 = pool.acquire();

        pool.release(obj1);
        pool.release(obj2);
        pool.release(obj3); // Exceeds maxSize — should be silently discarded

        expect(pool.available).toBe(2);
    });

    it('should track statistics correctly', () => {
        const pool = createPool(4, 2);

        // Acquire from pool (hit)
        const a = pool.acquire();
        expect(pool.missCount).toBe(0);

        // Acquire from pool (hit)
        pool.acquire();
        expect(pool.missCount).toBe(0);

        // Acquire from factory (miss — pool is now empty)
        pool.acquire();
        expect(pool.missCount).toBe(1);

        expect(pool.acquireCount).toBe(3);
        expect(pool.hitRatio).toBeCloseTo(2 / 3);

        pool.release(a);
        expect(pool.releaseCount).toBe(1);
    });

    it('should report hitRatio 0 when no acquires', () => {
        const pool = createPool();
        expect(pool.hitRatio).toBe(0);
    });

    it('should drain the pool', () => {
        const pool = createPool(4, 4);
        expect(pool.available).toBe(4);
        pool.drain();
        expect(pool.available).toBe(0);
    });

    it('should expose capacity', () => {
        const pool = createPool(16);
        expect(pool.capacity).toBe(16);
    });
});
