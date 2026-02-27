/**
 * @gao/core — Object Pool
 *
 * Generic, bounded object pool for reusing expensive-to-create objects.
 * Inspired by Apple's approach to resource management:
 * - Pre-warm: create N objects upfront for zero first-use latency.
 * - Bounded: pool never exceeds maxSize, excess released to GC.
 * - Reset-on-release: each object is cleaned before reuse.
 */

export interface ObjectPoolOptions<T> {
    /** Factory function to create new objects when pool is empty. */
    factory: () => T;
    /** Reset function to clean object state before reuse. */
    reset: (obj: T) => void;
    /** Maximum number of pooled objects. Default: 64. */
    maxSize?: number;
    /** Number of objects to pre-create on construction. Default: 0. */
    preWarm?: number;
}

export class ObjectPool<T> {
    private readonly pool: T[] = [];
    private readonly factory: () => T;
    private readonly resetFn: (obj: T) => void;
    private readonly maxSize: number;

    private _acquireCount = 0;
    private _releaseCount = 0;
    private _missCount = 0;

    constructor(options: ObjectPoolOptions<T>) {
        this.factory = options.factory;
        this.resetFn = options.reset;
        this.maxSize = options.maxSize ?? 64;

        // Pre-warm pool for zero first-use latency
        const preWarm = Math.min(options.preWarm ?? 0, this.maxSize);
        for (let i = 0; i < preWarm; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Acquire an object from the pool.
     * Returns a pooled object if available, otherwise creates a new one.
     */
    acquire(): T {
        this._acquireCount++;
        const obj = this.pool.pop();
        if (obj !== undefined) {
            return obj;
        }
        this._missCount++;
        return this.factory();
    }

    /**
     * Release an object back to the pool.
     * The object is reset before being stored.
     * If pool is at capacity, the object is discarded (let GC collect).
     */
    release(obj: T): void {
        this._releaseCount++;
        if (this.pool.length < this.maxSize) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
        // else: silently discard — GC will collect
    }

    /** Current number of objects available in the pool. */
    get available(): number {
        return this.pool.length;
    }

    /** Maximum pool capacity. */
    get capacity(): number {
        return this.maxSize;
    }

    /** Total acquire() calls. */
    get acquireCount(): number {
        return this._acquireCount;
    }

    /** Total release() calls. */
    get releaseCount(): number {
        return this._releaseCount;
    }

    /** Number of acquire() calls that required a factory() call (cache miss). */
    get missCount(): number {
        return this._missCount;
    }

    /** Hit ratio: 1.0 = all from pool, 0.0 = all factory-created. */
    get hitRatio(): number {
        if (this._acquireCount === 0) return 0;
        return 1 - this._missCount / this._acquireCount;
    }

    /** Drain the pool, discarding all objects. */
    drain(): void {
        this.pool.length = 0;
    }
}
