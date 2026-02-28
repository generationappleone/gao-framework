/**
 * @gao/orm — Collection
 *
 * A wrapper for arrays of Model instances with chainable utility methods.
 * Provides Laravel-style collection operations: map, filter, pluck, groupBy, etc.
 */

export class Collection<T> {
    constructor(private items: T[]) { }

    /** Get the underlying array. */
    all(): T[] {
        return [...this.items];
    }

    /** Get the number of items. */
    count(): number {
        return this.items.length;
    }

    /** Check if the collection is empty. */
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    /** Check if the collection is not empty. */
    isNotEmpty(): boolean {
        return this.items.length > 0;
    }

    /** Get the first item. */
    first(): T | undefined {
        return this.items[0];
    }

    /** Get the last item. */
    last(): T | undefined {
        return this.items[this.items.length - 1];
    }

    /** Map each item with a callback. */
    map<U>(callback: (item: T, index: number) => U): Collection<U> {
        return new Collection(this.items.map(callback));
    }

    /** Filter items with a callback. */
    filter(callback: (item: T, index: number) => boolean): Collection<T> {
        return new Collection(this.items.filter(callback));
    }

    /** Iterate over each item. */
    each(callback: (item: T, index: number) => void): this {
        this.items.forEach(callback);
        return this;
    }

    /** Reduce items to a single value. */
    reduce<U>(callback: (accumulator: U, item: T, index: number) => U, initial: U): U {
        return this.items.reduce(callback, initial);
    }

    /** Pluck a single property from each item. */
    pluck<K extends keyof T>(key: K): Collection<T[K]> {
        return new Collection(this.items.map((item) => item[key]));
    }

    /** Key the collection by a property. */
    keyBy<K extends keyof T>(key: K): Map<T[K], T> {
        const map = new Map<T[K], T>();
        for (const item of this.items) {
            map.set(item[key], item);
        }
        return map;
    }

    /** Group items by a property. */
    groupBy<K extends keyof T>(key: K): Map<T[K], T[]> {
        const map = new Map<T[K], T[]>();
        for (const item of this.items) {
            const groupKey = item[key];
            if (!map.has(groupKey)) map.set(groupKey, []);
            map.get(groupKey)!.push(item);
        }
        return map;
    }

    /** Sort items by a property. */
    sortBy<K extends keyof T>(key: K, direction: 'asc' | 'desc' = 'asc'): Collection<T> {
        const sorted = [...this.items].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return new Collection(sorted);
    }

    /** Get unique items by a property. */
    unique<K extends keyof T>(key?: K): Collection<T> {
        if (key) {
            const seen = new Set<T[K]>();
            const result: T[] = [];
            for (const item of this.items) {
                if (!seen.has(item[key])) {
                    seen.add(item[key]);
                    result.push(item);
                }
            }
            return new Collection(result);
        }
        return new Collection([...new Set(this.items)]);
    }

    /** Sum a numeric property. */
    sum(key: keyof T): number {
        return this.items.reduce((acc, item) => acc + Number(item[key] ?? 0), 0);
    }

    /** Average a numeric property. */
    avg(key: keyof T): number {
        if (this.items.length === 0) return 0;
        return this.sum(key) / this.items.length;
    }

    /** Get the minimum of a numeric property. */
    min(key: keyof T): number {
        if (this.items.length === 0) return 0;
        return Math.min(...this.items.map((item) => Number(item[key] ?? Infinity)));
    }

    /** Get the maximum of a numeric property. */
    max(key: keyof T): number {
        if (this.items.length === 0) return 0;
        return Math.max(...this.items.map((item) => Number(item[key] ?? -Infinity)));
    }

    /** Convert all items to a plain array. */
    toArray(): T[] {
        return [...this.items];
    }

    /** Serialize all items to JSON. */
    toJSON(): unknown[] {
        return this.items.map((item) => {
            if (typeof (item as any).toJSON === 'function') {
                return (item as any).toJSON();
            }
            return item;
        });
    }

    /** Split the collection into chunks. */
    chunk(size: number): Collection<T>[] {
        const chunks: Collection<T>[] = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(new Collection(this.items.slice(i, i + size)));
        }
        return chunks;
    }

    /** Check if the collection contains a specific item. */
    contains(item: T): boolean;
    contains(key: keyof T, value: unknown): boolean;
    contains(itemOrKey: T | keyof T, value?: unknown): boolean {
        if (value !== undefined) {
            const key = itemOrKey as keyof T;
            return this.items.some((item) => item[key] === value);
        }
        return this.items.includes(itemOrKey as T);
    }

    /** Get items that are in this collection but not in the given array. */
    diff(other: T[]): Collection<T> {
        return new Collection(this.items.filter((item) => !other.includes(item)));
    }

    /** Merge another array into this collection. */
    merge(other: T[]): Collection<T> {
        return new Collection([...this.items, ...other]);
    }

    /** Find an item matching a callback. */
    find(callback: (item: T) => boolean): T | undefined {
        return this.items.find(callback);
    }

    /** Get model primary keys (assumes items have 'id' property). */
    modelKeys(): unknown[] {
        return this.items.map((item) => (item as any).id).filter(Boolean);
    }

    /** Load relations on all models in this collection. */
    async load(...relationNames: string[]): Promise<this> {
        for (const item of this.items) {
            if (typeof (item as any).load === 'function') {
                await (item as any).load(...relationNames);
            }
        }
        return this;
    }

    /** Make the collection iterable. */
    [Symbol.iterator](): Iterator<T> {
        let index = 0;
        const items = this.items;
        return {
            next(): IteratorResult<T> {
                if (index < items.length) {
                    return { value: items[index++]!, done: false };
                }
                return { value: undefined as any, done: true };
            },
        };
    }
}
