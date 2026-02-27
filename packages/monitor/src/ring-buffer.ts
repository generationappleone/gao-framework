/**
 * @gao/monitor — Ring Buffer
 *
 * Fixed-capacity circular buffer for bounded metric storage.
 * Overwrites oldest entries when full — O(1) insert, O(n) read.
 * Memory usage is constant regardless of throughput.
 */

export class RingBuffer<T> {
    private readonly buffer: (T | undefined)[];
    private head = 0;
    private _size = 0;

    constructor(private readonly capacity: number) {
        this.buffer = new Array(capacity);
    }

    /** Add an item. Overwrites the oldest item if buffer is full. */
    push(item: T): void {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this._size < this.capacity) this._size++;
    }

    /** Get all items in chronological order (oldest first). */
    toArray(): T[] {
        const result: T[] = [];
        const start = this._size < this.capacity ? 0 : this.head;
        for (let i = 0; i < this._size; i++) {
            const idx = (start + i) % this.capacity;
            result.push(this.buffer[idx] as T);
        }
        return result;
    }

    /** Get the most recent item, or undefined if empty. */
    last(): T | undefined {
        if (this._size === 0) return undefined;
        const idx = (this.head - 1 + this.capacity) % this.capacity;
        return this.buffer[idx];
    }

    /** Get last N items in chronological order. */
    lastN(n: number): T[] {
        const count = Math.min(n, this._size);
        const result: T[] = [];
        for (let i = this._size - count; i < this._size; i++) {
            const start = this._size < this.capacity ? 0 : this.head;
            const idx = (start + i) % this.capacity;
            result.push(this.buffer[idx] as T);
        }
        return result;
    }

    /** Number of items currently stored. */
    get size(): number {
        return this._size;
    }

    /** Maximum capacity. */
    get maxCapacity(): number {
        return this.capacity;
    }

    /** Whether the buffer is full and will overwrite on next push. */
    get isFull(): boolean {
        return this._size === this.capacity;
    }

    /** Clear all items. */
    clear(): void {
        this.buffer.fill(undefined);
        this.head = 0;
        this._size = 0;
    }
}
